import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GVHS National Honor Society",
  description: "Great Valley High School National Honor Society - Recognizing Scholarship, Leadership, Service, and Character",
  keywords: ["NHS", "National Honor Society", "Great Valley High School", "scholarship", "leadership", "service", "character"],
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
        <AuthProvider>
          <ScrollToTop />
          <Navbar />
          <OnboardingGate />
          <main className="pt-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
