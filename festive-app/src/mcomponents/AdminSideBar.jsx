import React from "react";
import { Link, useLocation } from "react-router-dom";

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="management-sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">관리자 메인</h3>
        <Link
          to="/admin"
          className={`sidebar-item ${
            location.pathname === "/admin" ? "active" : "inactive"
          }`}
        >
          <span>메인 대시보드</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">사용자 관리</h3>
        <Link
          to="/admin/create"
          className={`sidebar-item ${
            location.pathname === "/admin/create" ? "active" : "inactive"
          }`}
        >
          <span>관리자 계정생성</span>
        </Link>
        <Link
          to="/admin/users"
          className={`sidebar-item ${
            location.pathname === "/admin/users" ? "active" : "inactive"
          }`}
        >
          <span>회원 탈퇴 및 삭제</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">콘텐츠 관리</h3>
        <Link
          to="/admin/board"
          className={`sidebar-item ${
            location.pathname === "/admin/board" ? "active" : "inactive"
          }`}
        >
          <span>게시물 관리</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">고객 관리</h3>
        <Link
          to="/admin/customer"
          className={`sidebar-item ${
            location.pathname === "/admin/customer" ? "active" : "inactive"
          }`}
        >
          <span>고객센터 관리</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">푸드트럭 및 플리마켓 신청 현황</h3>
        <Link
          to="/admin/applications"
          className={`sidebar-item ${
            location.pathname === "/admin/applications" ? "active" : "inactive"
          }`}
        >
          <span>신청 현황</span>
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
