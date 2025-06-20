import React, { useState } from "react";
import "./AdminBoardManagement.css";
import "./AdminCommon.css";
import AdminSidebar from "./AdminSideBar";

const AdminCustomerReply = () => {
  return (
    <div className="admin-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">고객센터 관리</h1>
          </div>

          <div className="reply-header">
            <h2 className="reply-title">문의 답변하기</h2>
          </div>

          <div className="board-content">
            <div className="board-actions">
              여기에 에디터를 야무지게!! 넣어주세용!!!
            </div>
          </div>
          <div className="action-buttons">
            <button className="btn-notice-write">답변하기</button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminCustomerReply;
