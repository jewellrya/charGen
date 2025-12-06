import type { Metadata } from "next";
import { Tiny5 } from "next/font/google";
import "./globals.css";
import { MusicProvider } from "../components/MusicProvider";
import SiteHeader from "../components/SiteHeader";

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
      <body className={`${tiny5.className} antialiased max-w-6xl px-5 pb-12 mx-auto h-screen md:overflow-hidden`}>
        <MusicProvider>
          <div className="flex flex-col h-full overflow-hidden">
            <SiteHeader />
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {children}
            </div>
          </div>
        </MusicProvider>
      </body>
    </html>
  );
}
