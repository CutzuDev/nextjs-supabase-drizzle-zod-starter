import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { NextIntlClientProvider } from "next-intl";
import Nav from "@/components/nav/nav";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Title",
  description: "Description",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body className={`${geistSans.className} antialiased`}>
        <Suspense>
          <NextIntlClientProvider>
            <Nav/>
            {children}
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
