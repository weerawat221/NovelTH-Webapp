import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NovelTH — อ่านนิยายออนไลน์",
  description:
    "แพลตฟอร์มอ่านและเผยแพร่นิยายออนไลน์ที่ดีที่สุด อ่านนิยายแฟนตาซี โรแมนติก สืบสวน และอีกมากมาย",
  keywords: ["นิยาย", "อ่านนิยาย", "นิยายออนไลน์", "novel", "NovelTH"],
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
