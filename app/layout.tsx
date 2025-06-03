import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "吃啥 - 解决选择困难症的终极神器",
  description: "不知道吃什么？让吃啥来帮你决定！随机推荐美食，支持菜品和饮品搭配，告别选择困难症。",
  keywords: ["吃什么", "美食推荐", "随机选择", "菜品", "饮品", "选择困难症"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
