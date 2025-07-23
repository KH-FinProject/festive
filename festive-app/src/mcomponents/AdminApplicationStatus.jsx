import React, { useState, useEffect } from "react";
import "./AdminApplicationStatus.css";
import "./AdminCommon.css";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSideBar";
import axiosApi from "../api/axiosAPI";
import { useAdminNotifications } from "./AdminNotificationContext.jsx";

const AdminApplicationStatus = () => {
  const [applications, setApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { setHasNewBooth } = useAdminNotifications();

  useEffect(() => {
    async function fetchApplications() {
      try {
        const response = await axiosApi.get("/api/booth/requests");
        setApplications(response.data);
      } catch {
        alert("신청 목록을 불러오지 못했습니다.");
      }
    }
    fetchApplications();
  }, []);

  useEffect(() => {
    setHasNewBooth(false);
  }, []);

  // 페이지네이션 계산
  const totalPages = Math.ceil(applications.length / itemsPerPage);
  const pagedApplications = applications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
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
  const handleGotoDetail = (boothNo) => {
    navigate("/admin/appDetail", { state: { boothNo } });
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
            <table className="application-table">
              <thead>
                <tr>
                  <th>신청자명</th>
                  <th>신청유형</th>
                  <th>신청 축제</th>
                  <th>상태</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pagedApplications.map((application) => (
                  <tr key={application.boothNo}>
                    <td>{application.applicantName || application.name}</td>
                    <td>
                      {application.boothType === 1
                        ? "플리마켓"
                        : application.boothType === 2
                        ? "푸드트럭"
                        : "-"}
                    </td>
                    <td>{application.contentTitle}</td>
                    <td>
                      {application.boothAccept === "Y" ? "수락완료" : "대기"}
                    </td>
                    <td>
                      <button
                        className="btn-detail"
                        onClick={() => handleGotoDetail(application.boothNo)}
                      >
                        내용보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <button
                className="pagination-btn nav-btn"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              >
                ‹
              </button>
              {renderPagination()}
              <button
                className="pagination-btn nav-btn"
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
              >
                ›
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminApplicationStatus;
