import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PatientAuthProvider } from "@/lib/contexts/PatientAuthContext";
import FirebaseInitializer from "@/lib/firebase/FirebaseInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clinic OS - Hospital Management System",
  description: "Complete clinic and hospital management system with patient portal",
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
        <FirebaseInitializer />
        <PatientAuthProvider>
          {children}
        </PatientAuthProvider>
      </body>
    </html>
  );
}
