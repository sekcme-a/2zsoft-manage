"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  PenSquare,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Calendar,
  User,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { usePostActions } from "@/lib/hooks/usePostActions";

export default function BoardPostList() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const { groupId, companyId, boardId } = params;
  const { isSubmitting, handleDelete } = usePostActions();

  // 💡 Pagination 설정
  const itemsPerPage = 10;
  const currentPage = Number(searchParams.get("page")) || 1;

  const [posts, setPosts] = useState([]);
  const [board, setBoard] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 💡 데이터 로드 함수
  const fetchBoardAndPosts = useCallback(async () => {
    setLoading(true);

    // 1. 게시판 정보 가져오기
    const { data: boardData } = await supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();
    setBoard(boardData);

    // 2. 범위 계산
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    // 3. 게시글 목록 가져오기 (profiles 조인 - full_name 선택) ✅ 수정됨
    const {
      data: postsData,
      count,
      error,
    } = await supabase
      .from("posts")
      .select(`*, profiles (full_name)`, { count: "exact" })
      .eq("board_id", boardId)
      .range(from, to)
      .order("created_at", { ascending: false });

    console.log(postsData, error);

    if (!error) {
      setPosts(postsData || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [boardId, currentPage, supabase]);

  useEffect(() => {
    fetchBoardAndPosts();
  }, [fetchBoardAndPosts]);

  const handleDeletePost = async (e, postId) => {
    e.stopPropagation();
    const result = await handleDelete({
      postId,
      storageBucket: "board_images",
      storagePath: `groups/${groupId}/companies/${companyId}/boards/${boardId}/${postId}`,
    });
    if (result?.success) fetchBoardAndPosts();
  };

  const goToPage = (pageNumber) => {
    router.push(
      `/${groupId}/${companyId}/boards/${boardId}?page=${pageNumber}`,
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (loading && posts.length === 0)
    return (
      <div className="p-20 text-center text-gray-400 font-medium">
        데이터를 불러오는 중입니다...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans antialiased text-[#1d1d1f]">
      {/* 상단 헤더 섹션 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-2 text-sm">
            <Link
              href={`/${groupId}/${companyId}/boards`}
              className="text-gray-400 hover:text-black transition-colors"
            >
              게시판 관리
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="font-semibold text-black">{board?.name}</span>
          </div>
          <h1 className="text-[40px] font-bold tracking-tight text-gray-900 leading-tight">
            {board?.name}
          </h1>
          <p className="text-[#86868b] mt-2 font-medium">
            총 {totalCount}개의 게시물이 등록되어 있습니다.
          </p>
        </motion.div>

        <Link
          href={`/${groupId}/${companyId}/boards/${boardId}/edit/new`}
          className="inline-flex items-center bg-black text-white px-7 py-4 rounded-[1.25rem] font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/5 active:scale-95"
        >
          <PenSquare className="w-5 h-5 mr-2" />새 글 작성
        </Link>
      </div>

      {/* 게시글 리스트 섹션 */}
      {posts.length === 0 ? (
        <div className="py-32 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200 text-gray-400 font-medium text-lg">
          아직 작성된 게시글이 없습니다.
        </div>
      ) : board?.type === "image" ? (
        /* --- 이미지 게시판 레이아웃 --- */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => {
            // 💡 작성자 이름 처리 (full_name 사용) ✅ 수정됨
            const authorName = post.profiles?.full_name || "탈퇴한 사용자";

            return (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:border-gray-200 transition-all duration-500 cursor-pointer"
                onClick={() =>
                  router.push(
                    `/${groupId}/${companyId}/boards/${boardId}/edit/${post.id}`,
                  )
                }
              >
                <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden border-b border-gray-50">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-1000"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-7">
                  <h3 className="text-[19px] font-bold text-gray-900 line-clamp-1 mb-3 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex items-center justify-between text-[13px] text-[#86868b] font-medium">
                    <span className="flex items-center gap-1.5">
                      <User
                        className={`w-3.5 h-3.5 ${!post.profiles ? "text-red-400" : "text-gray-400"}`}
                      />
                      {authorName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-300" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-5 pt-5 border-t border-gray-50 flex justify-end">
                    <button
                      onClick={(e) => handleDeletePost(e, post.id)}
                      className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* --- 글 게시판 레이아웃 --- */
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[13px] font-bold text-[#86868b] uppercase tracking-widest">
                  제목
                </th>
                <th className="px-8 py-5 text-[13px] font-bold text-[#86868b] uppercase tracking-widest hidden md:table-cell">
                  작성자
                </th>
                <th className="px-8 py-5 text-[13px] font-bold text-[#86868b] uppercase tracking-widest hidden sm:table-cell">
                  작성일
                </th>
                <th className="px-8 py-5 text-[13px] font-bold text-[#86868b] uppercase tracking-widest text-right">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map((post, index) => {
                // 💡 작성자 이름 처리 (full_name 사용) ✅ 수정됨
                const authorName = post.profiles?.full_name || "탈퇴한 사용자";

                return (
                  <motion.tr
                    key={post.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50/80 transition-all group cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/${groupId}/${companyId}/boards/${boardId}/edit/${post.id}`,
                      )
                    }
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:text-black transition-all shadow-sm">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-[17px] text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {post.title}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-8 py-6 hidden md:table-cell text-[15px] font-medium ${!post.profiles ? "text-red-400" : "text-[#86868b]"}`}
                    >
                      {authorName}
                    </td>
                    <td className="px-8 py-6 hidden sm:table-cell text-[15px] font-medium text-[#86868b]">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={(e) => handleDeletePost(e, post.id)}
                        className="p-2.5 text-gray-200 cursor-pointer hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Pagination UI --- */}
      {totalPages > 1 && (
        <div className="mt-16 flex justify-center items-center gap-3">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-3 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-black disabled:opacity-20 transition-all active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => goToPage(num)}
                className={`w-11 h-11 rounded-[1rem] font-bold text-sm transition-all ${
                  currentPage === num
                    ? "bg-white text-black shadow-md"
                    : "text-gray-400 hover:text-black"
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-3 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-black disabled:opacity-20 transition-all active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <footer className="mt-24 text-center">
        <p className="text-[11px] font-bold text-[#d2d2d7] uppercase tracking-[0.2em]">
          2ZSoft Admin System
        </p>
      </footer>
    </div>
  );
}
