import React, { useState, useEffect } from "react";
import "./AdminCustomerService.css";
import "./AdminCommon.css";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSideBar";
import Pagination, { usePagination } from "./Pagination";
import { useAdminNotifications } from "./AdminNotificationContext.jsx";
import axiosApi from "../api/axiosAPI";

const AdminCustomerService = () => {
  const [inquiries, setInquiries] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inquiryLoading, setInquiryLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { setHasNewReport, setHasNewInquiry } = useAdminNotifications();

  // 문의내역 페이지네이션 설정
  const inquiryPagination = usePagination({
    totalItems: inquiries.length,
    pageSize: 3, // 페이지당 3개씩 표시
    initialPage: 1,
  });

  // 신고내역 페이지네이션 설정
  const reportPagination = usePagination({
    totalItems: reports.length,
    pageSize: 3, // 페이지당 3개씩 표시
    initialPage: 1,
  });

  // 고객센터 문의내역 조회
  const fetchInquiries = async () => {
    try {
      setInquiryLoading(true);
      setError(null);

      const response = await axiosApi.get(
        "/api/customer/boards",
        {
          params: {
            page: 1,
            size: 100, // 충분한 데이터를 가져오기 위해 큰 값 설정
          },
        }
      );

      if (response.status === 200) {
        const data = response.data;

        // 백엔드에서 inquiryList로 데이터를 보내고 있음
        if (data.inquiryList && Array.isArray(data.inquiryList)) {
          setInquiries(data.inquiryList);
        } else if (data.content && Array.isArray(data.content)) {
          setInquiries(data.content);
        } else if (Array.isArray(data)) {
          setInquiries(data);
        } else {
          setInquiries([]);
        }
      }
    } catch (error) {
      console.error("문의내역 조회 실패:", error);
      setError("문의내역을 불러오는데 실패했습니다.");
      setInquiries([]);
    } finally {
      setInquiryLoading(false);
    }
  };

  // 신고 목록 조회
  const fetchReports = async () => {
    try {
      setLoading(true);

      const response = await axiosApi.get("/api/reports");

      if (response.status === 200) {
        const data = response.data;
        if (Array.isArray(data)) {
          setReports(data);
        } else {
          setReports([]);
        }
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error("신고 목록 조회 중 오류:", error);

      // 500 에러인 경우 서버 문제로 간주하고 빈 배열로 설정
      if (error.response && error.response.status === 500) {
        setReports([]);
      } else {
        setReports([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    fetchReports();
    setHasNewReport(false);
    setHasNewInquiry(false);
  }, []);

  const handleReply = (inquiry) => {
    navigate("/admin/reply", { state: { inquiry } });
  };

  const handleDeleteInquiry = async (inquiry) => {
    const confirmDelete = window.confirm(
      `문의글 "${inquiry.boardTitle}"을(를) 삭제하시겠습니까?`
    );

    if (confirmDelete) {
      try {
              const response = await axiosApi.delete(
        `/api/customer/boards/${inquiry.boardNo}`
      );
        if (response.status === 200) {
          alert("문의글이 삭제되었습니다.");
          fetchInquiries(); // 목록 새로고침
        }
      } catch (error) {
        console.error("문의글 삭제 실패:", error);
        alert("문의글 삭제에 실패했습니다.");
      }
    }
  };

  const handleReportDetail = (reportNo) => {
    navigate(`/admin/report-detail/${reportNo}`);
  };

  // 현재 페이지에 표시할 문의내역 가져오기
  const currentInquiries = inquiryPagination.currentItems(inquiries);

  // 현재 페이지에 표시할 신고내역 가져오기
  const currentReports = reportPagination.currentItems(reports);

  // 문의 상태에 따른 배지 스타일
  const getStatusBadge = (status) => {
    switch (status) {
      case "대기중":
        return <span className="status-badge waiting">대기중</span>;
      case "답변완료":
        return <span className="status-badge completed">답변완료</span>;
      case "처리중":
        return <span className="status-badge processing">처리중</span>;
      default:
        return <span className="status-badge waiting">대기중</span>;
    }
  };

  return (
    <div className="admin-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">고객센터 관리</h1>
          </div>

          <div className="customer-service-container">
            {/* 문의내역 섹션 */}
            <section className="inquiry-section">
              <h2 className="section-title">문의내역</h2>

              {inquiryLoading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  문의내역을 불러오는 중...
                </div>
              ) : error ? (
                <div
                  style={{ textAlign: "center", padding: "20px", color: "red" }}
                >
                  {error}
                </div>
              ) : (
                <>
                  <div className="inquiry-list paginated-list">
                    {currentInquiries.length > 0 ? (
                      currentInquiries.map((inquiry) => (
                        <div key={inquiry.boardNo} className="inquiry-item">
                          <div className="inquiry-header">
                            <span className="inquiry-id">
                              #{inquiry.boardNo}
                            </span>
                            <span className="inquiry-title">
                              {inquiry.boardTitle}
                            </span>
                            <div className="inquiry-badges">
                              {getStatusBadge(inquiry.inquiryStatus)}
                            </div>
                          </div>
                          <div className="inquiry-meta">
                            <span className="inquiry-category">
                              [{inquiry.category}]
                            </span>
                            <span className="inquiry-author">
                              {inquiry.memberNickname}
                            </span>
                            <span className="inquiry-date">
                              {new Date(inquiry.boardCreateDate).toLocaleString(
                                "ko-KR"
                              )}
                            </span>
                          </div>
                          <div className="inquiry-actions">
                            <button
                              className="admin-action-btn admin-delete-btn"
                              onClick={() => handleDeleteInquiry(inquiry)}
                            >
                              삭제
                            </button>
                            <button
                              className="admin-action-btn admin-reply-btn"
                              onClick={() => handleReply(inquiry)}
                            >
                              {inquiry.inquiryStatus === "답변완료"
                                ? "답변 수정하기"
                                : "답변하기"}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "#666",
                        }}
                      >
                        등록된 문의가 없습니다.
                      </div>
                    )}
                  </div>

                  {/* 페이지네이션 */}
                  {inquiries.length > 0 && (
                    <Pagination
                      currentPage={inquiryPagination.currentPage}
                      totalPages={inquiryPagination.totalPages}
                      onPageChange={inquiryPagination.goToPage}
                      className="custom-pagination"
                      showFirstLast={true}
                      maxVisiblePages={5}
                    />
                  )}
                </>
              )}
            </section>

            {/* 신고내역 섹션 */}
            <section className="report-section">
              <h2 className="section-title">신고내역</h2>

              {loading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  로딩 중...
                </div>
              ) : (
                <>
                  <div className="report-list paginated-list">
                    {currentReports.length > 0 ? (
                      currentReports.map((report) => (
                        <div key={report.reportNo} className="report-item">
                          <div className="inquiry-header">
                            <span className="inquiry-id">
                              #{report.reportNo}
                            </span>
                            <span className="inquiry-title">
                              {report.reportType === 0 ? "게시글" : "댓글"} 신고
                              - {report.reportReason}
                            </span>
                            <span
                              className={`status-badge ${
                                report.reportStatus === 1
                                  ? "completed"
                                  : "waiting"
                              }`}
                              style={{ marginLeft: "8px" }}
                            >
                              {report.reportStatus === 1 ? "처리완료" : "대기"}
                            </span>
                          </div>
                          <div className="inquiry-meta">
                            <span className="inquiry-author">
                              신고자: {report.reporterNo}
                            </span>
                            <span className="inquiry-date">
                              {report.reportTime}
                            </span>
                          </div>
                          <div className="inquiry-actions">
                            <button
                              className="admin-action-btn admin-view-btn"
                              onClick={() =>
                                handleReportDetail(report.reportNo)
                              }
                            >
                              내용보기
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "#666",
                        }}
                      >
                        등록된 신고가 없습니다.
                      </div>
                    )}
                  </div>

                  {/* 페이지네이션 */}
                  {reports.length > 0 && (
                    <Pagination
                      currentPage={reportPagination.currentPage}
                      totalPages={reportPagination.totalPages}
                      onPageChange={reportPagination.goToPage}
                      className="custom-pagination"
                      showFirstLast={true}
                      maxVisiblePages={5}
                    />
                  )}
                </>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminCustomerService;
