"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Download,
  FileText,
  Trash2,
  Loader2,
} from "lucide-react";

export default function SubmissionDetail() {
  const [submission, setSubmission] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { submissionId } = useParams();
  const supabase = createClient();
  const router = useRouter();

  const fetchAndMarkAsRead = async () => {
    const { data } = await supabase
      .from("inquiry_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (data) {
      setSubmission(data);
      if (!data.is_read) {
        await supabase
          .from("inquiry_submissions")
          .update({ is_read: true })
          .eq("id", submissionId);
      }
    }
  };

  useEffect(() => {
    if (submissionId) fetchAndMarkAsRead();
  }, [submissionId]);

  // 1. 파일 다운로드 핸들러 (서명된 URL 생성)
  const handleDownload = async (path) => {
    try {
      const { data, error } = await supabase.storage
        .from("inquiry_attachments")
        .createSignedUrl(path, 60); // 60초간 유효한 링크

      if (error) throw error;

      // 브라우저 새 탭에서 다운로드 실행
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = path.split("/").pop(); // 파일명만 추출
      link.click();
    } catch (error) {
      console.error(error);
      alert("파일을 불러오는 데 실패했습니다.");
    }
  };

  // 삭제 핸들러 (Storage 파일 + DB 레코드 통합 삭제)
  const handleDelete = async () => {
    if (
      !confirm(
        "이 문의 내역을 정말 삭제하시겠습니까? 첨부된 파일도 모두 스토리지에서 삭제됩니다.",
      )
    )
      return;

    setIsDeleting(true);
    try {
      // 1. submission.content에서 삭제할 파일 경로들 수집
      const filesToDelete = [];

      if (submission.content) {
        Object.values(submission.content).forEach((value) => {
          // 배열인 경우 (다중 파일)
          if (Array.isArray(value)) {
            filesToDelete.push(...value);
          }
          // 문자열이면서 특정 경로를 포함한 경우 (단일 파일)
          else if (typeof value === "string" && value.includes("companies/")) {
            filesToDelete.push(value);
          }
        });
      }

      // 2. 스토리지 파일 삭제 실행
      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("inquiry_attachments")
          .remove(filesToDelete);

        if (storageError) {
          console.error("스토리지 파일 삭제 실패:", storageError);
          // 파일 삭제 실패 시 사용자에게 알리지만, DB 삭제를 진행할지 여부는 정책에 따라 결정 가능합니다.
          // 여기서는 안전을 위해 중단하지 않고 계속 진행하도록 구성했습니다.
        }
      }

      // 3. DB 레코드 삭제
      const { error: dbError } = await supabase
        .from("inquiry_submissions")
        .delete()
        .eq("id", submissionId);

      if (dbError) throw dbError;

      alert("문의 내역과 첨부파일이 모두 삭제되었습니다.");
      router.push("./"); // 이전 목록 페이지로 이동
    } catch (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!submission) return null;

  return (
    <div className="max-w-4xl mx-auto p-8 pt-12">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-sm text-gray-400 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로가기
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-600 transition"
        >
          {isDeleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          문의 삭제하기
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 확인 완료
          </span>
          <span className="flex items-center text-xs text-gray-400 gap-1">
            <Clock className="w-3 h-3" />{" "}
            {new Date(submission.created_at).toLocaleString()}
          </span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-12">
          문의 상세 내용
        </h1>

        <div className="grid grid-cols-1 gap-6">
          {Object.entries(submission.content).map(([key, value], index) => {
            // 💡 파일 데이터인지 판별 (배열이거나 경로 문자열인 경우)
            const isFile =
              Array.isArray(value) ||
              (typeof value === "string" && value.includes("companies/"));

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
              >
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  {key}
                </label>

                {isFile ? (
                  <div className="flex flex-wrap gap-3">
                    {/* 값이 배열이면 여러 개 출력, 문자열이면 한 개 출력 */}
                    {(Array.isArray(value) ? value : [value]).map(
                      (path, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleDownload(path)}
                          className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 px-5 py-3 rounded-2xl transition-all group"
                        >
                          <FileText className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">
                            {path.split("/").pop()}
                          </span>
                          <Download className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                        </button>
                      ),
                    )}
                  </div>
                ) : (
                  <p className="text-lg text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
                    {value || "-"}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center border-t border-gray-50 pt-12">
          <button
            onClick={() => router.back()}
            className="bg-black text-white px-12 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 active:scale-95"
          >
            목록으로 돌아가기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
