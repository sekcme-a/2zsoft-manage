"use client";

import { useState } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
// 💡 기존 Image 대신 ResizeImage 확장을 사용합니다. (기존 Image 기능 포함됨)
import ResizeImage from "tiptap-extension-resize-image";
import { Link } from "@tiptap/extension-link";
import { Youtube } from "@tiptap/extension-youtube";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import imageCompression from "browser-image-compression";
import { createClient } from "@/utils/supabase/client";
import {
  Loader2,
  Image as ImageIcon,
  Save,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Video,
} from "lucide-react";

// 💡 글자 크기(pt) 커스텀 확장 (기존 코드 유지)
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style.fontSize.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain()
            .setMark("textStyle", { fontSize: null })
            .removeEmptyTextStyle()
            .run(),
    };
  },
});

export default function UniversalEditor({
  initialContent = "",
  storageBucket = "images",
  storagePath = "posts",
  onSaveSuccess,
}) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 💡 툴바 상태 동기화를 위한 State (기존 유지)
  const [currentFont, setCurrentFont] = useState("");
  const [currentSize, setCurrentSize] = useState("12pt");

  const supabase = createClient();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      TextStyle,
      FontFamily,
      FontSize,
      // 💡 이미지 리사이징 확장 추가
      ResizeImage.configure({
        allowBase64: true, // 로컬 업로드 미리보기를 위해 허용
      }),
      Link.configure({ openOnClick: false }),
      Youtube.configure({ width: 640, height: 360 }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose max-w-none focus:outline-none min-h-[400px] p-6 border-none",
      },
    },
    onUpdate: ({ editor }) => updateToolbarStates(editor),
    onSelectionUpdate: ({ editor }) => updateToolbarStates(editor),
  });

  const updateToolbarStates = (editor) => {
    const font = editor.getAttributes("textStyle").fontFamily || "";
    setCurrentFont(font);
    const size = editor.getAttributes("textStyle").fontSize || "12pt";
    setCurrentSize(size);
  };

  const extractImageUrls = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("img"))
      .map((img) => img.getAttribute("src"))
      .filter((src) => src && src.startsWith("http"));
  };

  const onImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let uploadFile = file;
    if (file.size > 1024 * 1024) {
      setIsCompressing(true);
      try {
        uploadFile = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        });
      } finally {
        setIsCompressing(false);
      }
    }
    const reader = new FileReader();
    reader.readAsDataURL(uploadFile);
    reader.onloadend = () => {
      // 💡 ResizeImage 확장 사용 시에도 동일한 커맨드로 삽입 가능
      editor.chain().focus().setImage({ src: reader.result }).run();
    };
  };

  const handleSave = async () => {
    if (!editor || isSaving) return;
    setIsSaving(true);
    try {
      const currentHtml = editor.getHTML();
      const doc = new DOMParser().parseFromString(currentHtml, "text/html");
      const images = Array.from(doc.querySelectorAll("img"));

      for (const img of images) {
        const src = img.getAttribute("src");
        if (src && src.startsWith("data:")) {
          const blob = await (await fetch(src)).blob();
          const ext = blob.type.split("/")[1];
          const fileName = `${storagePath}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
          const { error } = await supabase.storage
            .from(storageBucket)
            .upload(fileName, blob);
          if (error) throw error;
          const {
            data: { publicUrl },
          } = supabase.storage.from(storageBucket).getPublicUrl(fileName);

          // 💡 스토리지 URL로 교체하면서 리사이징된 width/height 속성은 유지됨
          img.setAttribute("src", publicUrl);
        }
      }

      const finalHtml = doc.body.innerHTML;
      const oldUrls = extractImageUrls(initialContent);
      const newUrls = extractImageUrls(finalHtml);
      const deletedUrls = oldUrls.filter((url) => !newUrls.includes(url));

      if (deletedUrls.length > 0) {
        const pathsToDelete = deletedUrls.map(
          (url) => url.split(`${storageBucket}/`)[1],
        );
        await supabase.storage.from(storageBucket).remove(pathsToDelete);
      }
      if (onSaveSuccess) await onSaveSuccess(finalHtml);
    } catch (error) {
      console.error(error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="w-full border border-gray-200 rounded-[2.5rem] bg-white overflow-hidden shadow-sm">
      {/* --- 툴바 섹션 (기존 기능 100% 유지) --- */}
      <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-2 hover:bg-gray-200 rounded-lg"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-2 hover:bg-gray-200 rounded-lg"
        >
          <Redo className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />

        <select
          value={currentFont}
          onChange={(e) =>
            editor.chain().focus().setFontFamily(e.target.value).run()
          }
          className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">기본 글꼴</option>
          <option value="'Noto Sans KR', sans-serif">본고딕</option>
          <option value="'Nanum Gothic', sans-serif">나눔고딕</option>
          <option value="'Nanum Myeongjo', serif">나눔명조</option>
          <option value="'PrunJeonnam', sans-serif">푸른전남</option>
          <option value="'Hamchorom Batang', serif">함초롬바탕</option>
        </select>

        <select
          value={currentSize}
          onChange={(e) =>
            editor.chain().focus().setFontSize(e.target.value).run()
          }
          className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-black"
        >
          <option value="10pt">10pt</option>
          <option value="12pt">12pt</option>
          <option value="14pt">14pt</option>
          <option value="18pt">18pt</option>
          <option value="24pt">24pt</option>
          <option value="36pt">36pt</option>
        </select>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg ${editor.isActive("bold") ? "bg-black text-white" : "hover:bg-gray-200"}`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg ${editor.isActive("italic") ? "bg-black text-white" : "hover:bg-gray-200"}`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg ${editor.isActive("bulletList") ? "bg-black text-white" : "hover:bg-gray-200"}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg ${editor.isActive("orderedList") ? "bg-black text-white" : "hover:bg-gray-200"}`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg ${editor.isActive("blockquote") ? "bg-black text-white" : "hover:bg-gray-200"}`}
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => {
            const url = prompt("YouTube URL");
            if (url) editor.commands.setYoutubeVideo({ src: url });
          }}
          className="p-2 hover:bg-gray-200 rounded-lg"
        >
          <Video className="w-4 h-4" />
        </button>

        <label className="p-2 hover:bg-gray-200 rounded-lg cursor-pointer flex items-center">
          <ImageIcon className="w-4 h-4 text-gray-600" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onImageChange}
          />
        </label>

        <div className="ml-auto flex items-center gap-3">
          {isCompressing && (
            <span className="text-[10px] font-bold text-blue-500 animate-pulse">
              COMPRESSING...
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all font-semibold shadow-lg shadow-black/10"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            게시글 저장
          </button>
        </div>
      </div>

      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* --- 💡 스타일 섹션 (리사이징 핸들러 스타일 추가) --- */}
      <style jsx global>{`
        .prose ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 1rem 0 !important;
        }
        .prose ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 1rem 0 !important;
        }
        .prose blockquote {
          border-left: 4px solid #e5e7eb !important;
          padding-left: 1rem !important;
          font-style: italic !important;
          margin: 1rem 0 !important;
        }

        /* 💡 이미지 리사이징 관련 스타일 */
        .prose img {
          display: block;
          max-width: 100%;
          height: auto;
          cursor: pointer;
        }

        /* 이미지가 선택되었을 때 조절 핸들이 보이도록 설정 */
        .prose img.ProseMirror-selectednode {
          outline: 3px solid #000;
        }

        /* 조절 핸들이 너무 커지지 않게 조정 */
        .prose .resizer {
          display: inline-block;
          line-height: 0;
        }
      `}</style>
    </div>
  );
}
