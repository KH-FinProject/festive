import React, { useRef, useState } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import Title from "./Title";
import "./WritePage.css";
import { useNavigate } from "react-router-dom";
import axiosApi from "../../api/axiosAPI";
import useAuthStore from "../../store/useAuthStore";

function WritePage() {
  const navigate = useNavigate();
  const editorRef = useRef();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { member } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 디버깅용 로그

    // 로그인 체크
    if (!member) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }

    // 제목 검증
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    // 내용 검증
    const content = editorRef.current.getInstance().getMarkdown();
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const boardData = {
        boardTitle: title.trim(),
        boardContent: content.trim(),
        boardTypeNo: 1, // 일반 게시판
      };

      const response = await axiosApi.post("/api/wagle/boards", boardData);

      if (response.status === 200) {
        alert("게시글이 성공적으로 작성되었습니다.");
        navigate("/wagle");
      }
    } catch (error) {
      console.error("게시글 작성 실패:", error);

      if (error.response) {
        // 서버에서 응답이 온 경우
        const errorMessage =
          error.response.data || "게시글 작성에 실패했습니다.";
        alert(errorMessage);
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        alert("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      } else {
        // 요청 자체를 보내지 못한 경우
        alert("게시글 작성 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm(
      "작성 중인 내용이 저장되지 않습니다. 정말 취소하시겠습니까?"
    );
    if (confirmCancel) {
      navigate("/wagle");
    }
  };

  return (
    <div className="wagle-write-outer">
      <Title currentPage="게시글 작성" />
      <div className="wagle-write-form-container">
        <form onSubmit={handleSubmit} className="wagle-write-form">
          <input
            className="wagle-write-input-title"
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            disabled={isSubmitting}
            required
          />
          <Editor
            ref={editorRef}
            height="400px"
            initialEditType="markdown"
            placeholder="내용을 입력하세요"
            previewStyle="vertical"
            hideModeSwitch={true}
            disabled={isSubmitting}
            hooks={{
              addImageBlobHook: async (blob, callback) => {
                const formData = new FormData();
                formData.append("image", blob);
                try {
                  const res = await fetch(
                    "http://localhost:8080/api/board/upload-image",
                    {
                      method: "POST",
                      body: formData,
                      credentials: "include",
                    }
                  );
                  const imageUrl = await res.text();
                  callback(imageUrl, "image");
                } catch {
                  alert("이미지 업로드 실패");
                }
                return false;
              },
            }}
          />
          <div className="wagle-write-btns">
            <button
              type="button"
              className="wagle-write-cancel"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="wagle-write-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "작성 중..." : "글작성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WritePage;
