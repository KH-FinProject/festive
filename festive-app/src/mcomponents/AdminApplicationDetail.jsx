import React, { useState } from "react";
import "./AdminApplicationStatus.css";
import "./AdminCommon.css";
import AdminSidebar from "./AdminSideBar";

const AdminApplicationDetail = () => {
  return (
    <div className="admin-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">신청 현황</h1>
          </div>

          <div className="application-actions">
            <button className="app-action-btn app-detail-btn">수락</button>
            <button className="app-action-btn app-detail-btn">신청 취소</button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminApplicationDetail;
