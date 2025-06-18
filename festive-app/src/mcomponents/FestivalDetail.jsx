import { MapPin, Calendar, Phone, Star, ChevronRight } from "lucide-react";
import "./FestivalDetail.css";
import test from "../assets/IMG_0860.jpg";
const FestivalDetail = () => {
  return (
    <div className="festival-container">
      {/* thumbnail Section with Background */}
      <section className="thumbnail-section">
        <img src={test}></img>
      </section>
      {/* Main Content */}
      <main className="fes-detail-main-content">
        {/* Content Section */}
        <div className="content-wrapper">
          <div className="festival-description">
            <p>강원 한우, 저도 먹고싶습니다. 배고프네요</p>
            <h2 className="festival-name">강원한우데이</h2>
            <div className="festival-badge">
              <span className="badge-button">진행중</span>
              <span className="badge-text">날씨API</span>
            </div>
            <div className="festival-date">
              <Calendar className="icon" />
              <span>2025.06.13 ~ 2025.06.15</span>
            </div>
          </div>

          {/* Festival Images */}
          <div className="festival-images">
            <div className="image-grid">
              <div className="festival-image image-1">슬라이더</div>
              <div className="festival-image image-2">들어가는</div>
              <div className="festival-image image-3">부분입니다</div>
            </div>
          </div>

          {/* Festival Details */}
          <div className="festival-details">
            <p>
              강원한우축제는 강원도 가장 큰 행사 중의 하나로 매년 수많은
              방문객들이 찾는 대표적인 축제입니다. 이번 축제에서는 최고급
              강원한우를 만나볼 수 있으며, 다양한 부대행사와 체험 프로그램도
              마련되어 있습니다.
            </p>
          </div>

          {/* Event Poster */}
          <div className="event-poster">
            <div className="poster-image">
              <h3>행사포스터</h3>
            </div>
            <div className="festival-info-card">
              <div className="info-header">
                <h3>행사일시</h3>
                <span className="date-range">2025.06.13 ~ 2025.06.15</span>
              </div>

              <div className="info-item">
                <h4>장소</h4>
                <p>
                  강원특별자치도 춘천시 석사동 11 (석사동) 춘천시민 종합 체육관
                </p>
              </div>

              <div className="info-item">
                <h4>입장료</h4>
                <p>축제 입장 무료</p>
              </div>

              <div className="info-item">
                <h4>개최지</h4>
                <p>
                  강원특별자치도한우(강원도), 춘천시한우농협(춘천시),
                  한국축산연구소(강원대), 춘천시, 홍천군
                </p>
              </div>

              <div className="info-item">
                <h4>연락처</h4>
                <p className="contact">
                  <Phone className="phone-icon" />
                  033-242-1625
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <section className="map-section">
          <h3 className="section-title">
            <MapPin className="title-icon" />
            찾아가기
          </h3>
          <div className="map-container">
            <div className="map-placeholder">
              <p>지도 API 영역</p>
            </div>
          </div>
        </section>

        {/* Public Transportation Maps */}
        <section className="transport-section">
          <div className="transport-grid">
            <div className="transport-item">
              <h4>
                <span className="transport-icon">🚌</span>
                근처 공영주차장
              </h4>
              <div className="transport-map">
                <p>주차장 지도 API 영역</p>
              </div>
            </div>
            <div className="transport-item">
              <h4>
                <span className="transport-icon">🚇</span>
                근처 전기차충전소 충전소
              </h4>
              <div className="transport-map">
                <p>충전소 지도 API 영역</p>
              </div>
            </div>
          </div>
        </section>

        {/* Accommodation Section */}
        <section className="accommodation-section">
          <h3 className="section-title">주변 숙박 정보</h3>
          <div className="accommodation-grid">
            <div className="accommodation-item">
              <div className="accommodation-image"></div>
              <div className="accommodation-info">
                <h4>베인트 윈드 소흘 호텔</h4>
                <p>강원특별자치도 춘천시</p>
              </div>
            </div>
            <div className="accommodation-item">
              <div className="accommodation-image"></div>
              <div className="accommodation-info">
                <h4>스카이베이호텔 펜션</h4>
                <p>강원특별자치도 춘천시</p>
              </div>
            </div>
            <div className="accommodation-item">
              <div className="accommodation-image"></div>
              <div className="accommodation-info">
                <h4>바이오산 펜션</h4>
                <p>강원특별자치도 춘천시</p>
              </div>
            </div>
          </div>
        </section>

        {/* Other Festivals */}
        <section className="other-festivals">
          <h3 className="section-title">다른 축제도 둘러보세요!</h3>
          <div className="festivals-grid">
            <div className="festival-card">
              <div className="festival-card-image"></div>
              <div className="festival-card-info">
                <h4>태백 해바라기축제</h4>
                <p className="festival-date">2025.07.01 ~ 2025.08.31</p>
                <p className="festival-location">강원특별자치도 태백시</p>
              </div>
            </div>
            <div className="festival-card">
              <div className="festival-card-image"></div>
              <div className="festival-card-info">
                <h4>김치 거버넌스</h4>
                <p className="festival-date">2025.10.25 ~ 2025.10.30</p>
                <p className="festival-location">강원특별자치도 강릉시</p>
              </div>
            </div>
            <div className="festival-card">
              <div className="festival-card-image"></div>
              <div className="festival-card-info">
                <h4>산나물 숲속 축제</h4>
                <p className="festival-date">2025.09.24 ~ 2025.09.27</p>
                <p className="festival-location">강원특별자치도 홍천군</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FestivalDetail;
