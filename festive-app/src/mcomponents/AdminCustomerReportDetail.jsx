import React, { useState } from "react";
import "./AdminCustomerService.css";
import "./AdminCommon.css";

const AdminCustomerReportDetail = () => {
  return (
    <main className="admin-main">
      <div className="admin-header">
        <h1 className="admin-title">고객센터 관리</h1>
      </div>

      <div className="reply-header">
        <h2 className="reply-title">신고내역</h2>
      </div>

      <div className="board-content">
        <div className="board-actions">내용출력해주기</div>
      </div>
      <div className="report-actions">
        <button className="report-action-btn report-reply-btn">
          해당 회원 제제
        </button>
        <button className="report-action-btn report-reply-btn">
          신고 취소
        </button>
      </div>
    </main>
  );
};

export default AdminCustomerReportDetail;
