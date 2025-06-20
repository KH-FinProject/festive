import React, { useState } from "react";
import "./AdminCustomerService.css";

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
  ]);

  const [applications] = useState([
    {
      id: 1205,
      category: "신고내역",
      title: "영민박사 괴롭혀요 ㅠㅠ",
      author: "신혜령",
      date: "2505.06.12 16:45",
    },
    {
      id: 1205,
      category: "신고내역",
      title: "제 카드를 누가 사용했는데요?",
      author: "성현승",
      date: "2505.06.12 16:45",
    },
  ]);

  const [currentInquiryPage, setCurrentInquiryPage] = useState(1);
  const [currentApplicationPage, setCurrentApplicationPage] = useState(1);

  const handleReply = (id) => {
    console.log("답변하기:", id);
  };

  const handleProcess = (id) => {
    console.log("신고 처리:", id);
  };

  const renderPagination = (currentPage, setCurrentPage) => {
    const pages = Array.from({ length: 10 }, (_, i) => i + 1);

    return (
      <div className="pagination">
        <button className="pagination-btn">{"<"}</button>
        {pages.map((page) => (
          <button
            key={page}
            className={`pagination-btn ${currentPage === page ? "active" : ""}`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
        <button className="pagination-btn">{">"}</button>
      </div>
    );
  };

  return (
    <main className="management-main">
      <div className="page-header">
        <h1 className="page-title">고객센터 관리</h1>
      </div>
      <div className="cs-content-wrapper">
        {/* 문의내역 섹션 */}
        <section className="inquiry-section">
          <h2 className="section-title">문의내역</h2>

          <div className="inquiry-list">
            {inquiries.map((inquiry) => (
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
                  <button className="action-btn view-btn">상세</button>
                  <button
                    className="action-btn reply-btn"
                    onClick={() => handleReply(inquiry.id)}
                  >
                    답변하기
                  </button>
                </div>
              </div>
            ))}
          </div>

          {renderPagination(currentInquiryPage, setCurrentInquiryPage)}
        </section>

        {/* 신고내역 섹션 */}
        <section className="report-section">
          <h2 className="section-title">신고내역</h2>

          <div className="report-list">
            {applications.map((application, index) => (
              <div key={`${application.id}-${index}`} className="report-item">
                <div className="report-header">
                  <span className="report-id">#{application.id}</span>
                  <span className="report-title">{application.title}</span>
                </div>
                <div className="report-meta">
                  <span className="report-author">{application.author}</span>
                  <span className="report-date">{application.date}</span>
                </div>
                <div className="report-actions">
                  <button className="action-btn view-btn">내용보기</button>
                  <button
                    className="action-btn process-btn"
                    onClick={() => handleProcess(application.id)}
                  >
                    신고 처리
                  </button>
                </div>
              </div>
            ))}
          </div>

          {renderPagination(currentApplicationPage, setCurrentApplicationPage)}
        </section>
      </div>
    </main>
  );
};

export default AdminCustomerService;
