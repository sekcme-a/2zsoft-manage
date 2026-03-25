"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldX,
  UserCheck,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  UserMinus,
  MoreHorizontal,
} from "lucide-react";

export default function MemberManagement({ params }) {
  const resolvedParams = use(params);
  const companyId = resolvedParams?.companyId;
  const [members, setMembers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMembers = async () => {
    if (!companyId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setMyId(user.id);

    // 내 권한 확인
    const { data: myRole } = await supabase
      .from("company_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .single();

    setRole(myRole?.role);

    // 전체 멤버 데이터 (Profile 조인)
    const { data: membersData } = await supabase
      .from("company_roles")
      .select(
        `
        id, 
        user_id,
        role, 
        created_at,
        profiles (email, full_name)
      `,
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    setMembers(membersData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [companyId]);

  // 권한 업데이트 (승격/강등)
  const updateRole = async (roleId, newRole, targetEmail) => {
    const isDemoting = newRole === "admin";
    const confirmMsg = isDemoting
      ? `[경고] ${targetEmail} 님을 일반 관리자로 강등하시겠습니까?`
      : `${targetEmail} 님을 최고 관리자로 승격하시겠습니까?`;

    if (!confirm(confirmMsg)) return;

    const { error } = await supabase
      .from("company_roles")
      .update({ role: newRole })
      .eq("id", roleId);

    if (error) alert("권한 변경에 실패했습니다.");
    fetchMembers();
  };

  // 멤버 제거
  const deleteRole = async (roleId, targetEmail) => {
    if (!confirm(`${targetEmail} 님의 모든 관리 권한을 제거하시겠습니까?`))
      return;

    const { error } = await supabase
      .from("company_roles")
      .delete()
      .eq("id", roleId);

    if (error) alert("멤버 제거에 실패했습니다.");
    fetchMembers();
  };

  if (!loading && role !== "super_admin") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400">
        <ShieldX className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-medium text-lg">최고 관리자 전용 페이지입니다.</p>
      </div>
    );
  }

  const pendingMembers = members.filter((m) => m.role === "pending");
  const activeMembers = members.filter((m) => m.role !== "pending");

  return (
    <div className="max-w-5xl mx-auto p-8 font-sans antialiased text-[#1d1d1f]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <h1 className="text-[34px] font-bold tracking-tight">
          멤버 및 권한 설정
        </h1>
        <p className="text-[#86868b] mt-2 text-lg font-medium">
          관리자 그룹의 권한을 정교하게 제어합니다.
        </p>
      </motion.div>

      {/* 1. 승인 대기 요청 */}
      <section className="mb-20">
        <h2 className="text-[13px] font-bold text-[#86868b] uppercase tracking-[0.1em] mb-6 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          승인 대기 중 ({pendingMembers.length})
        </h2>
        <div className="space-y-3">
          <AnimatePresence>
            {pendingMembers.length === 0 ? (
              <p className="py-12 text-center text-[#d2d2d7] font-medium border-2 border-dashed border-gray-100 rounded-[2rem]">
                진행 중인 요청이 없습니다.
              </p>
            ) : (
              pendingMembers.map((member) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between p-7 bg-white rounded-[2rem] border border-gray-100 shadow-sm"
                >
                  <div>
                    <p className="font-bold text-[17px]">
                      {member.profiles?.email}
                    </p>
                    <p className="text-[13px] text-[#86868b] mt-0.5">
                      요청일: {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateRole(member.id, "admin", member.profiles?.email)
                      }
                      className="px-6 py-2.5 bg-black text-white text-[14px] font-bold rounded-full hover:bg-gray-800 transition-all"
                    >
                      승인
                    </button>
                    <button
                      onClick={() =>
                        deleteRole(member.id, member.profiles?.email)
                      }
                      className="px-6 py-2.5 bg-gray-50 text-red-500 text-[14px] font-bold rounded-full hover:bg-red-50 transition-all"
                    >
                      거절
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 2. 활성 멤버 리스트 */}
      <section>
        <h2 className="text-[13px] font-bold text-[#86868b] uppercase tracking-[0.1em] mb-6 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-blue-500" />
          활성 관리자 ({activeMembers.length})
        </h2>
        <div className="grid gap-4">
          {activeMembers.map((member) => {
            const isMe = member.user_id === myId;
            const isTargetSuper = member.role === "super_admin";

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-7 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:border-gray-200 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${isTargetSuper ? "bg-[#1d1d1f] text-white" : "bg-gray-50 text-gray-400 border border-gray-100"}`}
                  >
                    {isTargetSuper ? "S" : "A"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[17px] text-gray-900">
                        {member.profiles?.email}
                      </p>
                      {isMe && (
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md font-bold uppercase">
                          나
                        </span>
                      )}
                      {isTargetSuper && (
                        <span className="text-[10px] bg-blue-50 text-[#0066cc] px-2 py-0.5 rounded-md font-black uppercase tracking-tight">
                          Super
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#86868b] mt-0.5 font-medium">
                      {member.profiles?.full_name || "이름 없음"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!isMe && (
                    <>
                      {/* 승격/강등 토글 버튼 */}
                      {isTargetSuper ? (
                        <button
                          onClick={() =>
                            updateRole(
                              member.id,
                              "admin",
                              member.profiles?.email,
                            )
                          }
                          className="flex items-center gap-1.5 px-4 py-2 text-[#0066cc] bg-blue-50 hover:bg-blue-100 rounded-xl text-[13px] font-bold transition-all"
                        >
                          <ArrowDownCircle className="w-4 h-4" /> 일반 관리자로
                          강등
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            updateRole(
                              member.id,
                              "super_admin",
                              member.profiles?.email,
                            )
                          }
                          className="flex items-center gap-1.5 px-4 py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl text-[13px] font-bold transition-all"
                        >
                          <ArrowUpCircle className="w-4 h-4" /> 최고 관리자로
                          승격
                        </button>
                      )}

                      {/* 제거 버튼: 본인이 아니면 누구나 제거 가능 (super_admin끼리도 가능) */}
                      <button
                        onClick={() =>
                          deleteRole(member.id, member.profiles?.email)
                        }
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        title="권한 제거"
                      >
                        <UserMinus className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
