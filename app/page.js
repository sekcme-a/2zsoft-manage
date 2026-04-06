"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export default function SimpleRedirectPage() {
  const targetUrl = "https://2zsoft.com/admin/login"; // 그룹아이디 없이 고정된 경로

  return (
    <div className="h-screen -mt-16 flex flex-col items-center justify-center bg-white font-sans antialiased text-[#1d1d1f]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center px-6"
      >
        <h1 className="text-[40px] md:text-[56px] font-semibold tracking-tight leading-tight mb-4">
          2Zsoft 관리자 페이지
        </h1>

        <p className="text-[19px] md:text-[21px] text-[#86868b] font-medium mb-12 max-w-[500px] mx-auto leading-relaxed">
          홈페이지 ID로 관리자 시스템에 접속하세요.
        </p>

        <div className="flex flex-col items-center gap-6">
          <p className="group flex items-center gap-1 text-[19px] md:text-[21px] font-medium text-[#0066cc] hover:underline transition-all">
            2zsoft.vercel.app/홈페이지ID/login
            <ChevronRight className="w-5 h-5 mt-0.5 group-hover:translate-x-1 transition-transform" />
          </p>

          {/* <a
            href={targetUrl}
            className="mt-4 px-8 py-3 bg-[#0071e3] text-white rounded-full text-[17px] font-medium hover:bg-[#0077ed] transition-colors"
          >
            지금 방문하기
          </a> */}
        </div>
      </motion.div>

      {/* 하단 저작권 표시 (Apple 푸터 스타일) */}
      <footer className="absolute bottom-12 text-[12px] text-[#86868b] font-medium">
        Copyright © 2026 2ZSOFT Inc. All rights reserved.
      </footer>
    </div>
  );
}
