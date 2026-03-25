"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Lock,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldAlert,
} from "lucide-react";

export default function ProfileSettings() {
  const [nickname, setNickname] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPwUpdating, setIsPwUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [pwMessage, setPwMessage] = useState("");

  const { groupId } = useParams();
  const supabase = createClient();
  const router = useRouter();

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push(`/${groupId}/login`);

    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (data?.full_name) setNickname(data.full_name);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateNickname = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsUpdating(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: nickname })
      .eq("id", user.id);

    if (error) {
      alert("닉네임 업데이트 중 오류가 발생했습니다.");
    } else {
      setMessage("닉네임이 성공적으로 변경되었습니다.");
      setTimeout(() => setMessage(""), 3000);
    }
    setIsUpdating(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword)
      return alert("비밀번호가 일치하지 않습니다.");
    if (newPassword.length < 6)
      return alert("비밀번호는 최소 6자 이상이어야 합니다.");

    setIsPwUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      alert(error.message);
    } else {
      setPwMessage("비밀번호가 안전하게 변경되었습니다.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwMessage(""), 3000);
    }
    setIsPwUpdating(false);
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "정말로 계정을 탈퇴하시겠습니까?\n모든 데이터가 영구 삭제되며 이 작업은 되돌릴 수 없습니다.",
    );

    if (!confirmed) return;

    setIsUpdating(true); // 로딩 상태 시작

    try {
      // 1. 프로필 및 데이터 삭제 (DB 정책에 따라 다를 수 있음)
      // 만약 DB에서 delete_user() 함수 내부에 profiles 삭제 로직이 없다면 여기서 수동 삭제
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 2. RPC 함수 호출 (SQL에서 만든 delete_user 실행)
      const { error: deleteError } = await supabase.rpc("delete_user");

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // 3. 클라이언트 세션 정리 및 로그아웃
      await supabase.auth.signOut();

      alert("탈퇴 처리가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
      router.push(`/${groupId}/login`);
    } catch (error) {
      console.error("Delete Error:", error);
      alert("탈퇴 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsUpdating(false);
    }
  };
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-200" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto p-8 pt-12 font-sans antialiased text-[#1d1d1f]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm font-bold text-[#86868b] hover:text-black mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Account Settings
        </button>

        <header className="mb-12">
          <h1 className="text-[34px] font-bold tracking-tight">계정 설정</h1>
          <p className="text-[#86868b] mt-2 text-lg font-medium">
            개인 정보와 보안을 관리합니다.
          </p>
        </header>

        <div className="space-y-12">
          {/* Section 1: Profile */}
          <section>
            <h2 className="text-[13px] font-bold text-[#86868b] uppercase tracking-[0.1em] mb-4 ml-1">
              Profile
            </h2>
            <form
              onSubmit={handleUpdateNickname}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <User className="w-7 h-7 text-gray-300" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-900">
                    공개 닉네임
                  </p>
                  <p className="text-[13px] text-[#86868b] font-medium">
                    관리자 리스트에 표시됩니다.
                  </p>
                </div>
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-gray-200 transition-all text-[17px] font-medium"
              />
              <div className="mt-6 flex items-center justify-between">
                <div className="h-5">
                  {message && (
                    <p className="text-green-600 text-[13px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> {message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="text-[15px] font-bold text-[#0066cc] hover:underline disabled:opacity-30"
                >
                  저장
                </button>
              </div>
            </form>
          </section>

          {/* Section 2: Security (Password Update) */}
          <section>
            <h2 className="text-[13px] font-bold text-[#86868b] uppercase tracking-[0.1em] mb-4 ml-1">
              Security
            </h2>
            <form
              onSubmit={handleUpdatePassword}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-5 mb-4">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-gray-300" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-900">
                    비밀번호 변경
                  </p>
                  <p className="text-[13px] text-[#86868b] font-medium">
                    안전한 비밀번호로 업데이트하세요.
                  </p>
                </div>
              </div>

              {/* New Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호"
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-gray-200 transition-all text-[17px] font-medium pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-900 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 확인"
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-gray-200 transition-all text-[17px] font-medium pr-14"
                />
                {confirmPassword && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    {newPassword === confirmPassword ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="h-5">
                  {pwMessage && (
                    <p className="text-green-600 text-[13px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> {pwMessage}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={
                    isPwUpdating ||
                    !newPassword ||
                    newPassword !== confirmPassword
                  }
                  className="text-[15px] font-bold text-[#0066cc] hover:underline disabled:opacity-30"
                >
                  비밀번호 업데이트
                </button>
              </div>
            </form>
          </section>

          {/* Section 3: Danger Zone */}
          <section className="pt-8">
            <div className="bg-red-50/40 p-10 rounded-[2.5rem] border border-red-100 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-start gap-4 text-center md:text-left">
                <div className="mt-1 hidden md:block">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-red-600">
                    계정 영구 삭제
                  </h3>
                  <p className="text-[14px] text-red-500/70 font-medium mt-1 leading-relaxed">
                    계정 삭제 시 관리 권한 및 모든 데이터가 소멸됩니다.
                    <br className="hidden md:block" />
                    삭제된 데이터는 다시 복구할 수 없습니다.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="w-full md:w-auto whitespace-nowrap px-8 py-4 bg-white border border-red-100 text-red-600 text-[15px] font-bold rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
              >
                삭제 진행
              </button>
            </div>
          </section>
        </div>

        <footer className="mt-24 mb-12 text-center">
          <p className="text-[11px] text-[#d2d2d7] font-bold tracking-[0.2em] uppercase">
            Security Standard Encryption Applied
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
