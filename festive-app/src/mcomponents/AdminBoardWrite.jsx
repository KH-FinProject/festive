import React, { useRef, useState } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import "./AdminBoardManagement.css";
import "./AdminCommon.css";
import AdminSidebar from "./AdminSideBar";
import axiosApi from "../api/axiosAPI";
import useAuthStore from "../store/useAuthStore"; // 경로 수정 필요할 수 있음
import { useNavigate } from "react-router-dom";

const AdminBoardWrite = () => {
  const editorRef = useRef();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { member } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!member) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    const content = editorRef.current?.getInstance().getMarkdown();
    if (!content || !content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const inquiryData = {
        boardTitle: title.trim(),
        boardContent: content.trim(),
        category: "공지사항",
        priority: "상",
        inquiryStatus: "공지등록",
      };

      const response = await axiosApi.post(
        "/admin/write",
        inquiryData
      );

      if (response.status === 200) {
        alert("공지글이 성공적으로 등록되었습니다.");
        navigate("/admin/board");
      }
    } catch (error) {
      console.error("공지 등록 실패:", error);
      alert("공지 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm(
      "작성 중인 내용이 저장되지 않습니다. 정말 취소하시겠습니까?"
    );
    if (confirmCancel) {
      navigate("/admin/board");
    }
  };

  return (
    <div className="admin-management-container">
      <div className="management-content">
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">게시판 관리</h1>
          </div>

          <div className="admin-notice-header">
            <h2 className="admin-notice-title">공지글 작성</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                id="notice-title"
                className="notice-title"
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="board-content">
              <Editor
                ref={editorRef}
                height="400px"
                initialEditType="markdown"
                placeholder="내용을 입력하세요"
                previewStyle="vertical"
                hideModeSwitch={true}
                disabled={isSubmitting}
              />
            </div>
            <br />
            <div className="action-buttons">
              <button
                type="submit"
                className="btn-notice-write"
                disabled={isSubmitting}
              >
                {isSubmitting ? "등록 중..." : "공지 등록"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                취소하기
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AdminBoardWrite;
