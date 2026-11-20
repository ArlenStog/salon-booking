import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fade & Co. — book your barber",
  description: "Online appointment booking for a barbershop. Next.js, PostgreSQL, TanStack Query, Claude.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">{children}</main>
          <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
            Demo project · Next.js · PostgreSQL · TanStack Query · Claude API
          </footer>
        </Providers>
      </body>
    </html>
  );
}
