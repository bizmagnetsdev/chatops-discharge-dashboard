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

import type { Metadata } from "next";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "ChatOps.health Dashboard | Real-Time Discharge Coordination",
  description: "Monitor discharge progress, identify bottlenecks, track pending tasks, and coordinate departments in real time.",
  icons: {
    icon: "/h-logo.png",
    shortcut: "/h-logo.png",
    apple: "/h-logo.png",
  },
  openGraph: {
    title: "ChatOps.health Dashboard | Real-Time Discharge Coordination",
    description: "Monitor discharge progress, identify bottlenecks, track pending tasks, and coordinate departments in real time.",
    url: "https://dashboard.chatops.health",
    siteName: "ChatOps.health",
    images: [
      {
        url: "https://dashboard.chatops.health/dashboard-og.jpg",
        width: 1200,
        height: 630,
        alt: "ChatOps.health Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatOps.health Dashboard | Real-Time Discharge Coordination",
    description: "Monitor discharge progress, identify bottlenecks, track pending tasks, and coordinate departments in real time.",
    images: ["https://dashboard.chatops.health/dashboard-og.jpg"],
  },
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
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
