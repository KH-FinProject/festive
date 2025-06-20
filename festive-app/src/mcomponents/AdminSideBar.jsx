import { Link, NavLink, useLocation } from "react-router-dom";
import "./AdminCommon.css";

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <div className="admin-management-container">
      <div className="management-content">
        <aside className="management-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">관리자 메인</h3>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : "inactive"}`
              }
            >
              <span>메인 대시보드</span>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">사용자 관리</h3>
            <NavLink
              to="/admin/create"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : "inactive"}`
              }
            >
              <span>관리자 계정생성</span>
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : "inactive"}`
              }
            >
              <span>회원 탈퇴 및 삭제</span>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">콘텐츠 관리</h3>
            <NavLink
              to="/admin/board"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : "inactive"}`
              }
            >
              <span>게시물 관리</span>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">고객 관리</h3>
            <NavLink
              to="/admin/customer"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : "inactive"}`
              }
            >
              <span>고객센터 관리</span>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">푸드트럭 및 플리마켓 신청 현황</h3>
            <NavLink
              to="/admin/applications"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : "inactive"}`
              }
            >
              <span>신청 현황</span>
            </NavLink>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminSidebar;
