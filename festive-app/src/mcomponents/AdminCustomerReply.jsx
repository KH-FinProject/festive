import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import AdminSidebar from "./AdminSideBar";
import axiosApi from "../api/axiosAPI";
import "./AdminCustomerService.css";

const AdminCustomerReply = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editorRef = useRef();
  const [inquiry, setInquiry] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInquiryDetail = async (boardNo) => {
      try {
        const res = await axiosApi.get(`/api/customer/boards/${boardNo}`);
        setInquiry(res.data);
      } catch {
        navigate("/admin/customer");
      }
    };

    if (location.state && location.state.inquiry) {
      const { boardNo } = location.state.inquiry;
      if (boardNo) {
        fetchInquiryDetail(boardNo);
      } else {
        setInquiry(location.state.inquiry);
      }
    } else {
      navigate("/admin/customer");
    }
  }, [location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inquiry) {
      alert("문의 정보를 찾을 수 없습니다.");
      return;
    }

    const replyContent = editorRef.current.getInstance().getMarkdown();
    if (!replyContent.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const replyData = {
        boardNo: inquiry.boardNo,
        commentContent: replyContent.trim(),
        memberNo: 46, // TODO: 실제 관리자 memberNo로 변경
      };

      const response = await axiosApi.post(
        `/api/customer/boards/${inquiry.boardNo}/comments`,
        replyData
      );

      if (response.status === 200) {
        // 문의 상태를 "답변완료"로 업데이트
        try {
          await axiosApi.patch(
            `/api/customer/boards/${inquiry.boardNo}/status`,
            null,
            {
              params: { status: "답변완료" },
            }
          );
        } catch (statusError) {
          console.error("문의 상태 업데이트 실패:", statusError);
        }

        alert("답변이 성공적으로 등록되었습니다.");
        navigate("/admin/customer");
      }
    } catch (error) {
      console.error("답변 등록 실패:", error);

      if (error.response) {
        const errorMessage = error.response.data || "답변 등록에 실패했습니다.";
        setError(errorMessage);
      } else if (error.request) {
        setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError("답변 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm(
      "작성 중인 답변이 저장되지 않습니다. 정말 취소하시겠습니까?"
    );
    if (confirmCancel) {
      navigate("/admin/customer");
    }
  };

  if (!inquiry) {
    return (
      <div className="admin-management-container">
        <div className="management-content">
          <AdminSidebar />
          <main className="admin-main">
            <div className="admin-header">
              <h1 className="admin-title">답변 작성</h1>
            </div>
            <div style={{ textAlign: "center", padding: "50px" }}>
              문의 정보를 불러오는 중...
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-management-container">
      <div className="management-content">
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">답변 작성</h1>
          </div>

          <div className="inquiry-section">
            {/* 문의 내용 표시 */}
            <h2 className="section-title">문의 내용</h2>
            <div className="inquiry-item">
              <div className="inquiry-header">
                <span className="inquiry-id">#{inquiry?.boardNo || "N/A"}</span>
                <span className="inquiry-title">
                  {inquiry?.boardTitle || "제목 없음"}
                </span>
                <div className="inquiry-badges">
                  <span
                    className={`status-badge ${
                      (inquiry?.inquiryStatus || "대기중") === "답변완료"
                        ? "completed"
                        : "waiting"
                    }`}
                  >
                    {inquiry?.inquiryStatus || "대기중"}
                  </span>
                </div>
              </div>
              <div className="inquiry-meta">
                <span className="inquiry-author">
                  작성자: {inquiry?.memberNickname || "알 수 없음"}
                </span>
                <span className="inquiry-date">
                  {inquiry?.boardCreateDate
                    ? new Date(inquiry.boardCreateDate).toLocaleString("ko-KR")
                    : "날짜 없음"}
                </span>
              </div>
              <div className="inquiry-content">
                <div
                  className="inquiry-text"
                  dangerouslySetInnerHTML={{
                    __html: (inquiry?.boardContent || "").replace(
                      /\n/g,
                      "<br>"
                    ),
                  }}
                />
              </div>
            </div>
          </div>

          {/* 답변 작성 폼 */}
          <div className="inquiry-section">
            <h2 className="section-title">답변 작성</h2>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <Editor
                ref={editorRef}
                height="300px"
                initialEditType="wysiwyg"
                placeholder="답변 내용을 입력하세요"
                previewStyle="vertical"
                disabled={isSubmitting}
              />

              <div className="inquiry-actions">
                <button
                  type="button"
                  className="admin-action-btn admin-view-btn"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="admin-action-btn admin-reply-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "등록 중..." : "답변 등록"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminCustomerReply;
