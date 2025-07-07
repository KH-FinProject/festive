import React, { useRef, useState, useEffect } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import Title from "./Title";
import "./WritePage.css";
import { useNavigate, useParams } from "react-router-dom";
import axiosApi from "../../api/axiosAPI";
import useAuthStore from "../../store/useAuthStore";

function EditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
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
        const response = await axiosApi.get(`/api/wagle/boards/${id}`);
        const boardData = response.data;

        // 작성자 확인
        if (boardData.memberNo !== member?.memberNo) {
          alert("본인이 작성한 게시글만 수정할 수 있습니다.");
          navigate("/wagle");
          return;
        }

        setTitle(boardData.boardTitle);
        setContent(boardData.boardContent);
      } catch (error) {
        console.error("게시글 데이터 불러오기 실패:", error);
        alert("게시글을 불러올 수 없습니다.");
        navigate("/wagle");
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

      const response = await axiosApi.put(`/api/wagle/boards/${id}`, boardData);

      if (response.status === 200) {
        alert("게시글이 성공적으로 수정되었습니다.");
        navigate(`/wagle/${id}`);
      }
    } catch (error) {
      console.error("게시글 수정 실패:", error);

      if (error.response) {
        const errorMessage =
          error.response.data || "게시글 수정에 실패했습니다.";
        alert(errorMessage);
      } else if (error.request) {
        alert("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      } else {
        alert("게시글 수정 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm(
      "수정 중인 내용이 저장되지 않습니다. 정말 취소하시겠습니까?"
    );
    if (confirmCancel) {
      navigate(`/wagle/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="wagle-write-outer">
        <Title currentPage="게시글 수정" />
        <div className="wagle-write-form-container">
          <div style={{ textAlign: "center", padding: "2rem" }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wagle-write-outer">
      <Title currentPage="게시글 수정" />
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
            initialValue={content}
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
              {isSubmitting ? "수정 중..." : "수정완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPage;
