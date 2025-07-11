import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AdminApplicationStatus.css";
import "./AdminCommon.css";
import AdminSidebar from "./AdminSideBar";
import axiosApi from "../api/axiosAPI";

// 날짜 포맷 함수
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("ko-KR");
}

const AdminApplicationDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const boothNo = location.state?.boothNo;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boothNo) {
      // boothNo 없으면 목록으로 이동
      navigate("/admin/applications");
      return;
    }
    setLoading(true);
    axiosApi
      .get(`/api/booth/request/${boothNo}`)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [boothNo, navigate]);

  const handleAccept = async () => {
    if (!boothNo) return;
    await axiosApi.patch(`/api/booth/request/${boothNo}/accept`);
    alert("수락 처리되었습니다.");
    navigate("/admin/applications");
  };
  const handleReject = async () => {
    if (!boothNo) return;
    if (!window.confirm("정말로 거절(삭제)하시겠습니까?")) return;
    await axiosApi.delete(`/api/booth/request/${boothNo}`);
    alert("거절(삭제) 처리되었습니다.");
    navigate("/admin/applications");
  };

  return (
    <div className="admin-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">신청서 상세</h1>
          </div>
          {loading ? (
            <div>로딩중...</div>
          ) : !detail ? (
            <div>신청서 정보를 불러올 수 없습니다.</div>
          ) : (
            <div className="application-detail-form">
              <div>
                <b>신청자명:</b> {detail.applicantName}
              </div>
              <div>
                <b>신청유형:</b>{" "}
                {detail.boothType === 1
                  ? "플리마켓"
                  : detail.boothType === 2
                  ? "푸드트럭"
                  : "-"}
              </div>
              <div>
                <b>신청 축제:</b> {detail.contentTitle}
              </div>
              <div>
                <b>연락처:</b> {detail.boothTel}
              </div>
              <div>
                <b>기업명:</b> {detail.applicantCompany}
              </div>
              <div>
                <b>판매 품목:</b> {detail.products}
              </div>
              <div>
                <b>신청 기간:</b> {formatDate(detail.boothStartDate)} ~{" "}
                {formatDate(detail.boothEndDate)}
              </div>
              <div>
                <b>상태:</b> {detail.boothAccept === "Y" ? "수락완료" : "대기"}
              </div>
              {detail.boothImg && (
                <div>
                  <b>대표 이미지:</b>
                  <br />
                  <img
                    src={detail.boothImg}
                    alt="대표 이미지"
                    style={{ maxWidth: 200 }}
                  />
                </div>
              )}
              <div style={{ marginTop: 24 }}>
                <button
                  className="app-action-btn app-detail-btn"
                  onClick={handleAccept}
                >
                  수락
                </button>
                <button
                  className="app-action-btn app-detail-btn"
                  onClick={handleReject}
                  style={{ marginLeft: 12 }}
                >
                  거절
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminApplicationDetail;
