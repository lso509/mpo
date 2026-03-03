import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gtFlexa = localFont({
  src: [
    { path: "./fonts/GT-Flexa/GT-Flexa-Standard-Thin.otf", weight: "100", style: "normal" },
    { path: "./fonts/GT-Flexa/GT-Flexa-Standard-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/GT-Flexa/GT-Flexa-Standard-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/GT-Flexa/GT-Flexa-Standard-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/GT-Flexa/GT-Flexa-Standard-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/GT-Flexa/GT-Flexa-Standard-Black.otf", weight: "900", style: "normal" },
    { path: "./fonts/GT-Flexa/GT-Flexa-Standard-Regular-Italic.otf", weight: "400", style: "italic" },
    { path: "./fonts/GT-Flexa/GT-Flexa-Standard-Bold-Italic.otf", weight: "700", style: "italic" },
  ],
  variable: "--font-gt-flexa",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediaPlan App – Agentur-Dashboard",
  description: "MediaPlan App für Agenturen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${gtFlexa.variable} ${geistSans.variable} ${geistMono.variable}`}>
      <body className={`${gtFlexa.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
