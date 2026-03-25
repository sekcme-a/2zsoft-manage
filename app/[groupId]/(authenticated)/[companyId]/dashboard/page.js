"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  MessageCircle,
  Users,
  ArrowUpRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function DashboardOverview() {
  const { groupId, companyId } = useParams();
  const [stats, setStats] = useState({ posts: 0, inquiries: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchStats = async () => {
    // 1. 게시글 총 개수
    const { count: postCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    // 2. 미확인 문의 개수 (is_read: false)
    const { count: unreadInquiries } = await supabase
      .from("inquiry_submissions")
      .select("*, inquiry_forms!inner(*)", { count: "exact", head: true })
      .eq("inquiry_forms.company_id", companyId)
      .eq("is_read", false);

    // 3. 관리자 수
    const { count: adminCount } = await supabase
      .from("company_roles")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    setStats({
      posts: postCount || 0,
      inquiries: unreadInquiries || 0,
      admins: adminCount || 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const menuCards = [
    {
      title: "게시판 관리",
      desc: "콘텐츠를 작성하고 게시판을 관리합니다.",
      icon: FileText,
      href: `/${groupId}/${companyId}/boards`,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "문의 관리",
      desc: "고객 문의를 확인하고 폼을 편집합니다.",
      icon: MessageCircle,
      href: `/${groupId}/${companyId}/inquiries`,
      color: "bg-blue-50 text-blue-600",
      badge: stats.inquiries > 0 ? `${stats.inquiries}건 미확인` : null,
    },
    {
      title: "멤버 권한 설정",
      desc: "팀원을 초대하고 관리 권한을 부여합니다.",
      icon: Users,
      href: `/${groupId}/${companyId}/members`,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  if (loading) return null;

  return (
    <div className="space-y-12">
      {/* 상단 웰컴 섹션 */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
            대시보드
          </h1>
          <p className="text-gray-500 font-medium">
            오늘의 관리 현황입니다. 효율적인 운영을 시작해보세요.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-400 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
          <Clock className="w-4 h-4" />
          마지막 업데이트: {new Date().toLocaleTimeString()}
        </div>
      </header>

      {/* 요약 통계 그리드 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            label: "전체 게시글",
            value: stats.posts,
            icon: FileText,
            trend: "+12%",
          },
          {
            label: "읽지 않은 문의",
            value: stats.inquiries,
            icon: MessageCircle,
            highlight: stats.inquiries > 0,
          },
          { label: "총 관리자 수", value: stats.admins, icon: Users },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-6">
              <div
                className={`p-3 rounded-2xl ${item.highlight ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"}`}
              >
                <item.icon className="w-6 h-6" />
              </div>
              {item.trend && (
                <span className="flex items-center text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">
                  <TrendingUp className="w-3 h-3 mr-1" /> {item.trend}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">
              {item.label}
            </p>
            <h2
              className={`text-4xl font-bold ${item.highlight ? "text-red-500" : "text-gray-900"}`}
            >
              {item.value.toLocaleString()}
            </h2>
          </motion.div>
        ))}
      </section>

      {/* 바로가기 메뉴 카드 */}
      <section>
        <div className="flex items-center gap-2 mb-8 ml-2">
          <LayoutDashboard className="w-5 h-5 text-gray-900" />
          <h2 className="text-xl font-bold text-gray-900">빠른 메뉴</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {menuCards.map((card, i) => (
            <Link key={card.title} href={card.href}>
              <motion.div
                whileHover={{ y: -8 }}
                className="group bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 cursor-pointer h-full flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}
                  >
                    <card.icon className="w-7 h-7" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {card.title}
                    </h3>
                    {card.badge && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 leading-relaxed">{card.desc}</p>
                </div>

                <div className="mt-12 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-300 group-hover:text-black transition-colors">
                    Manage Now
                  </span>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* 하단 배너 (가이드) */}
      {/* <section className="bg-black rounded-[3rem] p-12 overflow-hidden relative group">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            전문적인 관리가 필요한가요?
          </h2>
          <p className="text-gray-400 font-medium mb-8">
            모든 설정은 실시간으로 반영됩니다. 궁금한 점이 있다면 언제든
            고객센터에 문의하세요.
          </p>
          <button className="bg-white text-black px-8 py-3.5 rounded-2xl font-bold hover:bg-gray-100 transition-colors">
            도움말 보기
          </button>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none group-hover:from-white/20 transition-all duration-1000" />
      </section> */}
    </div>
  );
}
