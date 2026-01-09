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

// 수정 포인트: 사이트 이름, 설명, 아이콘 정보를 한글로 업데이트했습니다.
export const metadata: Metadata = {
  title: "시선교회 성경통독 181 🌈",
  description: "181일 동안 함께하는 시선 공동체 성경 통독 캠페인",
  icons: {
    icon: "/favicon.ico", // public 폴더에 넣은 아이콘 파일 이름
  },
  openGraph: {
    title: "시선교회 성경통독 181 🌈",
    description: "말씀으로 하나되는 시선 공동체",
    images: [
      {
        url: "/thumbnail.png", // public 폴더에 넣을 썸네일 이미지 이름
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko"> {/* 언어 설정을 한국어(ko)로 변경했습니다. */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}