"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UploadCloud, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WritePost({ params }) {
  const resolvedParams = use(params);
  const groupId = resolvedParams?.groupId;
  const boardId = resolvedParams?.boardId;
  const companyId = resolvedParams?.companyId;
  const [board, setBoard] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const fetchBoardInfo = async () => {
    const { data } = await supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();
    setBoard(data);
  };

  useEffect(() => {
    fetchBoardInfo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    let uploadedImageUrl = null;

    // 이미지 게시판이고 파일이 첨부되었을 경우 Storage 업로드 처리
    if (board?.type === "image" && file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${companyId}/${boardId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("board_images")
        .upload(filePath, file);

      if (uploadError) {
        alert("이미지 업로드에 실패했습니다.");
        setIsSubmitting(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("board_images")
        .getPublicUrl(filePath);

      uploadedImageUrl = publicUrlData.publicUrl;
    }

    // 게시글 Insert
    const { error } = await supabase.from("posts").insert({
      board_id: boardId,
      user_id: user.id,
      title,
      content,
      image_url: uploadedImageUrl,
    });

    setIsSubmitting(false);

    if (!error) {
      router.push(`/${groupId}/${companyId}/boards/${boardId}`);
    } else {
      alert("게시글 작성 중 오류가 발생했습니다.");
    }
  };

  if (!board) return null;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href={`/${groupId}/${companyId}/boards/${boardId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-black mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로 돌아가기
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">새 게시글 작성</h1>
        <p className="text-gray-500 mt-2">{board.name} 에 글을 작성합니다.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="게시글 제목을 입력하세요"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-[15px]"
            />
          </div>

          {board.type === "image" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 첨부
              </label>
              <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <span className="text-gray-500 text-sm font-medium">
                  {file ? file.name : "클릭하거나 이미지를 드래그하여 업로드"}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 작성해주세요"
              rows={10}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-[15px] resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white px-8 py-4 rounded-2xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "등록 중..." : "게시글 등록하기"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
