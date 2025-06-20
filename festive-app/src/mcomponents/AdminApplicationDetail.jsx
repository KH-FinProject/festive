import React, { useState } from "react";
import "./AdminApplicationStatus.css";

const AdminApplicationDetail = () => {
  return (
    <main className="admin-main">
      <div className="admin-header">
        <h1 className="admin-title">신청 현황</h1>
      </div>

      <div className="application-actions">
        <button className="app-action-btn app-detail-btn">수락</button>
        <button className="app-action-btn app-detail-btn">신청 취소</button>
      </div>
    </main>
  );
};

export default AdminApplicationDetail;
