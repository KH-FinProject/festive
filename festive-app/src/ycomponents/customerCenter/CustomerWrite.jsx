import React, { useRef, useState } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import Title from "./Title";
import "./CustomerWrite.css";
import { useNavigate } from "react-router-dom";

function CustomerWrite({ onSubmit }) {
  const navigate = useNavigate();
  const editorRef = useRef();
  const [title, setTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = editorRef.current.getInstance().getMarkdown();
    if (onSubmit) {
      onSubmit({ title, content });
    } else {
      console.log({ title, content });
      // 여기서 실제 API 호출하여 고객센터 글 저장
      alert("문의가 등록되었습니다.");
      navigate("/customer-center");
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
          <input
            className="customer-write-input-title"
            type="text"
            placeholder="문의 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Editor
            ref={editorRef}
            height="400px"
            initialEditType="wysiwyg"
            placeholder="문의 내용을 입력하세요"
            previewStyle="vertical"
          />
          <div className="customer-write-btns">
            <button
              type="button"
              className="customer-write-cancel"
              onClick={handleCancel}
            >
              취소
            </button>
            <button type="submit" className="customer-write-submit">
              문의등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerWrite;
