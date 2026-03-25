"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { motion, Reorder } from "framer-motion";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Type,
  AlignLeft,
  CheckSquare,
} from "lucide-react";

export default function CreateInquiryForm() {
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState([
    { id: 1, label: "이름", type: "text", required: true },
    { id: 2, label: "연락처", type: "text", required: true },
  ]);

  const supabase = createClient();
  const router = useRouter();
  const { groupId, companyId } = useParams();

  const addField = () => {
    const newField = {
      id: Date.now(),
      label: "새 질문",
      type: "text",
      required: false,
    };
    setFields([...fields, newField]);
  };

  const removeField = (id) => setFields(fields.filter((f) => f.id !== id));

  const updateField = (id, key, value) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const handleSave = async () => {
    if (!title) return alert("문의창 제목을 입력하세요.");

    const { error } = await supabase.from("inquiry_forms").insert({
      company_id: companyId,
      title,
      fields,
    });

    if (!error) router.push(`/${groupId}/${companyId}/inquiries`);
  };

  return (
    <div className="max-w-3xl mx-auto p-8 pt-12">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-400 hover:text-black mb-8 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로가기
      </button>

      <div className="flex items-center justify-between mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          문의창 커스텀
        </h1>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-semibold hover:bg-gray-800 transition-all"
        >
          <Save className="w-4 h-4" /> 저장하기
        </button>
      </div>

      <div className="space-y-6">
        {/* 제목 설정 */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="문의창 제목을 입력하세요 (예: 제휴 문의)"
            className="w-full text-2xl font-bold border-none outline-none placeholder:text-gray-200"
          />
        </div>

        {/* 필드 구성 (네이버 폼 스타일) */}
        <div className="space-y-4">
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 group"
            >
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) =>
                    updateField(field.id, "label", e.target.value)
                  }
                  className="w-full font-semibold outline-none border-b border-transparent focus:border-gray-100 pb-1"
                />
                <div className="flex items-center gap-4">
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(field.id, "type", e.target.value)
                    }
                    className="text-xs bg-gray-50 px-3 py-1.5 rounded-lg border-none outline-none text-gray-500"
                  >
                    <option value="text">단답형</option>
                    <option value="textarea">장문형</option>
                    <option value="email">이메일</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(field.id, "required", e.target.checked)
                      }
                      className="rounded"
                    />
                    필수항목
                  </label>
                </div>
              </div>
              <button
                onClick={() => removeField(field.id)}
                className="p-2 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>

        <button
          onClick={addField}
          className="w-full py-6 rounded-[2rem] border-2 border-dashed border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" /> 항목 추가하기
        </button>
      </div>
    </div>
  );
}
