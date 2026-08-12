import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "embedded.log · Embedded Systems & Electronics",
  description: "记录嵌入式开发、电子设计与技术实践。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
