import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Orbitron, Playfair_Display } from "next/font/google";
import "./globals.css";
import LenisProvider from "../components/global/lenisProvider";
import AppShell from "@/components/global/AppShell";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Mihir's Portfolio | Full Stack & AI Systems Engineer",
  description: "High-performance portfolio of Mihir Patil featuring AI Copilot, interactive knowledge graphs, and engineering dossiers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", geistSans.variable, geistMono.variable, orbitron.variable, playfair.variable, "font-sans", inter.variable)}
    >
      <body suppressHydrationWarning className="relative lg:cursor-none bg-black">
        <LenisProvider>
          <AppShell>
            {children}
          </AppShell>
        </LenisProvider>
      </body>
    </html>
  );
}
