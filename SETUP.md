# Project Setup Guide

Stack: Next.js + Supabase + Drizzle + shadcn/ui + Zod + i18n

---

## 1. Create the app

```bash
bunx create-next-app --example with-supabase my-app
cd my-app
```

---

## 2. Init shadcn

Run this **before** anything else that touches CSS or Tailwind config. It generates `globals.css`, `postcss.config.mjs`, `tailwind.config.ts`, and `components.json`.

```bash
bunx --bun shadcn@latest init --preset b3lpuuR3w --template next
```

---

## 3. Install all dependencies

```bash
bun add drizzle-orm postgres zod next-intl
bun add -d drizzle-kit
```

---

## 4. Configure environment variables

Copy the example and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

The `DATABASE_URL` is found in your Supabase dashboard under **Settings → Database → Connection string → URI**.

---

## 5. Set up Drizzle

### `drizzle.config.ts`

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### `db/schema.ts`

```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### `db/index.ts`

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### Generate and run migrations

```bash
bun drizzle-kit generate
bun drizzle-kit migrate
```

---

## 6. Set up Zod

No config needed. Import and use directly:

```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

For server actions, validate at the boundary:

```ts
const result = loginSchema.safeParse(formData);
if (!result.success) {
  return { error: result.error.flatten().fieldErrors };
}
```

---

## 7. Set up i18n (next-intl)

### File structure

```
messages/
  en.json
  fr.json
i18n/
  routing.ts
  request.ts
middleware.ts
```

### `messages/en.json`

```json
{
  "auth": {
    "login": "Sign in",
    "signup": "Sign up",
    "logout": "Sign out"
  }
}
```

### `i18n/routing.ts`

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
});
```

### `i18n/request.ts`

```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### `middleware.ts`

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
```

### Move app routes under `[locale]`

Rename `app/` structure so all routes are under `app/[locale]/`:

```
app/
  [locale]/
    layout.tsx   ← wrap with NextIntlClientProvider
    page.tsx
    protected/
      page.tsx
    auth/
      ...
```

### `app/[locale]/layout.tsx`

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### Using translations

```tsx
import { useTranslations } from "next-intl";

export function AuthButton() {
  const t = useTranslations("auth");
  return <button>{t("login")}</button>;
}
```

---

## 8. Remove boilerplate

### `app/[locale]/page.tsx`

The default template ships a hero section with gradient text, feature cards, and a "Deploy to Vercel" block. Replace the entire file:

```tsx
export default function Home() {
  return (
    <main>
      {/* your content */}
    </main>
  );
}
```

### `app/[locale]/protected/page.tsx`

Remove the user claims dump and info banner. Keep only the auth redirect logic:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div>
      {/* your protected content */}
    </div>
  );
}
```

### `app/[locale]/layout.tsx`

Remove the `"Next.js and Supabase Starter Kit"` title and description from metadata. Update to your project name.

### Files you can delete entirely

| File | Reason |
|------|--------|
| `app/opengraph-image.png` | Supabase branding |
| `app/twitter-image.png` | Supabase branding |

---

## 9. If you upgrade packages after setup

If you run `bun update --latest` after the initial setup, re-run the shadcn init to regenerate configs for the new versions:

```bash
bun update --latest
bunx --bun shadcn@latest init --preset b3lpuuR3w --template next
```

Tailwind v3 → v4 in particular is a breaking change that changes `postcss.config.mjs` and `globals.css` syntax. The init command handles this automatically.
