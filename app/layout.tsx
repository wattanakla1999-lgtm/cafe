import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ระบบจัดการร้านคาเฟ่ - Cafe POS System",
  description: "ระบบจัดการร้านคาเฟ่ครบวงจร คิดเงิน จัดการสต็อก ดูยอดขาย รองรับมือถือและแท็บเล็ต ใช้งานง่าย เริ่มต้นฟรี",
  keywords: ["ระบบจัดการร้านกาแฟ", "Cafe POS", "Coffee Shop Management", "POS System", "ระบบคิดเงินร้านกาแฟ", "โปรแกรมคิดเงิน"],
  authors: [{ name: "Kla" }], // Update with real author if known
  metadataBase: new URL("https://justcafesystem.xyz"),
  openGraph: {
    title: "ระบบจัดการร้านคาเฟ่ - Cafe POS System",
    description: "ระบบจัดการร้านกาแฟที่ช่วยให้คุณดูแลร้านได้ง่ายขึ้น ครบจบในที่เดียว",
    type: "website",
    locale: "th_TH",
    url: "https://justcafesystem.xyz",
    // images: ["/og-image.jpg"], // Add an OG image in public folder for better sharing
  },
  twitter: {
    card: "summary_large_image",
    title: "ระบบจัดการร้านคาเฟ่ - Cafe POS System",
    description: "ระบบจัดการร้านกาแฟที่ช่วยให้คุณดูแลร้านได้ง่ายขึ้น",
    // images: ["/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "OfLgQw2PPxAMX4atBuGqcAycRIkoMY0x-ltAUNWIgU8",
  },
};

import { Providers } from "../components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${prompt.variable}`}>
      <body className="antialiased font-sans">
        {/* Force Rebuild 1 */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
