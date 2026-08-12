import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learning OS · 个人博客",
  description: "记录学习、构建与复盘的个人博客。",
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
