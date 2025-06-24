import React, { useState, useEffect } from "react";
import "./AdminCustomerService.css";
import "./AdminCommon.css";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSideBar";
import Pagination, { usePagination } from "./Pagination"; // 새로운 페이지네이션 컴포넌트 import

const AdminCustomerService = () => {
  const [inquiries] = useState([
    {
      id: 1203,
      category: "문의내역",
      title: "해줘~",
      author: "이나버니",
      date: "2505.06.12 16:45",
      replied: false,
    },
    {
      id: 1205,
      category: "문의내역",
      title: "지호가 잠을 안 자요 ㅠㅠ",
      author: "톡스터M",
      date: "2505.06.12 16:45",
      replied: false,
    },
    // 더 많은 데이터를 위한 더미 데이터 추가
    {
      id: 1206,
      category: "문의내역",
      title: "앱이 자꾸 꺼져요",
      author: "사용자1",
      date: "2505.06.11 14:30",
      replied: true,
    },
    {
      id: 1207,
      category: "문의내역",
      title: "결제가 안되네요",
      author: "사용자2",
      date: "2505.06.11 10:15",
      replied: false,
    },
    {
      id: 1208,
      category: "문의내역",
      title: "비밀번호 변경 문의",
      author: "사용자3",
      date: "2505.06.10 18:20",
      replied: true,
    },
  ]);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

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

  // 신고 목록 조회
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/reports");
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        console.error("신고 목록 조회 실패");
      }
    } catch (error) {
      console.error("신고 목록 조회 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (id) => {
    console.log("답변하기:", id);
    navigate("/admin/reply");
  };

  const handleReportDetail = (reportNo) => {
    console.log("내용보기:", reportNo);
    navigate(`/admin/report-detail/${reportNo}`);
  };

  // 현재 페이지에 표시할 문의내역 가져오기
  const currentInquiries = inquiryPagination.currentItems(inquiries);

  // 현재 페이지에 표시할 신고내역 가져오기
  const currentReports = reportPagination.currentItems(reports);

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

              <div className="inquiry-list paginated-list">
                {currentInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="inquiry-item">
                    <div className="inquiry-header">
                      <span className="inquiry-id">#{inquiry.id}</span>
                      <span className="inquiry-title">{inquiry.title}</span>
                    </div>
                    <div className="inquiry-meta">
                      <span className="inquiry-author">{inquiry.author}</span>
                      <span className="inquiry-date">{inquiry.date}</span>
                    </div>
                    <div className="inquiry-actions">
                      <button className="admin-action-btn admin-view-btn">
                        삭제
                      </button>
                      <button
                        className="admin-action-btn admin-reply-btn"
                        onClick={() => handleReply(inquiry.id)}
                      >
                        답변하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 새로운 페이지네이션 컴포넌트 사용 */}
              <Pagination
                currentPage={inquiryPagination.currentPage}
                totalPages={inquiryPagination.totalPages}
                onPageChange={inquiryPagination.goToPage}
                className="custom-pagination"
                showFirstLast={true}
                maxVisiblePages={5}
              />
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
                          <div className="report-header">
                            <span className="report-id">
                              #{report.reportNo}
                            </span>
                            <span className="report-title">
                              {report.reportType === 0 ? "게시글" : "댓글"} 신고
                              - {report.reportReason}
                            </span>
                          </div>
                          <div className="report-meta">
                            <span className="report-author">
                              신고자: {report.reporterNo}
                            </span>
                            <span className="report-date">
                              {report.reportTime}
                            </span>
                          </div>
                          <div className="report-actions">
                            <button
                              className="admin-action-btn admin-view-btn"
                              onClick={() =>
                                handleReportDetail(report.reportNo)
                              }
                            >
                              내용보기
                            </button>
                            {report.reportStatus === 0 && (
                              <span
                                style={{ color: "#ff9800", fontSize: "14px" }}
                              >
                                대기
                              </span>
                            )}
                            {report.reportStatus === 1 && (
                              <span
                                style={{ color: "#28a745", fontSize: "14px" }}
                              >
                                처리완료
                              </span>
                            )}
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
                        신고 내역이 없습니다.
                      </div>
                    )}
                  </div>

                  {/* 새로운 페이지네이션 컴포넌트 사용 */}
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
