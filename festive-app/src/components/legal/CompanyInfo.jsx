import React from "react";
import "./LegalPages.css";
import LegalSideMenu from "./LegalSideMenu";
import LegalScrollToTop from "./LegalScrollToTop";

const CompanyInfo = () => {
  return (
    <>
      <LegalSideMenu />
      <div className="legal-pages-container">
        <div className="legal-pages-content">
          <h1 className="legal-pages-title">회사소개</h1>

          <section className="company-overview">
            <h2>회사 개요</h2>
            <div className="legal-pages-company-info-grid">
              <div className="legal-pages-info-item">
                <strong>상호:</strong> (주)페스티브
              </div>
              <div className="legal-pages-info-item">
                <strong>대표자:</strong> 성원숭
              </div>
              <div className="legal-pages-info-item">
                <strong>사업자등록번호:</strong> 123-45-67890
              </div>
              <div className="legal-pages-info-item">
                <strong>통신판매업신고번호:</strong> 2025-서울강남-1234
              </div>
              <div className="legal-pages-info-item">
                <strong>주소:</strong> 서울특별시 우자 산업단지 유튜브 99,
                울트라사옥
              </div>
              <div className="legal-pages-info-item">
                <strong>대표전화:</strong> 1588-1234
              </div>
              <div className="legal-pages-info-item">
                <strong>이메일:</strong> rkdwl811@gmail.com
              </div>
              <div className="legal-pages-info-item">
                <strong>고객센터 운영시간:</strong> 24시간 연중무휴
              </div>
            </div>
          </section>

          <section className="company-vision">
            <h2>회사 비전</h2>
            <div className="legal-pages-vision-content">
              <h3> FESTIVE - 모든 축제가 하나로</h3>
              <p>
                FESTIVE는 대한민국 전국의 다양한 축제 정보를 한 곳에서 쉽게
                찾아볼 수 있는 종합 축제 정보 플랫폼입니다. 지역별, 월별,
                테마별로 축제를 검색하고, AI 기반 맞춤형 여행 코스를 추천받으며,
                다른 사용자들과 축제 경험을 공유할 수 있는 서비스를 제공합니다.
              </p>
            </div>
          </section>

          <section className="business-area">
            <h2>주요 사업 영역</h2>
            <div className="legal-pages-business-list">
              <div className="legal-pages-business-item">
                <h3> 축제 정보 제공</h3>
                <p>전국 지역별, 월별 축제 정보 및 일정 제공</p>
              </div>
              <div className="legal-pages-business-item">
                <h3>AI 여행 코스 추천</h3>
                <p>인공지능 기반 맞춤형 축제 여행 코스 추천</p>
              </div>
              <div className="legal-pages-business-item">
                <h3>커뮤니티 서비스</h3>
                <p>축제 경험 공유 및 정보 교환 커뮤니티</p>
              </div>
              <div className="legal-pages-business-item">
                <h3>부스 운영 지원</h3>
                <p>축제 부스 운영자를 위한 신청 및 관리 서비스</p>
              </div>
            </div>
          </section>

          <section className="company-history">
            <h2>회사 연혁</h2>
            <div className="legal-pages-timeline">
              <div className="legal-pages-timeline-item">
                <div className="legal-pages-timeline-date">2025.07</div>
                <div className="legal-pages-timeline-content">
                  FESTIVE 서비스 베타 출시
                </div>
              </div>
              <div className="legal-pages-timeline-item">
                <div className="legal-pages-timeline-date">2024.12</div>
                <div className="legal-pages-timeline-content">
                  AI 여행 코스 추천 시스템 개발 완료
                </div>
              </div>
              <div className="legal-pages-timeline-item">
                <div className="legal-pages-timeline-date">2024.06</div>
                <div className="legal-pages-timeline-content">
                  (주)페스티브 법인 설립
                </div>
              </div>
            </div>
          </section>

          <section className="contact-info">
            <h2>연락처 정보</h2>
            <div className="legal-pages-contact-grid">
              <div className="legal-pages-contact-item">
                <h3>📞 고객센터</h3>
                <p>전화: 1588-1234</p>
                <p>이메일: rkdwl811@gmail.com</p>
                <p>운영시간: 연중무휴 24시간 운영</p>
              </div>
              <div className="legal-pages-contact-item">
                <h3> 본사 주소</h3>
                <p>서울특별시 우자 산업단지 유튜브 99</p>
                <p>울트라사옥</p>
              </div>
            </div>
          </section>
        </div>
      </div>
      <LegalScrollToTop />
    </>
  );
};

export default CompanyInfo;
