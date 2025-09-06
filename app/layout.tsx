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
  title: "Cohorte - Script analysis with AI",
  description: "Script and content analysis with persona generation and smart comments",
  keywords: "script analysis, personas, AI, comments, writing, marketing",
  authors: [{ name: "Anis Ayari" }],
  creator: "Anis Ayari",
  publisher: "Cohorte",
  openGraph: {
    title: "Cohorte - Script analysis with AI",
    description: "Analyze your scripts with AI‑generated personas",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cohorte - Script analysis with AI",
    description: "Analyze your scripts with AI‑generated personas",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
