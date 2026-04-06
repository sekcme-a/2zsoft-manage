"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { motion, Reorder } from "framer-motion";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Settings2,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";

export default function PopupsPage() {
  const { groupId, companyId } = useParams();
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    const { data, error } = await supabase
      .from("popups")
      .select("*")
      .eq("company_id", companyId)
      .order("sort_order", { ascending: true });

    if (!error) setPopups(data || []);
    setLoading(false);
  };

  // 1. 활성화 토글 (띄우기/띄우지 않기)
  const toggleActive = async (id, currentStatus) => {
    const { error } = await supabase
      .from("popups")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) {
      setPopups(
        popups.map((p) =>
          p.id === id ? { ...p, is_active: !currentStatus } : p,
        ),
      );
    }
  };

  // 2. 삭제 기능
  const deletePopup = async (id) => {
    if (!confirm("이 팝업을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("popups").delete().eq("id", id);
    if (!error) setPopups(popups.filter((p) => p.id !== id));
  };

  // 3. 순서 변경 저장
  const handleReorder = async (newOrder) => {
    setPopups(newOrder);
    // 순서 데이터 업데이트 (최적화를 위해 실제 DB 반영은 로직 추가 필요)
    for (let i = 0; i < newOrder.length; i++) {
      await supabase
        .from("popups")
        .update({ sort_order: i })
        .eq("id", newOrder[i].id);
    }
  };

  if (loading)
    return <div className="p-20 text-center text-gray-400">로딩 중...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            팝업창 관리
          </h1>
          <p className="text-gray-500 mt-2">
            홈페이지에 노출될 공지 팝업을 설정하고 순서를 관리합니다.
          </p>
        </div>
        <Link
          href={`/${groupId}/${companyId}/popups/new`}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all"
        >
          <Plus className="w-5 h-5" />새 팝업 등록
        </Link>
      </header>

      {/* 팝업 리스트 (드래그 앤 드롭 순서 변경) */}
      <Reorder.Group
        axis="y"
        values={popups}
        onReorder={handleReorder}
        className="space-y-4"
      >
        {popups.map((popup) => (
          <Reorder.Item
            key={popup.id}
            value={popup}
            className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex items-center gap-6"
          >
            <div className="cursor-grab active:cursor-grabbing text-gray-300">
              <GripVertical className="w-6 h-6" />
            </div>

            <div className="w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 flex-shrink-0">
              {popup.image_url ? (
                <img
                  src={popup.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="flex-grow">
              <h3 className="text-lg font-bold text-gray-900">{popup.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                <span
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${popup.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}
                >
                  {popup.is_active ? "노출 중" : "숨김"}
                </span>
                {popup.link_url && (
                  <span className="flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> 링크 연결됨
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleActive(popup.id, popup.is_active)}
                className={`p-3 rounded-xl transition-colors ${popup.is_active ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                title={popup.is_active ? "끄기" : "켜기"}
              >
                {popup.is_active ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() =>
                  router.push(`/${groupId}/${companyId}/popups/${popup.id}`)
                }
                className="p-3 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Settings2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => deletePopup(popup.id)}
                className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {popups.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-50">
          <p className="text-gray-400 font-medium">등록된 팝업이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
