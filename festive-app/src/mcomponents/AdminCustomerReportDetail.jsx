import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminCustomerReportDetail.css";
import "./AdminCommon.css";
import AdminSidebar from "./AdminSideBar";

const AdminCustomerReportDetail = () => {
  const { reportNo } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line
  }, [reportNo]);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:8080/api/reports/${reportNo}/detail`
      );
      if (!response.ok) throw new Error("상세 조회 실패");
      const data = await response.json();
      setDetail(data);
    } catch {
      setError("상세 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말로 이 신고를 삭제(허위신고)하시겠습니까?")) return;
    try {
      const response = await fetch(
        `http://localhost:8080/api/reports/${reportNo}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        alert("신고가 삭제되었습니다.");
        navigate("/admin/customer");
      } else {
        alert("신고 삭제에 실패했습니다.");
      }
    } catch {
      alert("신고 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleSanction = async () => {
    if (!detail || !detail.memberNo) return;
    if (
      !window.confirm(
        "해당 회원의 제재 카운트를 1 증가시키고, 신고를 처리완료로 변경하시겠습니까?"
      )
    )
      return;
    try {
      // 1. 회원 제재 카운트 증가
      const sanctionRes = await fetch(
        `http://localhost:8080/api/reports/sanction/${detail.memberNo}`,
        { method: "POST" }
      );
      if (!sanctionRes.ok) {
        alert("회원 제재에 실패했습니다.");
        return;
      }
      // 2. 신고 처리완료로 상태 변경
      const processRes = await fetch(
        `http://localhost:8080/api/reports/${reportNo}/status?status=1`,
        { method: "PUT" }
      );
      if (!processRes.ok) {
        alert("회원 제재는 성공했으나, 신고 처리완료에는 실패했습니다.");
        return;
      }
      alert("회원 제재 및 신고 처리완료가 모두 적용되었습니다.");
      navigate("/admin/customer");
    } catch {
      alert("회원 제재/신고 처리 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="admin-main">로딩 중...</div>;
  if (error) return <div className="admin-main">{error}</div>;
  if (!detail) return <div className="admin-main">상세 정보 없음</div>;

  return (
    <div className="admin-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">고객센터 관리</h1>
          </div>

          <div className="reply-header">
            <h2 className="reply-title">신고 상세내역</h2>
          </div>

          {/* 신고 정보 섹션 */}
          <div className="report-info-section">
            <h3 className="section-title">신고 정보</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">신고번호:</span>
                <span className="info-value">{detail.reportNo}</span>
              </div>
              <div className="info-item">
                <span className="info-label">신고유형:</span>
                <span className="info-value">
                  {detail.reportType === 0 ? "게시글" : "댓글"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">신고사유:</span>
                <span className="info-value">{detail.reportReason}</span>
              </div>
              <div className="info-item">
                <span className="info-label">신고일시:</span>
                <span className="info-value">{detail.reportTime}</span>
              </div>
              <div className="info-item">
                <span className="info-label">신고상태:</span>
                <span className={`info-value status-${detail.reportStatus}`}>
                  {detail.reportStatus === 0 ? "대기" : "처리완료"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">신고대상 회원:</span>
                <span className="info-value">
                  {detail.memberNickname} (No.{detail.memberNo})
                </span>
              </div>
            </div>
          </div>

          {/* 신고 대상 콘텐츠 섹션 */}
          <div className="content-info-section">
            <h3 className="section-title">
              신고 대상 {detail.reportType === 0 ? "게시글" : "댓글"}
            </h3>
            <div className="content-card">
              {detail.reportType === 0 ? (
                // 게시글인 경우
                <div className="content-details">
                  <div className="content-header">
                    <div className="content-meta">
                      <span className="content-id">
                        게시글 번호: {detail.boardNo}
                      </span>
                    </div>
                    <h4 className="content-title">{detail.boardTitle}</h4>
                  </div>
                  <div className="content-body">
                    <div className="content-text">{detail.boardContent}</div>
                  </div>
                </div>
              ) : (
                // 댓글인 경우
                <div className="content-details">
                  <div className="content-header">
                    <div className="content-meta">
                      <span className="content-id">
                        댓글 번호: {detail.commentNo}
                      </span>
                      <span className="content-date">
                        작성일: {detail.commentWriteDate}
                      </span>
                    </div>
                  </div>
                  <div className="content-body">
                    <div className="comment-content">
                      <h5>댓글 내용:</h5>
                      <div className="content-text">
                        {detail.commentContent}
                      </div>
                    </div>
                  </div>
                  <div className="parent-post-info">
                    <h5>댓글이 달린 게시글:</h5>
                    <div className="parent-post-meta">
                      <span className="content-id">
                        게시글 번호: {detail.boardNo}
                      </span>
                    </div>
                    <h6 className="parent-post-title">{detail.boardTitle}</h6>
                    <div className="parent-post-content">
                      {detail.boardContent}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="report-actions">
            <button
              className="report-action-btn report-reply-btn"
              onClick={handleSanction}
            >
              해당 회원 제재
            </button>
            <button
              className="report-action-btn report-reply-btn"
              onClick={handleDelete}
            >
              신고 취소(허위신고)
            </button>
            <button
              className="report-action-btn"
              onClick={() => navigate("/admin/customer")}
            >
              목록
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminCustomerReportDetail;
