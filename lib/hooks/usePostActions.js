import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePostWithStorage } from "../services/posts";

export const usePostActions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleDelete = async ({
    postId,
    storageBucket,
    storagePath,
    redirectUrl,
  }) => {
    if (!confirm("정말로 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다."))
      return;

    setIsSubmitting(true);
    try {
      await deletePostWithStorage({ postId, storageBucket, storagePath });
      alert("삭제되었습니다.");
      if (redirectUrl) router.push(redirectUrl);
      return { success: true };
    } catch (error) {
      console.error("Delete Error:", error);
      alert("삭제 중 오류가 발생했습니다.");
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleDelete,
  };
};
