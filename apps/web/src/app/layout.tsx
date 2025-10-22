import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "charGen",
  description: "charGen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="scroll" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased max-w-6xl px-5 mx-auto`}
      >
        <header className="flex items-start justify-between gap-6 py-8 md:py-12">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight">charGen</h1>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
