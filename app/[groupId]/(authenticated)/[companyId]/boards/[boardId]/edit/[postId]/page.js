"use client";

import { use, useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Trash2, Paperclip, X } from "lucide-react";
import UniversalEditor from "@/components/UniversialEditor";

export default function PostEditorPage({ params }) {
  const resolvedParams = use(params);
  const { groupId, companyId, boardId, postId } = resolvedParams;

  const isNew = postId === "new";

  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [issubmitting, setIsSubmitting] = useState(false);

  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const [tempId] = useState(isNew ? crypto.randomUUID() : postId);

  const supabase = createClient();
  const router = useRouter();

  const storageBucket = "board_images";
  const storagePath = `companies/${companyId}/boards/${boardId}/${tempId}`;
  const fileStoragePath = `${storagePath}/attachments`;

  const sanitizeFileName = (fileName) => {
    const extension = fileName.split(".").pop();
    const nameWithoutExtension = fileName.split(".").slice(0, -1).join(".");
    const safeName = nameWithoutExtension
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_{2,}/g, "_");
    return `${safeName}.${extension}`;
  };

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
      setFiles(data.attachments || []);
      setLoading(false);
    };
    fetchPost();
  }, [postId, isNew, supabase, router]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = selectedFiles.map((file) => ({
      name: file.name,
      fileObject: file,
      url: null,
    }));
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 게시글 삭제 시 전체 폴더 삭제 로직 (기존과 동일)
  const handleDeletePost = async () => {
    if (!confirm("정말로 삭제하시겠습니까? 모든 데이터가 삭제됩니다.")) return;
    setIsSubmitting(true);
    try {
      const { data: rootFiles } = await supabase.storage
        .from(storageBucket)
        .list(storagePath);
      const { data: attachmentFiles } = await supabase.storage
        .from(storageBucket)
        .list(`${storagePath}/attachments`);

      let pathsToDelete = [];
      if (rootFiles) {
        rootFiles.forEach((f) => {
          if (
            f.name !== ".emptyFolderPlaceholder" &&
            f.name !== "attachments"
          ) {
            pathsToDelete.push(`${storagePath}/${f.name}`);
          }
        });
      }
      if (attachmentFiles) {
        attachmentFiles.forEach((f) => {
          if (f.name !== ".emptyFolderPlaceholder") {
            pathsToDelete.push(`${storagePath}/attachments/${f.name}`);
          }
        });
      }
      if (pathsToDelete.length > 0) {
        await supabase.storage.from(storageBucket).remove(pathsToDelete);
      }
      await supabase.from("posts").delete().eq("id", postId);
      alert("삭제되었습니다.");
      router.push(`/${groupId}/${companyId}/boards/${boardId}`);
    } catch (error) {
      console.error(error);
      alert("삭제 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveContent = async (finalHtml) => {
    if (!title.trim()) return alert("제목을 입력해주세요.");
    setIsSubmitting(true);

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(finalHtml, "text/html");
      const firstImg = doc.querySelector("img");
      const firstImageUrl = firstImg ? firstImg.getAttribute("src") : null;

      // --- 💡 1. 스토리지 파일 정리 로직 추가 ---
      // 현재 UI(files 상태)에 없는 파일이 스토리지에 남아있다면 삭제해야 합니다.
      if (!isNew) {
        const { data: currentStoredFiles } = await supabase.storage
          .from(storageBucket)
          .list(fileStoragePath);

        if (currentStoredFiles && currentStoredFiles.length > 0) {
          // 현재 UI에 남아있는 파일들의 '파일명'만 추출 (URL 기반 비교)
          // 스토리지 파일명은 타임스탬프가 붙어있으므로 URL 매칭으로 확인하는게 정확합니다.
          const activeUrls = files.filter((f) => f.url).map((f) => f.url);

          const filesToDelete = [];
          for (const storageFile of currentStoredFiles) {
            if (storageFile.name === ".emptyFolderPlaceholder") continue;

            const {
              data: { publicUrl },
            } = supabase.storage
              .from(storageBucket)
              .getPublicUrl(`${fileStoragePath}/${storageFile.name}`);

            // UI에 없는 파일(이미 삭제 버튼을 누른 파일)이면 삭제 목록에 추가
            if (!activeUrls.includes(publicUrl)) {
              filesToDelete.push(`${fileStoragePath}/${storageFile.name}`);
            }
          }

          if (filesToDelete.length > 0) {
            await supabase.storage.from(storageBucket).remove(filesToDelete);
          }
        }
      }

      // 2. 새 파일 업로드 로직
      const updatedAttachments = [];
      for (const item of files) {
        if (item.fileObject) {
          const safeName = sanitizeFileName(item.name);
          const fileName = `${Date.now()}_${safeName}`;
          const { data, error } = await supabase.storage
            .from(storageBucket)
            .upload(`${fileStoragePath}/${fileName}`, item.fileObject);

          if (error) throw error;
          const {
            data: { publicUrl },
          } = supabase.storage
            .from(storageBucket)
            .getPublicUrl(`${fileStoragePath}/${fileName}`);

          updatedAttachments.push({ name: item.name, url: publicUrl });
        } else {
          updatedAttachments.push({ name: item.name, url: item.url });
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const payload = {
        title: title,
        content: finalHtml,
        user_id: user.id,
        image_url: firstImageUrl,
        attachments: updatedAttachments,
      };

      let result;
      if (isNew) {
        result = await supabase
          .from("posts")
          .insert({ id: tempId, board_id: boardId, ...payload });
      } else {
        result = await supabase.from("posts").update(payload).eq("id", postId);
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
      {/* UI 부분은 기존과 동일하므로 생략하거나 그대로 유지하세요 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-black transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>돌아가기</span>
        </button>
        {!isNew && (
          <button
            onClick={handleDeletePost}
            className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all font-medium text-sm"
          >
            <Trash2 className="w-4 h-4" /> 게시글 삭제
          </button>
        )}
      </div>

      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isNew ? "새 게시글 작성" : "게시글 수정"}
          </h1>
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
          <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-2">
            <Paperclip className="w-4 h-4" /> 첨부파일
          </label>
          <div className="p-4 border-2 border-dashed border-gray-100 rounded-[1.5rem] bg-gray-50/50">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 transition-all shadow-sm"
            >
              파일 선택하기
            </button>
            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white border border-gray-100 px-4 py-2 rounded-xl"
                  >
                    <span className="text-sm text-gray-600 truncate flex-1 pr-4">
                      {file.name}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
