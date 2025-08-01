import { Link, NavLink, useLocation } from "react-router-dom";
import "./AdminCommon.css";
import { useAdminNotifications } from "./AdminNotificationContext.jsx";

const AdminSidebar = () => {
  const { hasNewReport, hasNewBooth, hasNewInquiry } = useAdminNotifications();
  const location = useLocation();

  // 신청 현황 active 처리
  const isApplicationsActive =
    location.pathname === "/admin/applications" ||
    location.pathname === "/admin/appDetail";

  // 고객센터 관리 active 처리
  const isCustomerActive =
    location.pathname.startsWith("/admin/customer") ||
    location.pathname.startsWith("/admin/reply");

  const handleNavClick = () => {
    window.scrollTo(0, 0);
  };

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
              onClick={handleNavClick}
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
              onClick={handleNavClick}
            >
              <span>관리자 계정생성</span>
            </NavLink>
            <NavLink
              to="/admin/allMembers"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : "inactive"}`
              }
              onClick={handleNavClick}
            >
              <span>전체 회원 관리</span>
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : "inactive"}`
              }
              onClick={handleNavClick}
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
              onClick={handleNavClick}
            >
              <span>게시물 관리</span>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">고객 관리</h3>
            <NavLink
              to="/admin/customer"
              className={
                isCustomerActive
                  ? "sidebar-item active"
                  : "sidebar-item inactive"
              }
              onClick={handleNavClick}
            >
              <span>고객센터 관리</span>
              {(hasNewReport || hasNewInquiry) && (
                <span
                  style={{
                    background: "#ff4757",
                    color: "white",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    padding: "2px 7px",
                    marginLeft: "8px",
                    verticalAlign: "middle",
                    animation: "popIn 0.3s",
                  }}
                >
                  new!
                </span>
              )}
            </NavLink>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">푸드트럭 및 플리마켓 신청 현황</h3>
            <NavLink
              to="/admin/applications"
              className={
                isApplicationsActive
                  ? "sidebar-item active"
                  : "sidebar-item inactive"
              }
              onClick={handleNavClick}
            >
              <span>신청 현황</span>
              {hasNewBooth && (
                <span
                  style={{
                    background: "#ff4757",
                    color: "white",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    padding: "2px 7px",
                    marginLeft: "8px",
                    verticalAlign: "middle",
                    animation: "popIn 0.3s",
                  }}
                >
                  new!
                </span>
              )}
            </NavLink>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminSidebar;
