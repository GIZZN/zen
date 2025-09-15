import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./Components/header/Header";
import { AuthProvider } from "./contexts/AuthContext";
import { GlobalAudioProvider } from "./contexts/GlobalAudioContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zēn",
  description: "Zēn веб плеер",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <GlobalAudioProvider>
            <Header />
            {children}
          </GlobalAudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
