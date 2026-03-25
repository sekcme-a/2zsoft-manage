"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function CompanyDashboardLayout({ children, params }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams?.groupId;
  const companyId = resolvedParams?.companyId;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const checkRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push(`/${groupId}/login`);

    const { data } = await supabase
      .from("company_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .single();

    if (data?.role === "super_admin" || data?.role === "admin") {
      setIsAuthorized(true);
    } else {
      alert("권한이 없습니다.");
      // router.push("");
    }
    setLoading(false);
  };

  useEffect(() => {
    checkRole();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* 여기에 공통 사이드바나 네비게이션을 추가할 수 있습니다 */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
