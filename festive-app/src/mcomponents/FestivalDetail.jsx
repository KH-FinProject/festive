import { MapPin, Calendar, Phone, Star, ChevronRight } from "lucide-react";
import "./FestivalDetail.css";
import test from "../assets/IMG_0860.jpg";
import Weather from "./../scomponents/weatherAPI/WeatherAPI";

// 슬라이더
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useEffect, useState } from "react";

const getFestivalStatus = (start, end) => {
  const now = new Date();
  const startDate = new Date(
    `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}`
  );
  const endDate = new Date(
    `${end.slice(0, 4)}-${end.slice(4, 6)}-${end.slice(6, 8)}`
  );

  if (now < startDate) return "예정";
  else if (now > endDate) return "종료";
  else return "진행중";
};

const FestivalDetail = () => {
  const [festival, setFestival] = useState([]);
  const [festivalImg, setFestivalImg] = useState([]);
  const [posterImg, setPosterImg] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 슬라이더
  const FestivalSwiper = () => {
    return (
      <Swiper
        slidesPerView={3} // 기본 3장씩
        spaceBetween={30}
        loop={true} // 반복
        navigation={false}
        pagination={{ clickable: true }}
        modules={[Navigation, Pagination]}
        className="mySwiper"
        /*       breakpoints={{
        320: { slidesPerView: 1 },
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }} */
      >
        {festivalImg.map((img, idx) => (
          <SwiperSlide key={idx}>
            <img src={img.originimgurl} alt={`slide-${idx}`} />
          </SwiperSlide>
        ))}
      </Swiper>
    );
  };

  // 축제 정보 불러오기
  const fetchFestivals = async () => {
    try {
      const serviceKey = import.meta.env.VITE_TOURAPI_KEY;

      const url = `http://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=Festive&_type=json&contentId=3113671`;

      const response = await fetch(url);
      const data = await response.json();
      const item = data?.response?.body?.items?.item;

      if (!item) return;
      setFestival(item[0]);
    } catch (error) {
      console.error("축제 정보 로드 실패:", error);
    }
  };

  // 축제 이미지 정보 불러오기
  const fetchFestivalImg = async () => {
    try {
      const serviceKey = import.meta.env.VITE_TOURAPI_KEY;
      const contentId = "";

      const url = `https://apis.data.go.kr/B551011/KorService2/detailImage2?serviceKey=${serviceKey}&MobileApp=Festive&MobileOS=ETC&_type=json&contentId=3113671&imageYN=Y`;

      const response = await fetch(url);
      const data = await response.json();
      const items = data?.response?.body?.items?.item;
      if (!items || !Array.isArray(items)) return;

      const mapped = items.map((item) => {
        return {
          contentid: item.contentid,
          originimgurl: item.originimgurl,
          imgname: item.imgname,
          smallimageurl: item.smallimageurl,
        };
      });

      // 축제 포스터
      const poster = mapped.find((img) => img.imgname.includes("포스터"));
      const subImgs = mapped.filter((img) => img !== poster);

      setPosterImg(poster);
      setFestivalImg(subImgs);
    } catch (error) {
      console.error("축제 이미지 정보 로드 실패:", error);
    }
  };

  useEffect(() => {
    fetchFestivals();
    fetchFestivalImg();
  }, []);

  useEffect(() => {
    if (festival != null && festivalImg != null && posterImg != null) {
      setIsLoading(false);
    }
  }, [festival, festivalImg, posterImg]);

  if (isLoading) {
    <h1>Loading...</h1>;
  } else {
    return (
      <div className="festival-container">
        {/* thumbnail Section with Background */}
        <section className="thumbnail-section">
          <img src={festival.firstimage}></img>
        </section>
        {/* Main Content */}
        <main className="fes-detail-main-content">
          {/* Content Section */}
          <div className="content-wrapper">
            <div className="festival-description">
              {/* <p>강원 한우, 저도 먹고싶습니다. 배고프네요</p> */}
              <h1 className="festival-name">{festival.title}</h1>
              <div className="festival-badge">
                <span className="badge-button">진행중</span>
                <div className="headerweather-placeholder">
                  <Weather />
                </div>
              </div>
              <div className="festival-date">
                <Calendar className="icon" />
                <span>2025.06.13 ~ 2025.06.15</span>
              </div>
            </div>

            {/* Festival Images */}
            <div className="festival-slider">
              <FestivalSwiper />
            </div>

            {/* Festival Details 축제 상세설명*/}
            <div className="festival-details">
              <p>{festival.overview}</p>
            </div>

            {/* Event Poster */}
            <div className="event-poster">
              <div className="poster-image">
                <img src={posterImg.originimgurl}></img>
              </div>
              <div className="festival-info-card">
                <div className="info-header">
                  <h3>행사일시</h3>
                  <span className="date-range">2025.06.13 ~ 2025.06.15</span>
                </div>

                <div className="info-item">
                  <h4>장소</h4>
                  <p>
                    강원특별자치도 춘천시 석사동 11 (석사동) 춘천시민 종합
                    체육관
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
  }
};

export default FestivalDetail;
