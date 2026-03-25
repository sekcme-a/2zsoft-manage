"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import imageCompression from "browser-image-compression";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

export default function Editor({
  initialContent = "",
  onSave,
  storageBucket = "board_images",
  storagePath = "posts",
}) {
  const [content, setContent] = useState(initialContent);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]); // 현재 세션에서 업로드된 이미지 추적
  const supabase = createClient();
  const editorRef = useRef(null);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // 이미지 압축 및 업로드 로직
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let uploadFile = file;
    // 1MB 이상일 경우 압축 실행
    if (file.size > 1024 * 1024) {
      setIsCompressing(true);
      try {
        const options = {
          maxSizeMB: 0.9,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        uploadFile = await imageCompression(file, options);
      } catch (error) {
        console.error("Compression error:", error);
      } finally {
        setIsCompressing(false);
      }
    }

    const fileExt = uploadFile.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const fullPath = `${storagePath}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(storageBucket)
      .upload(fullPath, uploadFile);

    if (error) return alert("업로드 실패");

    const {
      data: { publicUrl },
    } = supabase.storage.from(storageBucket).getPublicUrl(fullPath);

    // 에디터에 이미지 삽입 (HTML 구조)
    const imgHtml = `<img src="${publicUrl}" data-path="${fullPath}" class="max-w-full rounded-2xl my-4" />`;
    document.execCommand("insertHTML", false, imgHtml);

    setUploadedImages((prev) => [...prev, fullPath]);
  };

  // 저장 시 실행: 에디터에서 사라진 이미지를 스토리지에서 삭제
  const handleSaveClick = async () => {
    const currentHtml = editorRef.current.innerHTML;

    // 에디터 내의 모든 img 태그에서 data-path 추출
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, "text/html");
    const currentPaths = Array.from(doc.querySelectorAll("img"))
      .map((img) => img.getAttribute("data-path"))
      .filter((path) => path !== null);

    // 이전에 업로드했으나 현재 HTML에는 없는 경로들 찾기
    const pathsToDelete = uploadedImages.filter(
      (path) => !currentPaths.includes(path),
    );

    if (pathsToDelete.length > 0) {
      await supabase.storage.from(storageBucket).remove(pathsToDelete);
    }

    onSave(currentHtml, currentPaths[0] || null); // 첫 번째 이미지를 썸네일로 활용 가능
  };

  return (
    <div className="w-full space-y-4">
      {isCompressing && (
        <div className="flex items-center gap-2 text-blue-500 text-sm font-medium animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" /> 이미지 압축 중...
        </div>
      )}

      {/* 툴바 */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100">
        <label className="p-2 hover:bg-white rounded-xl cursor-pointer transition-all shadow-sm">
          <ImagePlus className="w-5 h-5" />
          <input
            type="file"
            className="hidden"
            onChange={handleImageUpload}
            accept="image/*"
          />
        </label>
        <button
          onClick={() => document.execCommand("bold")}
          className="p-2 hover:bg-white rounded-xl font-bold transition-all shadow-sm px-4"
        >
          B
        </button>
      </div>

      {/* 편집 영역 */}
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => setContent(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: initialContent }}
        className="min-h-[400px] p-8 bg-white border border-gray-100 rounded-[2rem] outline-none focus:ring-2 focus:ring-black/5 transition-all text-[16px] leading-relaxed prose prose-slate max-w-none"
        placeholder="내용을 입력하세요..."
      />

      <div className="flex justify-end">
        <button
          onClick={handleSaveClick}
          className="bg-black text-white px-10 py-4 rounded-2xl font-semibold hover:bg-gray-800 transition-all active:scale-95"
        >
          저장하기
        </button>
      </div>
    </div>
  );
}
