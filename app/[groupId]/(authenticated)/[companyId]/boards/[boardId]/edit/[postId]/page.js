"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Trash2, Send, Save } from "lucide-react";
import UniversalEditor from "@/components/UniversialEditor";

export default function PostEditorPage({ params }) {
  const resolvedParams = use(params);
  const { groupId, companyId, boardId, postId } = resolvedParams;

  // 💡 'new' 모드인지 확인
  const isNew = postId === "new";

  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(!isNew); // 새 글일 때는 로딩 불필요
  const [issubmitting, setIsSubmitting] = useState(false);

  // 💡 새 글일 경우를 대비해 미리 UUID 생성 (이미지 경로용)
  const [tempId] = useState(isNew ? crypto.randomUUID() : postId);

  const supabase = createClient();
  const router = useRouter();

  const storageBucket = "board_images";
  const storagePath = `companies/${companyId}/boards/${boardId}/${tempId}`;

  // 1. 기존 데이터 로드 (수정 모드일 때만 실행)
  useEffect(() => {
    if (isNew) return;

    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error || !data) {
        alert("게시글을 찾을 수 없습니다.");
        router.back();
        return;
      }

      setPost(data);
      setTitle(data.title);
      setLoading(false);
    };

    fetchPost();
  }, [postId, isNew, supabase, router]);

  // 2. 삭제 로직 (수정 모드에서만 노출)
  const handleDeletePost = async () => {
    if (
      !confirm("정말로 삭제하시겠습니까? 스토리지의 이미지도 모두 삭제됩니다.")
    )
      return;
    setIsSubmitting(true);

    try {
      // Storage 폴더 삭제
      const { data: files } = await supabase.storage
        .from(storageBucket)
        .list(storagePath);
      if (files && files.length > 0) {
        const paths = files.map((f) => `${storagePath}/${f.name}`);
        await supabase.storage.from(storageBucket).remove(paths);
      }

      // DB 삭제
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;

      alert("삭제되었습니다.");
      router.push(`/${groupId}/${companyId}/boards/${boardId}`);
    } catch (error) {
      console.error(error);
      alert("삭제 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. 저장 로직 (Insert 또는 Update 선택 실행)
  // 3. 저장 로직 (Insert 또는 Update 선택 실행)
  const handleSaveContent = async (finalHtml) => {
    if (!title.trim()) return alert("제목을 입력해주세요.");
    setIsSubmitting(true);

    try {
      // 💡 1. 첫 번째 이미지 URL 추출 로직 추가
      const parser = new DOMParser();
      const doc = parser.parseFromString(finalHtml, "text/html");
      const firstImg = doc.querySelector("img");
      const firstImageUrl = firstImg ? firstImg.getAttribute("src") : null;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let result;

      if (isNew) {
        // 새 글 작성 (Insert)
        result = await supabase.from("posts").insert({
          id: tempId,
          board_id: boardId,
          title: title,
          content: finalHtml,
          user_id: user.id,
          image_url: firstImageUrl, // 💡 추출한 URL 저장
        });
      } else {
        // 기존 글 수정 (Update)
        result = await supabase
          .from("posts")
          .update({
            title: title,
            content: finalHtml,
            user_id: user.id,
            image_url: firstImageUrl, // 💡 수정한 내용에서도 첫 번째 이미지 갱신
          })
          .eq("id", postId);
      }

      if (result.error) throw result.error;

      alert(isNew ? "등록되었습니다." : "수정되었습니다.");
      router.push(`/${groupId}/${companyId}/boards/${boardId}`);
    } catch (error) {
      console.error(error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center text-gray-400 font-medium animate-pulse">
        데이터 로딩 중...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-black transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>돌아가기</span>
        </button>

        {/* 💡 새 글이 아닐 때만 삭제 버튼 노출 */}
        {!isNew && (
          <button
            onClick={handleDeletePost}
            className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all font-medium text-sm"
          >
            <Trash2 className="w-4 h-4" />
            게시글 삭제
          </button>
        )}
      </div>

      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isNew ? "새 게시글 작성" : "게시글 수정"}
          </h1>
          <p className="text-gray-500 mt-2">
            {isNew
              ? "새로운 내용을 입력하여 게시글을 등록하세요."
              : "게시글의 제목과 내용을 수정하세요."}
          </p>
        </header>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">
            제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full bg-white border border-gray-200 rounded-[1.5rem] px-6 py-4 outline-none focus:ring-2 focus:ring-black transition-all text-lg font-medium shadow-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 ml-1">
            내용
          </label>
          <UniversalEditor
            initialContent={isNew ? "" : post.content}
            storageBucket={storageBucket}
            storagePath={storagePath}
            onSaveSuccess={handleSaveContent}
          />
        </div>
      </div>

      {issubmitting && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-black" />
            <p className="font-semibold text-gray-900">
              {isNew ? "등록 중..." : "업데이트 중..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
