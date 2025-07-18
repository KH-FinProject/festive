import React, { useRef, useState } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import Title from "./Title";
import "./CustomerWrite.css";
import { useNavigate } from "react-router-dom";
import axiosApi from "../../api/axiosAPI";
import useAuthStore from "../../store/useAuthStore";

function CustomerWrite() {
  const navigate = useNavigate();
  const editorRef = useRef();
  const [title, setTitle] = useState("");
  const [category] = useState("기타");
  const [priority] = useState("일반");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { member } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const inquiryData = {
        boardTitle: title.trim(),
        boardContent: content.trim(),
        category: category,
        priority: priority,
        inquiryStatus: "대기중",
      };

      const response = await axiosApi.post("/api/customer/boards", inquiryData);

      if (response.status === 200) {
        alert("문의가 성공적으로 등록되었습니다.");
        navigate("/customer-center");
      }
    } catch (error) {
      console.error("문의 등록 실패:", error);

      if (error.response) {
        // 서버에서 응답이 온 경우
        const errorMessage = error.response.data || "문의 등록에 실패했습니다.";
        alert(errorMessage);
      } else if (error.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        alert("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      } else {
        // 요청 자체를 보내지 못한 경우
        alert("문의 등록 중 오류가 발생했습니다.");
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
      navigate("/customer-center");
    }
  };

  return (
    <div className="customer-write-outer">
      <div className="customer-write-title-wrapper">
        <Title />
      </div>
      <div className="customer-write-form-container">
        <form onSubmit={handleSubmit} className="customer-write-form">
          <div className="customer-write-header">
            <input
              className="customer-write-input-title"
              type="text"
              placeholder="문의 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={isSubmitting}
              required
            />
          </div>
          <Editor
            ref={editorRef}
            height="400px"
            initialEditType="markdown"
            placeholder="문의 내용을 입력하세요"
            previewStyle="vertical"
            hideModeSwitch={true}
            disabled={isSubmitting}
            hooks={{
              addImageBlobHook: async (blob, callback) => {
                const formData = new FormData();
                formData.append("image", blob);
                try {
                  const res = await axiosApi.post(
                    "/api/board/upload-image",
                    formData,
                    {
                      headers: { "Content-Type": "multipart/form-data" },
                    }
                  );
                  const imageUrl = res.data;
                  callback(imageUrl, "image");
                } catch {
                  alert("이미지 업로드 실패");
                }
                return false;
              },
            }}
          />
          <div className="customer-write-btns">
            <button
              type="button"
              className="customer-write-cancel"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="customer-write-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "등록 중..." : "문의등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerWrite;
