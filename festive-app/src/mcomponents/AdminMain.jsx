import "./AdminMain.css";
import "./AdminCommon.css";
import AdminSidebar from "./AdminSideBar";

const AdminMain = () => {
  return (
    <div className="admin-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar />
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

            {/* 신고 알림 안내 */}
            <div className="reports-section">
              <h2>실시간 신고 알림</h2>
              <div className="reports-info">
                <p>
                  새로운 신고가 접수되면 실시간으로 알림을 받을 수 있습니다.
                </p>
                <p>
                  신고 처리는 <strong>고객센터 관리</strong> 페이지에서 할 수
                  있습니다.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminMain;
