import React, { useState } from "react";
import "./AdminApplicationStatus.css";
import "./AdminCommon.css";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSideBar";

const AdminApplicationStatus = () => {
  const [applications, setApplications] = useState([
    {
      id: 1,
      category: "플리마켓",
      title: "제가 축제 매 업면 못 빠짐!!",
      applicant: "신짱구",
      date: "2505.06.12 16:45",
      status: "pending",
    },
    {
      id: 2,
      category: "푸드트럭",
      title: "홍천 집우수수 축제 / 옥수수",
      applicant: "신짱구",
      date: "2505.06.12 16:45",
      status: "pending",
    },
    {
      id: 3,
      category: "플리마켓",
      title: "홍천 집우수수 축제 / 반팔 업새스리",
      applicant: "신짱구",
      date: "2505.06.12 16:45",
      status: "pending",
    },
    {
      id: 4,
      category: "푸드트럭",
      title: "태백 해바라기축제 / 신제모 몇녀이",
      applicant: "신짱구",
      date: "2505.06.12 16:45",
      status: "pending",
    },
    {
      id: 5,
      category: "푸드트럭",
      title: "태백 해바라기축제 / 절제 턱요아끼",
      applicant: "신짱구",
      date: "2505.06.12 16:45",
      status: "pending",
    },
  ]);

  const [currentPage, setCurrentPage] = useState(1);

  const handleApprove = (id) => {
    setApplications(
      applications.map((app) =>
        app.id === id ? { ...app, status: "approved" } : app
      )
    );
  };

  const handleReject = (id) => {
    setApplications(
      applications.map((app) =>
        app.id === id ? { ...app, status: "rejected" } : app
      )
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= 10; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  // 상세보기 페이지로 이동
  const navigate = useNavigate();
  const handleGotoDetail = (id) => {
    navigate("/admin/appDetail");
  };

  return (
    <div className="admin-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">신청 현황</h1>
          </div>

          <div className="status-content">
            <div className="application-list">
              {applications.map((application) => (
                <div key={application.id} className="application-item">
                  <div className="application-info">
                    <div className="category-badge">
                      <span className="category">{application.category}</span>
                    </div>
                    <h3 className="application-title">{application.title}</h3>
                    <div className="application-meta">
                      <span className="applicant">{application.applicant}</span>
                      <span className="date">{application.date}</span>
                    </div>
                  </div>

                  <div className="application-actions">
                    <button
                      className="btn-detail"
                      onClick={() => handleGotoDetail(application.id)}
                    >
                      내용보기
                    </button>
                    <button
                      className={`btn-approve ${
                        application.status === "approved" ? "approved" : ""
                      }`}
                      onClick={() => handleApprove(application.id)}
                      disabled={application.status === "approved"}
                    >
                      {application.status === "approved"
                        ? "취소됨"
                        : "신청 취소"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination">
              <button className="pagination-btn nav-btn">‹</button>
              {renderPagination()}
              <button className="pagination-btn nav-btn">›</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminApplicationStatus;
