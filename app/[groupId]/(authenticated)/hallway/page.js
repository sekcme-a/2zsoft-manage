"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Building2, ShieldAlert, ArrowRight } from "lucide-react";
import { useParams } from "next/navigation";

export default function DashboardIndex() {
  const { groupId } = useParams();
  const [companies, setCompanies] = useState([]);
  const [myRoles, setMyRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  // 1. fetchData를 useCallback으로 감싸서 함수가 매번 재생성되는 것을 방지합니다.
  const fetchData = useCallback(async () => {
    try {
      setLoading(true); // 로딩 시작
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // 병렬 요청으로 성능 최적화 (Promise.all)
      const [companiesRes, rolesRes] = await Promise.all([
        supabase.from("companies").select("*"),
        supabase.from("company_roles").select("*").eq("user_id", user.id),
      ]);

      console.log(companiesRes, rolesRes);

      setCompanies(companiesRes.data || []);
      setMyRoles(rolesRes.data || []);
    } catch (error) {
      console.error("데이터 로드 중 에러:", error);
    } finally {
      setLoading(false); // 로딩 종료
    }
  }, [supabase]); // supabase 객체가 변경될 때만 함수 재생성

  // 2. useEffect에서는 이제 안정적인 fetchData를 호출만 합니다.
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestAccess = async (companyId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");

    // .single() 사용 시 데이터가 없으면 에러가 발생할 수 있으므로 query 방식을 체크합니다.
    const { data: existing, error: er } = await supabase
      .from("company_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .maybeSingle(); // single() 대신 maybeSingle() 권장

    console.log(er);
    if (existing) {
      return alert("이미 권한 요청을 보냈거나 승인된 상태입니다.");
    }

    const { error } = await supabase.from("company_roles").insert({
      user_id: user.id,
      company_id: companyId,
      role: "pending",
    });

    if (error) {
      console.error(error);
      alert("권한 요청 중 오류가 발생했습니다.");
    } else {
      alert("관리자 권한을 요청했습니다.");
      fetchData(); // 성공 후 다시 데이터 로드
    }
  };

  if (loading) return null; // 로딩 중 처리

  return (
    <div className=" max-w-6xl mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          홈페이지 관리
        </h1>
        <p className="text-gray-500 mt-2">
          관리할 기업 홈페이지를 선택하거나 접근 권한을 요청하세요.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company, index) => {
          const roleData = myRoles.find((r) => r.company_id === company.id);
          const role = roleData?.role;
          const isAuthorized = role === "super_admin" || role === "admin";

          return (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-6">
                  <Building2 className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">
                  {company.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{company.domain}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50">
                {isAuthorized ? (
                  <Link
                    href={`/${groupId}/${company.id}/dashboard`}
                    className="flex items-center justify-between text-black font-medium hover:opacity-70 transition-opacity"
                  >
                    <span>관리자 패널 입장</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : role === "pending" ? (
                  <div className="flex items-center text-amber-500 text-sm font-medium bg-amber-50 px-4 py-2 rounded-full w-max">
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    승인 대기 중
                  </div>
                ) : (
                  <button
                    onClick={() => handleRequestAccess(company.id)}
                    className="text-sm font-medium text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full hover:bg-blue-100 transition-colors w-full text-center"
                  >
                    권한 요청하기
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
