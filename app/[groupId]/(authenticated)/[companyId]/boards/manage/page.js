"use client";

import { use, useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, Reorder } from "framer-motion";
import {
  Plus,
  Trash2,
  LayoutList,
  Image as ImageIcon,
  Lock,
  GripVertical,
  Edit2,
  Check,
  X,
  Save,
} from "lucide-react";

export default function BoardManagement({ params }) {
  const resolvedParams = use(params);
  const companyId = resolvedParams?.companyId;
  const [boards, setBoards] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  // 생성용 상태
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardType, setNewBoardType] = useState("text");

  // 편집용 상태
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const supabase = createClient();

  const fetchBoardsAndRole = useCallback(async () => {
    if (!companyId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [roleRes, boardsRes] = await Promise.all([
      supabase
        .from("company_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .single(),
      supabase
        .from("boards")
        .select("*")
        .eq("company_id", companyId)
        .order("sort_order", { ascending: true }),
    ]);

    setRole(roleRes.data?.role);
    setBoards(boardsRes.data || []);
    setLoading(false);
    setHasChanged(false);
  }, [companyId, supabase]);

  useEffect(() => {
    fetchBoardsAndRole();
  }, [fetchBoardsAndRole]);

  // 생성
  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    const { error } = await supabase.from("boards").insert({
      company_id: companyId,
      name: newBoardName,
      type: newBoardType,
      sort_order: boards.length,
    });

    if (!error) {
      setNewBoardName("");
      fetchBoardsAndRole();
    }
  };

  // 삭제
  const handleDeleteBoard = async (id) => {
    if (!confirm("정말 이 게시판을 삭제하시겠습니까?")) return;
    await supabase.from("boards").delete().eq("id", id);
    fetchBoardsAndRole();
  };

  // 이름 수정 저장
  const handleUpdateName = async (id) => {
    if (!editName.trim()) return;
    const { error } = await supabase
      .from("boards")
      .update({ name: editName })
      .eq("id", id);

    if (!error) {
      setEditingId(null);
      fetchBoardsAndRole();
    }
  };

  // 드래그 시 상태만 변경
  const handleReorder = (newOrder) => {
    setBoards(newOrder);
    setHasChanged(true);
  };

  // 최종 순서 DB 저장 (버튼 클릭 시)
  const saveOrder = async () => {
    setIsSaving(true);

    // 에러 방지: id와 sort_order만 포함하여 전송
    // upsert 시 'onConflict'를 지정하거나 필수 값을 모두 포함해야 하지만,
    // 여기서는 여러 번의 update를 수행하는 것이 가장 안전합니다.
    const promises = boards.map((board, index) =>
      supabase.from("boards").update({ sort_order: index }).eq("id", board.id),
    );

    try {
      await Promise.all(promises);
      alert("순서가 저장되었습니다.");
      setHasChanged(false);
    } catch (error) {
      console.error(error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        데이터를 불러오는 중...
      </div>
    );

  if (role !== "super_admin") {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">접근 권한 없음</h2>
        <p className="text-gray-500 mt-2">최고 관리자만 접근할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">게시판 관리</h1>
          <p className="text-gray-500 mt-1">
            게시판을 추가하거나 드래그하여 순서를 변경하세요.
          </p>
        </div>
      </header>

      {/* 생성 폼 */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10">
        <form
          onSubmit={handleCreateBoard}
          className="flex flex-col sm:flex-row gap-4 items-end"
        >
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              게시판 이름
            </label>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="예: 공지사항"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              타입
            </label>
            <select
              value={newBoardType}
              onChange={(e) => setNewBoardType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all appearance-none"
            >
              <option value="text">글 게시판</option>
              <option value="image">이미지 게시판</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center font-medium"
          >
            <Plus className="w-5 h-5 mr-2" /> 생성하기
          </button>
        </form>
        <p className="mt-3 text-xs -mb-0.5 text-gray-800">
          *새로 만든 게시판은 우선 관리자 페이지에서만 확인하실 수 있어요. 본
          사이트에도 게시판이 보이게 설정하려면 문의해주세요.
        </p>
      </section>

      {/* 게시판 리스트 */}
      <Reorder.Group
        axis="y"
        values={boards}
        onReorder={handleReorder}
        className="space-y-4"
      >
        {boards.map((board) => (
          <Reorder.Item
            key={board.id}
            value={board}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4 flex-1">
              <GripVertical className="w-5 h-5 text-gray-300 group-hover:text-gray-400 shrink-0" />
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                {board.type === "text" ? (
                  <LayoutList className="w-5 h-5 text-gray-500" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {editingId === board.id ? (
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleUpdateName(board.id)
                    }
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleUpdateName(board.id)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-medium text-gray-900 truncate">
                    {board.name}
                  </h3>
                  <p className="text-xs text-gray-400 capitalize">
                    {board.type === "text" ? "텍스트형" : "갤러리형"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {editingId !== board.id && (
                <button
                  onClick={() => {
                    if (board.is_fixed) {
                      alert(
                        "기본 게시물 이름은 변경할 수 없습니다. 변경을 원하시면 관리자에게 문의하세요.",
                      );
                      return;
                    }
                    setEditingId(board.id);
                    setEditName(board.name);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  if (board.is_fixed) {
                    alert(
                      "기본 게시물 이름은 삭제할 수 없습니다. 삭제를 원하시면 관리자에게 문의하세요.",
                    );
                    return;
                  }
                  handleDeleteBoard(board.id);
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      {hasChanged && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={saveOrder}
          disabled={isSaving}
          className="flex items-center justify-center mt-5 w-full
           bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 
           transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "저장 중..." : "변경된 순서 저장하기"}
        </motion.button>
      )}

      {boards.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
          생성된 게시판이 없습니다.
        </div>
      )}
    </div>
  );
}
