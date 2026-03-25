"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  CheckCircle,
  Loader2,
  Paperclip,
  X,
  FileText,
} from "lucide-react";

export default function InquiryForm({ formId, companyId }) {
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState({}); // 일반 텍스트 데이터
  const [selectedFiles, setSelectedFiles] = useState({}); // 파일 객체 저장 { label: File[] }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const supabase = createClient();

  const fetchConfig = async () => {
    const { data } = await supabase
      .from("inquiry_forms")
      .select("*")
      .eq("id", formId)
      .single();
    setFormConfig(data);
  };

  useEffect(() => {
    if (formId) fetchConfig();
  }, [formId]);

  // 1. 파일 선택 핸들러 (Storage 저장 안 함)
  const handleFileChange = (label, files, inputElement) => {
    if (!files) return;
    const newFiles = Array.from(files);

    // 기존 파일 리스트에 추가 (다중 파일 지원 대비)
    setSelectedFiles((prev) => ({
      ...prev,
      [label]: [...(prev[label] || []), ...newFiles],
    }));

    // ✨ 핵심: input의 value를 비워줍니다.
    // 이렇게 하면 다음에 같은 파일을 선택해도 onChange가 다시 트리거됩니다.
    if (inputElement) {
      inputElement.value = "";
    }
  };

  // 2. 파일 삭제 핸들러 (리스트에서만 제거)
  const removeFile = (label, index) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [label]: prev[label].filter((_, i) => i !== index),
    }));
  };

  // 3. 실제 제출 시 파일 업로드 로직
  const uploadAllFiles = async () => {
    const uploadResults = {};

    for (const label in selectedFiles) {
      const filesToUpload = selectedFiles[label];
      const paths = [];

      for (const file of filesToUpload) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `companies/${companyId}/inquiries/${formId}/${fileName}`;

        const { error } = await supabase.storage
          .from("inquiry_attachments")
          .upload(filePath, file);

        if (error) throw new Error(`${file.name} 업로드 실패`);
        paths.push(filePath);
      }
      uploadResults[label] = paths; // 해당 라벨에 저장된 경로 리스트
    }
    return uploadResults;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 💡 [Step 1] 파일들을 Storage에 먼저 업로드
      const filePaths = await uploadAllFiles();

      // 💡 [Step 2] 텍스트 데이터와 파일 경로를 합쳐서 DB 저장
      const finalSubmissionData = {
        ...formData,
        ...filePaths, // { "첨부파일": ["path1", "path2"] } 형태로 포함됨
      };

      const { error } = await supabase.from("inquiry_submissions").insert({
        form_id: formId,
        content: finalSubmissionData,
      });

      if (error) throw error;
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      alert(error.message || "제출 중 오류 발생");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formConfig) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-xl text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">접수 완료!</h2>
            <p className="text-gray-500">
              문의하신 내용이 정상적으로 전달되었습니다.
            </p>
          </motion.div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold">{formConfig.title}</h2>
              <p className="text-gray-400 mt-2">{formConfig.description}</p>
            </div>

            {formConfig.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-widest">
                  {field.label} {field.required && "•"}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    required={field.required}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [field.label]: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-black/5 min-h-[120px]"
                  />
                ) : field.type === "file" ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="file"
                        multiple // 다중 파일 선택 가능
                        onChange={(e) =>
                          handleFileChange(
                            field.label,
                            e.target.files,
                            e.target,
                          )
                        }
                        className="hidden"
                        id={`file-${field.id}`}
                      />
                      <label
                        htmlFor={`file-${field.id}`}
                        className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-2xl px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500 font-medium">
                          파일 첨부하기
                        </span>
                      </label>
                    </div>

                    {/* 💡 선택된 파일 리스트 UI */}
                    <AnimatePresence>
                      {selectedFiles[field.label]?.map((file, idx) => (
                        <motion.div
                          key={`${file.name}-${idx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="text-sm text-gray-600 truncate">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(field.label, idx)}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    required={field.required}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [field.label]: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-black/5"
                  />
                )}
              </div>
            ))}

            <button
              disabled={isSubmitting}
              className="w-full bg-black text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95 disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>제출 중...</span>
                </>
              ) : (
                "문의하기"
              )}
            </button>
          </form>
        )}
      </AnimatePresence>
    </div>
  );
}
