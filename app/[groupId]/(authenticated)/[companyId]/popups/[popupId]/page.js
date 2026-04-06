"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Save, Upload, X, ImageIcon } from "lucide-react";

export default function PopupEditorPage({ params }) {
  const resolvedParams = use(params);
  const { groupId, companyId, popupId } = resolvedParams;
  const isNew = popupId === "new";

  // 새 팝업일 경우 사용할 고유 ID 미리 생성
  const [tempId] = useState(isNew ? crypto.randomUUID() : popupId);

  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (isNew) return;
    const fetchPopup = async () => {
      const { data } = await supabase
        .from("popups")
        .select("*")
        .eq("id", popupId)
        .single();
      if (data) {
        setTitle(data.title);
        setLinkUrl(data.link_url || "");
        setImageUrl(data.image_url || "");
      }
      setLoading(false);
    };
    fetchPopup();
  }, [popupId]);

  // 📷 이미지 업로드 핸들러
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `companies/${companyId}/${tempId}/${Math.random()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("popups")
        .upload(filePath, file);

      if (error) throw error;

      // 공개 URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from("popups").getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (error) {
      console.error(error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("제목을 입력해주세요.");
    if (!imageUrl) return alert("팝업 이미지를 등록해주세요.");
    setSubmitting(true);

    const payload = {
      id: tempId,
      company_id: companyId,
      title,
      link_url: linkUrl,
      image_url: imageUrl,
      is_active: true,
    };

    const { error } = isNew
      ? await supabase.from("popups").insert(payload)
      : await supabase.from("popups").update(payload).eq("id", popupId);

    if (error) {
      alert("저장 중 오류가 발생했습니다.");
    } else {
      alert(isNew ? "등록되었습니다." : "수정되었습니다.");
      router.push(`/${groupId}/${companyId}/popups`);
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div className="p-20 text-center text-gray-400 animate-pulse">
        로딩 중...
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-8">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-400 hover:text-black mb-8 group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>돌아가기</span>
      </button>

      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? "새 팝업 등록" : "팝업 정보 수정"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            팝업 이미지와 클릭 시 이동할 경로를 설정합니다.
          </p>
        </header>

        <div className="space-y-6">
          {/* 이미지 업로드 섹션 */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 ml-1">
              팝업 이미지
            </label>
            <div className="relative group">
              {imageUrl ? (
                <div className="relative aspect-[4/5] w-full max-w-sm mx-auto rounded-[2rem] overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setImageUrl("")}
                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-red-500 shadow-lg hover:bg-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-[4/5] w-full max-w-sm mx-auto rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all gap-4">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-600">이미지 업로드</p>
                    <p className="text-xs text-gray-400 mt-1">
                      클릭하여 파일을 선택하세요
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">
              관리용 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-black transition-all"
              placeholder="예: 2024 봄 이벤트 공지"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">
              클릭 시 이동할 링크 (선택)
            </label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-black transition-all"
              placeholder="https://..."
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={submitting || uploading}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:bg-gray-400 transition-all h-16"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              팝업 저장하기
            </>
          )}
        </button>
      </div>
    </div>
  );
}
