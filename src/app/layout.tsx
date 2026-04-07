import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import VraagDennis from "@/components/VraagDennis";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SPIRIT Solar Yield Calculator",
  description:
    "Bereken de opbrengst van verticale zonnepanelen op elke locatie wereldwijd — SPIRIT solar power supply",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${openSans.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#EDEAE5] text-[#1A1B1A] font-[var(--font-open-sans)]">
        {children}
        <VraagDennis />
      </body>
    </html>
  );
}
