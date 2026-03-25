"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const { groupId } = useParams();

  useEffect(() => {
    const handleCallback = async () => {
      // URL의 해시나 쿼리 스트링에 포함된 코드를 세션으로 교환합니다.
      const { error } = await supabase.auth.getSession();

      if (!error) {
        // 인증 성공 시 대시보드로 이동
        router.push(`/${groupId}/hallway`);
      } else {
        // 에러 발생 시 로그인 페이지로 리다이렉트
        console.error("Auth callback error:", error.message);
        router.push("/login?error=auth-callback-failed");
      }
    };

    handleCallback();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
      <p className="text-gray-500 font-medium">
        로그인 세션을 확인 중입니다...
      </p>
    </div>
  );
}
