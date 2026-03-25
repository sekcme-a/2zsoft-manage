"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, MailOpen, ChevronRight, ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";

export default function SubmissionList() {
  const [role, setRole] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState(null);
  const { groupId, companyId, formId } = useParams();
  const supabase = createClient();
  const router = useRouter();
  const fetchSubmissions = async () => {
    const { data: formData } = await supabase
      .from("inquiry_forms")
      .select("*")
      .eq("id", formId)
      .single();
    setForm(formData);

    const { data } = await supabase
      .from("inquiry_submissions")
      .select("*")
      .eq("form_id", formId)
      .order("created_at", { ascending: false });
    setSubmissions(data || []);
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
    fetchSubmissions();
    fetchRole();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-8">
      <button
        onClick={() => router.push(`/${groupId}/${companyId}/inquiries`)}
        className="flex items-center text-sm text-gray-400 hover:text-black mb-8 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> 목록으로
      </button>

      <div className="mb-12 flex justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">{form?.title}</h1>
          <p className="text-gray-500 mt-2">
            총 {submissions.length}개의 문의가 도착했습니다.
          </p>
        </div>

        {role === "super_admin" && (
          <Link
            href={`/${groupId}/${companyId}/inquiries/manage/${formId}`}
            className="bg-black text-white px-6 h-min py-3.5 rounded-2xl font-semibold hover:bg-gray-800 transition-all flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            문의창 수정
          </Link>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-8 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                상태
              </th>
              <th className="px-8 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                내용 요약
              </th>
              <th className="px-8 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                접수일
              </th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {submissions.map((sub) => (
              <tr
                key={sub.id}
                onClick={() =>
                  router.push(
                    `/${groupId}/${companyId}/inquiries/${formId}/${sub.id}`,
                  )
                }
                className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
              >
                <td className="px-8 py-6">
                  {sub.is_read ? (
                    <MailOpen className="w-5 h-5 text-gray-300" />
                  ) : (
                    <div className="relative">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                  )}
                </td>
                <td className="px-8 py-6">
                  <p
                    className={`text-sm line-clamp-1 ${sub.is_read ? "text-gray-700" : "font-bold text-gray-900"}`}
                  >
                    {Object.values(sub.content)[0]}...
                  </p>
                </td>
                <td className="px-8 py-6 text-sm text-gray-400">
                  {new Date(sub.created_at).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-right">
                  <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-black transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
