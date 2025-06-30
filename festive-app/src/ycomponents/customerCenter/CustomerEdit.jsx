import React, { useRef, useState, useEffect } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import Title from "./Title";
import "./CustomerWrite.css";
import { useNavigate, useParams } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import axiosApi from "../../api/axiosAPI";

function CustomerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { member } = useAuthStore();

  // 기존 게시글 데이터 불러오기
  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        const response = await axiosApi.get(
          `http://localhost:8080/api/customer/boards/${id}`
        );
        const data = response.data;

        // 작성자 확인
        if (data.memberNo !== member?.memberNo) {
          alert("본인이 작성한 문의글만 수정할 수 있습니다.");
          navigate("/customer-center");
          return;
        }

        setTitle(data.boardTitle);
        setContent(data.boardContent);
      } catch (error) {
        console.error("게시글 데이터 불러오기 실패:", error);
        alert("게시글을 불러올 수 없습니다.");
        navigate("/customer-center");
      } finally {
        setIsLoading(false);
      }
    };

    if (member && id) {
      fetchBoardData();
    }
  }, [id, member, navigate]);

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
    const editorContent = editorRef.current.getInstance().getMarkdown();
    if (!editorContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const boardData = {
        boardTitle: title.trim(),
        boardContent: editorContent.trim(),
      };

      const response = await axiosApi.put(
        `http://localhost:8080/api/customer/boards/${id}`,
        boardData
      );

      if (response.status === 200) {
        alert("문의글이 성공적으로 수정되었습니다.");
        navigate(`/customer-center/${id}`);
      } else {
        alert("문의글 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("문의글 수정 실패:", error);
      alert("문의글 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm(
      "수정 중인 내용이 저장되지 않습니다. 정말 취소하시겠습니까?"
    );
    if (confirmCancel) {
      navigate(`/customer-center/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="customer-write-outer">
        <Title currentPage="문의글 수정" />
        <div className="customer-write-form-container">
          <div style={{ textAlign: "center", padding: "2rem" }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-write-outer">
      <div className="customer-write-title-wrapper">
        <Title currentPage="문의글 수정" />
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
            initialEditType="wysiwyg"
            placeholder="문의 내용을 입력하세요"
            previewStyle="vertical"
            disabled={isSubmitting}
            initialValue={content}
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
              {isSubmitting ? "수정 중..." : "수정완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerEdit;
