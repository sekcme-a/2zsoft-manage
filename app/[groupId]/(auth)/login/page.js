"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react"; // 💡 아이콘 추가

const getKoreanErrorMessage = (error) => {
  const msg = error.message;
  if (msg.includes("Email not confirmed"))
    return "이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.";
  if (msg.includes("Invalid login credentials"))
    return "이메일 또는 비밀번호가 일치하지 않습니다.";
  if (msg.includes("User already registered"))
    return "이미 가입된 이메일입니다.";
  if (msg.includes("Password should be at least 6 characters"))
    return "비밀번호는 최소 6자 이상이어야 합니다.";
  if (msg.includes("Too many requests"))
    return "보안을 위해 요청이 제한되었습니다. 잠시 후 다시 시도해주세요.";
  return "처리 중 오류가 발생했습니다.";
};

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 💡 비밀번호 토글 상태
  const [loading, setLoading] = useState(false);

  const { groupId } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert(getKoreanErrorMessage(error));
      else router.push(`/${groupId}/hallway`);
    } else if (mode === "signup") {
      if (password !== confirmPassword) {
        alert("비밀번호가 일치하지 않습니다.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/${groupId}/login/callback`,
          data: { full_name: email.split("@")[0] },
        },
      });

      if (error) alert(getKoreanErrorMessage(error));
      else {
        alert(
          "회원가입 신청이 완료되었습니다! 입력하신 이메일 주소로 인증 메일을 보내드렸습니다. 메일함의 [이메일 인증 완료하기] 버튼을 클릭하시면 가입이 최종 완료됩니다.",
        );
        setMode("login");
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${groupId}/update-password`,
    });
    if (error) alert(getKoreanErrorMessage(error));
    else {
      alert("비밀번호 재설정 이메일이 발송되었습니다. 메일함을 확인해주세요.");
      setMode("login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-4 font-sans">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-gray-100"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">
            {mode === "login" && "환영합니다"}
            {mode === "signup" && "계정 만들기"}
            {mode === "forgot" && "비밀번호 찾기"}
          </h1>
          <p className="text-gray-400 text-sm">
            {mode === "forgot"
              ? "가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다."
              : "관리자 대시보드에 접근하기 위해 계속 진행해주세요."}
          </p>
        </div>

        <form
          onSubmit={mode === "forgot" ? handleForgotPassword : handleAuth}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 ml-1 uppercase">
              Email
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl px-5 py-4 text-[15px] outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 ml-1 uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} // 💡 타입 동적 변경
                  placeholder="비밀번호 입력"
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
          )}

          {/* 회원가입 시 비밀번호 재확인 (눈동자 미적용 - 보안 및 UX상 깔끔함 유지) */}
          <AnimatePresence>
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          {mode === "login" && (
            <div className="flex justify-end pr-1">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-gray-400 hover:text-black transition-colors"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-2xl py-5 font-bold text-[15px] hover:bg-gray-800 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-black/5 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : mode === "login" ? (
              "로그인"
            ) : mode === "signup" ? (
              "계정 생성"
            ) : (
              "초기화 링크 발송"
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          {mode !== "login" ? (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="flex items-center justify-center gap-2 w-full text-gray-500 text-sm hover:text-black transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              로그인 화면으로 돌아가기
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="text-gray-500 text-sm hover:text-black transition-colors font-medium"
            >
              계정이 없으신가요?{" "}
              <span className="text-black font-bold ml-1">회원가입</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
