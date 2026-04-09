# Project Setup Guide

Stack: Next.js + Supabase + Drizzle + shadcn/ui + Zod + i18n

Reference: Current project structure in `/home/alex/personal/forms_test`

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

See `components.json` in the current project:
- Style: `radix-luma`
- Base color: `taupe`
- CSS variables: enabled
- Icon library: `lucide`

---

## 3. Install all dependencies

```bash
bun add drizzle-orm postgres zod next-intl
bun add -d drizzle-kit
```

Current versions (see `package.json`):
```json
{
  "drizzle-orm": "^0.45.2",
  "postgres": "^3.4.9",
  "zod": "^4.3.6",
  "next-intl": "^4.9.0",
  "drizzle-kit": "^0.31.10"
}
```

---

## 4. Configure environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

---

## 5. Set up Drizzle

### `drizzle.config.ts`

```ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle/out',
  schema: './lib/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Key points:
- Output migrations to `./drizzle/out`
- Schema file at `./lib/drizzle/schema.ts`
- Load env vars with `dotenv/config`

### `lib/drizzle/schema.ts`

```ts
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 256 }),
});
```

### `lib/drizzle/index.ts`

```ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client);
```

### Generate and run migrations

```bash
bun drizzle-kit generate
bun drizzle-kit migrate
```

---

## 6. Set up Zod

No config needed. Use directly:

```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

For server actions:

```ts
const result = loginSchema.safeParse(formData);
if (!result.success) {
  return { error: result.error.flatten().fieldErrors };
}
```

---

## 7. Set up i18n (next-intl)

### Folder structure

```
i18n/
  routing.ts
messages/
  en.json
  ro.json
middleware.ts
```

### `i18n/routing.ts`

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ro"],
  defaultLocale: "en",
});
```

Update `locales` array to match your supported languages.

### `messages/en.json`

```json
{
  "auth": {
    "login": "Sign in",
    "logout": "Sign out"
  }
}
```

### `messages/ro.json`

```json
{
  "auth": {
    "login": "Logheaza-te",
    "logout": "Deloghează-te"
  }
}
```

Create a JSON file for each locale in `routing.locales`.

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

### `proxy.ts`

Next.js 16 renamed `middleware.ts` to `proxy.ts` and the exported function from `middleware` to `proxy`.

```ts
import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

> **Note:** `next-intl/middleware` (`createMiddleware`) is not compatible with Next.js 16's proxy system at the time of writing. Do not use it in `proxy.ts` — it will cause a module evaluation error that prevents the `proxy` export from being recognized. Locale detection is handled via the `[locale]` dynamic segment in the app router instead.

### Move routes under `[locale]`

```
app/
  [locale]/
    layout.tsx
    page.tsx
    protected/
      page.tsx
    auth/
      login/
      sign-up/
```

### `app/[locale]/layout.tsx`

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export default async function LocaleLayout({ 
  children, 
  params 
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
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

Replace with clean content (remove Supabase hero section, gradient text, feature cards):

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* your content */}
    </main>
  );
}
```

### `app/[locale]/protected/page.tsx`

Remove the user claims JSON dump and info banner:

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
    <div className="flex-1 w-full flex flex-col gap-12">
      {/* your protected content */}
    </div>
  );
}
```

### Delete boilerplate files

```bash
rm app/opengraph-image.png app/twitter-image.png
```

### Update metadata in root layout

Change the title and description to your project:

```tsx
export const metadata: Metadata = {
  title: "My Project",
  description: "My project description",
};
```

---

## 9. Important: After upgrading packages

If you run `bun update --latest` after initial setup, **re-run the shadcn init**:

```bash
bun update --latest
bunx --bun shadcn@latest init --preset b3lpuuR3w --template next
```

This regenerates `postcss.config.mjs`, `globals.css`, and `tailwind.config.ts` for the new Tailwind version. Upgrading from Tailwind v3 → v4 is a breaking change that won't work without this step.
