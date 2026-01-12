import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ระบบสั่งอาหารคาเฟ่",
  description: "ระบบสั่งอาหารง่ายๆ สำหรับคาเฟ่",
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
