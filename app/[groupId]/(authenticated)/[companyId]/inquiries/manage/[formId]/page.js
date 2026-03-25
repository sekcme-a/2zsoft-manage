"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  GripVertical,
  Info,
} from "lucide-react";

export default function ManageInquiryForm() {
  const { groupId, companyId, formId } = useParams(); // formId가 있으면 편집 모드
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([
    { id: 1, label: "이름", type: "text", required: true },
  ]);
  const [loading, setLoading] = useState(formId ? true : false);

  const supabase = createClient();
  const router = useRouter();

  const fetchFormConfig = async () => {
    const { data } = await supabase
      .from("inquiry_forms")
      .select("*")
      .eq("id", formId)
      .single();
    if (data) {
      setTitle(data.title);
      setDescription(data.description);
      setFields(data.fields);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (formId && formId !== "new") fetchFormConfig();
  }, [formId]);

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
    if (!title) return alert("제목을 입력하세요.");

    const payload = { company_id: companyId, title, description, fields };

    let error;
    if (formId && formId !== "new") {
      ({ error } = await supabase
        .from("inquiry_forms")
        .update(payload)
        .eq("id", formId));
    } else {
      ({ error } = await supabase.from("inquiry_forms").insert(payload));
    }

    if (!error) router.push(`/${groupId}/${companyId}/inquiries`);
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto p-8 pt-12">
      <div className="flex items-center justify-between mb-12">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-black transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> 돌아가기
        </button>
        <button
          onClick={handleSave}
          className="bg-black text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> 설정 저장하기
        </button>
      </div>

      <div className="space-y-8">
        {/* 기본 정보 */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="문의창 제목 (예: 프로젝트 의뢰)"
            className="w-full text-3xl font-bold border-none outline-none placeholder:text-gray-200 mb-4"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="문의창에 대한 설명을 입력하세요."
            className="w-full text-gray-500 border-none outline-none resize-none h-20 placeholder:text-gray-200"
          />
        </div>

        {/* 필드 구성 */}
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
            <Info className="w-3 h-3" /> 질문 항목 구성
          </p>
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6 group"
            >
              <GripVertical className="text-gray-100 group-hover:text-gray-300 cursor-move" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) =>
                    updateField(field.id, "label", e.target.value)
                  }
                  className="w-full font-bold text-gray-800 border-none outline-none bg-gray-50/50 px-4 py-2 rounded-xl"
                  placeholder="질문 내용"
                />
                <div className="flex items-center gap-4">
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(field.id, "type", e.target.value)
                    }
                    className="flex-1 bg-white border border-gray-100 px-4 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5"
                  >
                    <option value="text">단답형</option>
                    <option value="textarea">장문형</option>
                    <option value="email">이메일</option>
                    <option value="file">첨부파일</option>
                    <option value="tel">전화번호</option>
                    <option value="number">숫자</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(field.id, "required", e.target.checked)
                      }
                      className="rounded"
                    />
                    필수
                  </label>
                </div>
              </div>
              <button
                onClick={() => removeField(field.id)}
                className="p-2 text-gray-200 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>

        <button
          onClick={addField}
          className="w-full py-8 rounded-[2.5rem] border-2 border-dashed border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600 transition-all flex items-center justify-center gap-2 font-bold bg-gray-50/30"
        >
          <Plus className="w-6 h-6" /> 새로운 항목 추가
        </button>
      </div>
    </div>
  );
}
