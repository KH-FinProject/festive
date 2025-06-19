import React, { useRef, useState } from "react";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import Title from "./Title";
import "./WritePage.css";

function WritePage({ onCancel, onSubmit }) {
  const editorRef = useRef();
  const [title, setTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = editorRef.current.getInstance().getMarkdown();
    if (onSubmit) {
      onSubmit({ title, content });
    } else {
      console.log({ title, content });
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
            placeholder="제목 작성"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Editor
            ref={editorRef}
            height="400px"
            initialEditType="wysiwyg"
            placeholder="내용을 입력하세요"
            previewStyle="vertical"
          />
          <div className="wagle-write-btns">
            <button
              type="button"
              className="wagle-write-cancel"
              onClick={onCancel}
            >
              취소
            </button>
            <button type="submit" className="wagle-write-submit">
              글작성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WritePage;
