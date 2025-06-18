import React from "react";

const AdminSidebar = ({ activeItem = "회원 탈퇴 및 삭제" }) => {
  return (
    <aside className="management-sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">관리자 메인</h3>
        <div
          className={`sidebar-item ${
            activeItem === "메인 대시보드" ? "active" : "inactive"
          }`}
        >
          <span>메인 대시보드</span>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">사용자 관리</h3>
        <div
          className={`sidebar-item ${
            activeItem === "관리자 계정생성" ? "active" : "inactive"
          }`}
        >
          <span>관리자 계정생성</span>
        </div>
        <div
          className={`sidebar-item ${
            activeItem === "회원 탈퇴 및 삭제" ? "active" : "inactive"
          }`}
        >
          <span>회원 탈퇴 및 삭제</span>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">콘텐츠 관리</h3>
        <div
          className={`sidebar-item ${
            activeItem === "게시물 관리" ? "active" : "inactive"
          }`}
        >
          <span>게시물 관리</span>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">고객 관리</h3>
        <div
          className={`sidebar-item ${
            activeItem === "고객센터 관리" ? "active" : "inactive"
          }`}
        >
          <span>고객센터 관리</span>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">푸드트럭 및 플리마켓 신청 현황</h3>
        <div
          className={`sidebar-item ${
            activeItem === "신청 현황" ? "active" : "inactive"
          }`}
        >
          <span>신청 현황</span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
