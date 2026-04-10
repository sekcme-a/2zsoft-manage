"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation"; // useParams 제거
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Users,
  ClipboardList,
  Building,
} from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [profile, setProfile] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState(null);

  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  // 💡 useParams 대신 pathname에서 직접 ID 추출 (RootLayout 대응)
  // URL 구조가 /[groupId]/[companyId]/... 일 경우:
  const pathSegments = pathname.split("/").filter(Boolean);
  const groupId = pathSegments[0]; // 첫 번째 세그먼트
  const companyId = pathSegments[1]; // 두 번째 세그먼트

  const fetchUserData = async () => {
    // 1. 유저 정보 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setRole(null);
      setProfile(null);
      return;
    }

    // 2. 프로필 정보 가져오기
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();
    setProfile(profileData);

    // 3. 해당 회사의 권한(Role) 가져오기
    if (companyId && companyId !== "hallway" && companyId !== "login") {
      const { data: roleData } = await supabase
        .from("company_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .maybeSingle(); // single() 대신 maybeSingle()로 에러 방지

      setRole(roleData?.role || null);
    } else {
      setRole(null);
    }
  };

  const fetchCompanyInfo = async () => {
    if (!companyId || companyId === "hallway" || companyId === "login") return;
    const { data } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .maybeSingle();
    setCompanyName(data?.name || "");
  };

  // 💡 pathname이 바뀔 때마다 실행되도록 설정
  useEffect(() => {
    fetchUserData();
    fetchCompanyInfo();
    console.log("Current Path:", pathname);
    console.log("Extracted IDs:", { groupId, companyId });
  }, [pathname]); // pathname 전체를 감시하여 이동 시마다 갱신

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${groupId}/login`);
  };

  const navItems = [
    {
      name: "대시보드",
      href: `/${groupId}/${companyId}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      name: "게시판 관리",
      href: `/${groupId}/${companyId}/boards`,
      icon: ClipboardList,
      // superAdminOnly: true,
    },
    {
      name: "문의 관리",
      href: `/${groupId}/${companyId}/inquiries`,
      icon: ClipboardList,
      // superAdminOnly: true,
    },
    {
      name: "멤버 관리",
      href: `/${groupId}/${companyId}/members`,
      icon: Users,
      // superAdminOnly: true,
    },
    {
      name: "팝업 관리",
      href: `/${groupId}/${companyId}/popups`,
      icon: Building,
    },
  ];

  const filteredItems = navItems.filter(
    (item) => !item.superAdminOnly || role === "super_admin",
  );

  const isNavItemActive = (href) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">
              Admin.
            </span>
          </div>

          {companyName && companyId !== "hallway" && (
            <Link href={`/${groupId}/hallway`}>
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                  {companyName}
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-1">
          {/* companyId가 유효한 경우에만 렌더링 */}
          {companyId &&
            companyId !== "hallway" &&
            companyId !== "login" &&
            filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isNavItemActive(item.href)
                    ? "bg-gray-100 text-black font-bold"
                    : "text-gray-500 hover:text-black hover:bg-gray-50"
                }`}
              >
                {item.name}
              </Link>
            ))}
        </div>

        <div className="flex items-center gap-4">
          {profile && !pathname.includes("hallway") && (
            <Link
              href={`/${groupId}/${companyId}/settings/profile`}
              className="hidden sm:block text-right mr-2 group cursor-pointer"
            >
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter group-hover:text-black transition-colors">
                {role === "super_admin" ? "최고 관리자" : "일반 관리자"}
              </p>
              <p className="text-sm font-bold text-gray-900 leading-none mt-1 group-hover:text-blue-600 transition-colors">
                {profile?.full_name || profile?.email?.split("@")[0]}
              </p>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-600"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {companyId &&
                companyId !== "hallway" &&
                filteredItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 p-4 rounded-2xl font-medium transition-all ${
                      isNavItemActive(item.href)
                        ? "bg-black text-white"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 font-medium"
              >
                <LogOut className="w-5 h-5" /> 로그아웃
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
