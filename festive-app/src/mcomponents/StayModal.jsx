import React, { useEffect, useState } from "react";
import "./StayModal.css"; // CSS 파일 import

const StayModal = ({ isOpen, selectedStay, onClose }) => {
  const [stayList, setStayList] = useState([]);

  useEffect(() => {
    if (selectedStay && selectedStay.id) {
      console.log("selectedStay.id : ", selectedStay.id);
      fetchStays(selectedStay.id);
    }
  }, [selectedStay]);

  if (!isOpen || !selectedStay) return null;

  // 배경 클릭 시 모달 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 숙소 정보 불러오기
  const fetchStays = async (contentId) => {
    try {
      const serviceKey = import.meta.env.VITE_TOURAPI_KEY;

      const url = `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=Festive&_type=json&contentId=${contentId}`;

      const response = await fetch(url);
      const data = await response.json();
      const item = data?.response?.body?.items?.item;
      if (!item) return;
      setStayList(item[0]);
    } catch (error) {
      console.error("숙소 상세 정보 로드 실패:", error);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">{selectedStay.title}</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="모달 닫기"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          <div className="modal-image-container">
            <img
              src={selectedStay.image}
              alt={selectedStay.title}
              className="modal-image"
            />
          </div>

          <div className="modal-info">
            {stayList.overview && (
              <div className="info-section">
                <h3 className="info-title">숙소 설명</h3>
                <p className="info-text">{stayList.overview}</p>
              </div>
            )}

            <div className="info-section">
              <h3 className="info-title">위치</h3>
              <p className="info-text">
                {selectedStay.addr1} {selectedStay.addr2}
              </p>
            </div>

            {selectedStay.tel && (
              <div className="info-section">
                <h3 className="info-title">전화번호</h3>
                <p className="info-text">{selectedStay.tel}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button onClick={onClose} className="btn btn-secondary">
              닫기
            </button>
            {/* <button className="btn btn-primary">예약하기</button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StayModal;
