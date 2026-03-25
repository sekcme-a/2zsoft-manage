"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  ChevronRight,
  LayoutList,
  Image as ImageIcon,
  Settings2,
  ArrowRight,
  Search,
} from "lucide-react";
import Link from "next/link";

export default function BoardHub() {
  const [boards, setBoards] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const { groupId, companyId } = params;

  const fetchBoardsAndRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. 내 권한 확인
    const { data: roleData } = await supabase
      .from("company_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .single();
    setRole(roleData?.role);

    // 2. 이 기업의 모든 게시판 목록 로드
    const { data: boardsData } = await supabase
      .from("boards")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

    setBoards(boardsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBoardsAndRole();
  }, []);

  // 검색 필터링
  const filteredBoards = boards.filter((board) =>
    board.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) return null;

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* 상단 타이틀 및 검색 바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            게시판 센터
          </h1>
          <p className="text-gray-500 mt-2">
            관리할 게시판을 선택하거나 설정을 변경하세요.
          </p>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="게시판 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none w-64 transition-all"
            />
          </div>
          {role === "super_admin" && (
            <Link
              href={`/${groupId}/${companyId}/boards/manage`}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors text-gray-700"
              title="게시판 추가/삭제 설정"
            >
              <Settings2 className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>

      {/* 게시판 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBoards.map((board, index) => (
          <motion.div
            key={board.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="group relative bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-64 cursor-pointer"
            onClick={() =>
              router.push(`/${groupId}/${companyId}/boards/${board.id}`)
            }
          >
            <div>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                  board.type === "image"
                    ? "bg-blue-50 text-blue-500"
                    : "bg-orange-50 text-orange-500"
                }`}
              >
                {board.type === "image" ? (
                  <ImageIcon className="w-7 h-7" />
                ) : (
                  <LayoutList className="w-7 h-7" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-black transition-colors">
                {board.name}
              </h3>
              <p className="text-sm text-gray-400 mt-2 flex items-center gap-1.5">
                {board.type === "image" ? "갤러리형 게시판" : "리스트형 게시판"}
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                관리자 전용
              </p>
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className="text-xs font-bold tracking-widest text-gray-300 uppercase group-hover:text-black transition-colors">
                View Posts
              </span>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}

        {/* 최고 관리자용 게시판 추가 유도 카드 */}
        {role === "super_admin" && (
          <Link href={`/${groupId}/${companyId}/boards/manage`}>
            <motion.div
              whileHover={{ scale: 0.99 }}
              className="h-64 rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-all gap-3 bg-gray-50/30"
            >
              <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium">새 게시판 추가</span>
            </motion.div>
          </Link>
        )}
      </div>

      {filteredBoards.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-50">
          <p className="text-gray-400 font-medium">
            검색 결과가 없거나 생성된 게시판이 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
