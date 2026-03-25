import { createClient } from "@/utils/supabase/client";

/**
 * 게시글 및 관련 스토리지 파일 전체 삭제
 */
export const deletePostWithStorage = async ({
  postId,
  storageBucket,
  storagePath,
}) => {
  const supabase = createClient();

  // 1. Storage 파일 목록 조회 및 삭제
  const { data: files, error: listError } = await supabase.storage
    .from(storageBucket)
    .list(storagePath);

  if (listError) throw listError;

  if (files && files.length > 0) {
    const paths = files.map((f) => `${storagePath}/${f.name}`);
    const { error: storageError } = await supabase.storage
      .from(storageBucket)
      .remove(paths);

    if (storageError) throw storageError;
  }

  // 2. DB 레코드 삭제
  const { error: dbError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (dbError) throw dbError;

  return { success: true };
};
