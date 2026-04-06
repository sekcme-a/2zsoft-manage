"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function PopupOverlay({ companyId }) {
  const [popups, setPopups] = useState([]);
  const [visiblePopups, setVisiblePopups] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchVisiblePopups = async () => {
      // 1. 활성화된 팝업 가져오기
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error || !data) return;

      // 2. 24시간 숨기기 로직 체크
      const now = new Date().getTime();
      const filtered = data.filter((popup) => {
        const expireTime = localStorage.getItem(`hide_popup_${popup.id}`);
        if (expireTime && now < parseInt(expireTime)) {
          return false;
        }
        return true;
      });

      setPopups(filtered);
      setVisiblePopups(filtered);
    };

    fetchVisiblePopups();
  }, [companyId]);

  const closePopup = (id) => {
    setVisiblePopups((prev) => prev.filter((p) => p.id !== id));
  };

  const hideFor24Hours = (id) => {
    const expiry = new Date().getTime() + 24 * 60 * 60 * 1000;
    localStorage.setItem(`hide_popup_${id}`, expiry.toString());
    closePopup(id);
  };

  if (visiblePopups.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex items-start justify-start p-6 md:p-10 gap-6 overflow-visible">
      <AnimatePresence>
        {visiblePopups.map((popup, index) => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              zIndex: 1000 - (popup.sort_order || index),
              pointerEvents: "auto",
              // 여러 팝업이 겹치지 않게 약간의 간격을 주려면 아래 주석을 해제하세요
              // marginLeft: index * 20 + "px",
              // marginTop: index * 20 + "px"
            }}
            className="absolute bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col w-[320px] md:w-[400px]"
          >
            {/* 팝업 이미지 */}
            <div
              className="relative cursor-pointer overflow-hidden group"
              onClick={() =>
                popup.link_url && window.open(popup.link_url, "_blank")
              }
            >
              <img
                src={popup.image_url}
                alt={popup.title}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* 제목 섹션 (이미지 아래 작은 글씨) */}
            {popup.title && (
              <div className="px-6 pt-3 pb-1">
                <p className="text-[14px] font-semibold text-gray-700 truncate">
                  {popup.title}
                </p>
              </div>
            )}

            {/* 하단 컨트롤 바 */}
            <div className="flex items-center justify-between px-6 py-4 bg-white">
              <button
                onClick={() => hideFor24Hours(popup.id)}
                className="text-[12px] font-medium text-gray-400 hover:text-black transition-colors"
              >
                오늘 하루 보지 않기
              </button>

              <button
                onClick={() => closePopup(popup.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-[12px] font-bold text-gray-700 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                닫기
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
