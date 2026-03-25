import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pillion — Ride Together",
  description: "Bike pooling for college students and corporates",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`min-h-screen bg-white text-slate-900 font-sans antialiased`}>{children}</body>
    </html>
  );
}
