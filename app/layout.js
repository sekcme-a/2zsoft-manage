import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PopupOverlay from "@/components/PopupOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "관리자페이지 - 2Zsoft",
  description: "이지소프트 관리자페이지",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-white`}
    >
      <body className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}
