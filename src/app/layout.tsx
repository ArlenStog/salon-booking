import type { Metadata } from "next";
import { Bodoni_Moda, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import { Providers } from "./providers";
import "./globals.css";

const bodoni = Bodoni_Moda({ variable: "--font-bodoni", subsets: ["latin", "latin-ext"], style: ["normal", "italic"] });
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin", "latin-ext"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin", "latin-ext"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Fade & Co. — Barbershop, Belgrade",
  description: "Book a haircut or a beard trim at Fade & Co. in under a minute.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodoni.variable} ${instrument.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 sm:py-16">{children}</main>
          <footer className="border-t border-rule">
            <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 text-sm sm:grid-cols-3 sm:px-8">
              <div>
                <p className="font-display text-2xl italic">Fade &amp; Co.</p>
                <p className="mt-1 text-muted">Barbershop · Belgrade</p>
              </div>
              <div>
                <p className="eyebrow">Hours</p>
                <p className="mt-2 font-mono text-[13px]">Mon–Fri 09:00–17:00</p>
                <p className="font-mono text-[13px]">Sat 09:00–14:00 · Sun closed</p>
              </div>
              <div className="sm:text-right">
                <p className="eyebrow">Colophon</p>
                <p className="mt-2 text-muted">Demo project built with Next.js, PostgreSQL and the Claude API.</p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
