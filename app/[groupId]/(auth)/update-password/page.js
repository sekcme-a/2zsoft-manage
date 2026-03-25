"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { groupId } = useParams();

  const router = useRouter();
  const supabase = createClient();

  // 💡 세션 체크: 비밀번호 재설정 링크를 통해 들어왔는지 확인
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        alert("유효하지 않거나 만료된 링크입니다. 다시 시도해주세요.");
        router.push(`/${groupId}/login`);
      }
    };
    checkSession();
  }, [router, supabase]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return alert("비밀번호가 일치하지 않습니다.");
    }

    if (password.length < 6) {
      return alert("비밀번호는 최소 6자 이상이어야 합니다.");
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setIsSuccess(true);
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      alert("비밀번호 변경 중 오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-gray-100"
      >
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                변경 완료!
              </h1>
              <p className="text-gray-500 mb-8">
                비밀번호가 안전하게 변경되었습니다.
                <br />
                잠시 후 로그인 페이지로 이동합니다.
              </p>
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-300" />
            </motion.div>
          ) : (
            <motion.div key="form">
              <div className="text-center mb-10">
                <div className="bg-black w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="text-white w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
                  새 비밀번호 설정
                </h1>
                <p className="text-gray-400 text-sm">
                  새로운 비밀번호를 입력하여 계정을 보호하세요.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="최소 6자 이상"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 text-[15px] outline-none focus:border-black focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1 uppercase">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="비밀번호 다시 입력"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 text-[15px] outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white rounded-2xl py-5 font-bold text-[15px] hover:bg-gray-800 transition-all disabled:opacity-50 mt-6 shadow-lg shadow-black/5 active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "비밀번호 업데이트"
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Framer Motion의 AnimatePresence를 위해 상단에 추가
import { AnimatePresence } from "framer-motion";
