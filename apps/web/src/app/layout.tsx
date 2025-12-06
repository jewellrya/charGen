import type { Metadata } from "next";
import { Tiny5 } from "next/font/google";
import "./globals.css";
import { MusicProvider } from "../components/MusicProvider";

const tiny5 = Tiny5({
  variable: "--font-tiny5",
  subsets: ["latin"],
  weight: "400",
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
      <body className={`${tiny5.className} antialiased max-w-6xl px-5 mx-auto`}>
        <MusicProvider>{children}</MusicProvider>
      </body>
    </html>
  );
}
