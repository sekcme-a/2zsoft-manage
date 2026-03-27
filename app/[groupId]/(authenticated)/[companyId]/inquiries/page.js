"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare, ArrowRight, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { Download } from "lucide-react";
export default function InquiryHub() {
  const [role, setRole] = useState(null);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { groupId, companyId } = useParams();
  const supabase = createClient();
  const router = useRouter();
  const fetchInquiryForms = async () => {
    // 문의창 목록과 각 문의창의 읽지 않은 개수를 가져옵니다.
    const { data: formsData } = await supabase
      .from("inquiry_forms")
      .select(
        `
        *,
        inquiry_submissions (is_read)
      `,
      )
      .eq("company_id", companyId);

    const processedForms =
      formsData?.map((form) => ({
        ...form,
        unreadCount: form.inquiry_submissions.filter((s) => !s.is_read).length,
      })) || [];

    setForms(processedForms);
    setLoading(false);
  };

  const fetchRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // 1. 내 권한 확인
    const { data: roleData } = await supabase
      .from("company_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .single();
    setRole(roleData?.role);
  };

  useEffect(() => {
    fetchInquiryForms();
    fetchRole();
  }, []);

  if (loading) return null;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-end mb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            문의 관리 센터
          </h1>
          <p className="text-gray-500 mt-2">
            고객의 목소리를 실시간으로 확인하세요.
          </p>
          <p className="mt-3 text-xs -mb-0.5 text-gray-800">
            *새로 만든 문의는 우선 관리자 페이지에서만 확인하실 수 있어요. 본
            사이트에도 문의가 보이게 설정하려면 문의해주세요.
          </p>
        </motion.div>

        {role === "super_admin" && (
          <Link
            href={`/${groupId}/${companyId}/inquiries/manage`}
            className="bg-black text-white px-6 py-3.5 rounded-2xl font-semibold hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> 새 문의창 만들기
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form, index) => (
          <motion.div
            key={form.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() =>
              router.push(`/${groupId}/${companyId}/inquiries/${form.id}`)
            }
            className="group bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                <MessageSquare className="w-7 h-7" />
              </div>
              {form.unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                  NEW {form.unreadCount}
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {form.title}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-1">
              {form.description || "설명이 없는 문의창입니다."}
            </p>

            <div className="mt-8 flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-gray-300 uppercase group-hover:text-black transition-colors">
                View Inbox
              </span>
              <ArrowRight className="w-5 h-5 text-gray-200 group-hover:text-black group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
