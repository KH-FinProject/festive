import React, { useState } from "react";
import "./AdminMain.css";
import "./AdminCommon.css";

const AdminMain = () => {
  return (
    <div className="content">
      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-header">
          <h1 className="admin-title">관리자 대시보드</h1>
        </div>

        <div className="main-section">
          <div className="main-item">
            <div className="item">
              <span>신규회원추이</span>
            </div>
            <div className="item">
              <span>이용자 수 추이</span>
            </div>
            <div className="item">
              <span>탈퇴 회원 추이</span>
            </div>
          </div>
          <div className="chart">차트 들어가는 부분</div>
        </div>
      </main>
    </div>
  );
};

export default AdminMain;
