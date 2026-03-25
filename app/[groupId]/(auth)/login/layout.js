"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function GuestLayout({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const { groupId } = useParams();

  useEffect(() => {
    const checkLoggedUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // 💡 이미 로그인 상태라면 hallway로 리다이렉트
        router.replace(`/${groupId}/hallway`);
      } else {
        setIsLoading(false);
      }
    };

    checkLoggedUser();
  }, [groupId, router, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-200" />
      </div>
    );
  }

  return <>{children}</>;
}
