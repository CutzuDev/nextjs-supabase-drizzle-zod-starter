import Link from "next/link";
import LocaleMenu from "./localemenu";
import { Suspense } from "react";
import { AuthButton } from "../auth-button";
import { getLocale } from "next-intl/server";
export default async function Nav() {
  
  const locale = await getLocale() as "en" | "ro";
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-5 items-center font-semibold">
          <Link href={"/"}>Next.js Supabase Starter</Link>
        </div>
        <LocaleMenu locale={locale} />
        <Suspense>
          <AuthButton />
        </Suspense>
      </div>
    </nav>
  );
}
