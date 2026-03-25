"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthenticatedLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const { groupId } = useParams();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // 🚨 로그인 안 됐으면 로그인 페이지로 강제 이동
        router.replace(`/${groupId}/login`);
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [groupId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
      </div>
    );
  }

  return <>{children}</>;
}
