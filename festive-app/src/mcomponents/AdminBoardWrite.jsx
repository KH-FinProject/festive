import React, { useState } from "react";
import "./AdminBoardManagement.css";
import "./AdminCommon.css";
import AdminSidebar from "./AdminSideBar";

const AdminBoardWrite = () => {
  return (
    <div className="admin-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">게시판 관리</h1>
          </div>

          <div className="admin-notice-header">
            <h2 className="admin-notice-title">공지글 작성</h2>
          </div>
          <div className="form-group">
            <input
              type="notice-title"
              id="notice-title"
              className="notice-title"
              placeholder="제목을 입력하세요"
              required
            />
          </div>
          <div className="board-content">
            <div className="board-actions">
              여기에 에디터를 야무지게!! 넣어주세용!!!
            </div>
          </div>
          <div className="action-buttons">
            <button className="btn-notice-write">공지 등록</button>
            <button className="btn-secondary">취소하기</button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminBoardWrite;
