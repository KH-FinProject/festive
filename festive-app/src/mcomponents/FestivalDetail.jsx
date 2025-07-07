import {
  Calendar,
  Phone,
  Star,
  ChevronRight,
  MapPin,
  Section,
} from "lucide-react";
import "./FestivalDetail.css";

// 모달 관련
import { X } from "lucide-react";

// 슬라이더
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import PublicCarPark from "./MapApi";
import StayModal from "./StayModal";
import DetailWeather from "./DetailWeatherAPI";
import LikeButton from "./LikeButton";
import useAuthStore from "../store/useAuthStore";
import BoothList from "./BoothList";

// 축제 상태 진행
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

// 축제 디테일 페이지 시작
const FestivalDetail = () => {
  const [festival, setFestival] = useState([]);
  const [festivalDetail, setFestivalDetail] = useState([]);
  const [festivalImg, setFestivalImg] = useState([]);
  const [listFestival, setListFestival] = useState([]);
  const [posterImg, setPosterImg] = useState([]);
  const [listStay, setListStay] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [eventState, setEventState] = useState("");
  const { contentId } = useParams();

  const navigate = useNavigate();

  // 현재 로그인 상태인지 확인하기 위함
  const { member } = useAuthStore();

  // 숙소 관련 모달창 열기
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStay, setSelectedStay] = useState(null);

  // 지도 마커 클릭 시 정보 받아오기
  const [selectedMarkerInfo, setSelectedMarkerInfo] = useState(null);

  const handleMarkerClick = (markerData) => {
    setSelectedMarkerInfo(markerData);
    console.log("markerData : ", markerData);
  };

  // 슬라이더
  const FestivalSwiper = () => {
    return (
      <Swiper
        slidesPerView={3} // 기본 3장씩
        spaceBetween={30}
        loop={false} // 반복
        navigation={false} // 양 사이드 화살표
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

      const url = `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=Festive&_type=json&contentId=${contentId}`;

      const response = await fetch(url);
      const data = await response.json();
      const item = data?.response?.body?.items?.item;

      if (!item) return;
      setFestival(item[0]);
    } catch (error) {
      console.error("축제 정보 로드 실패:", error);
    }
  };

  // 축제 소개 정보 불러오기
  const fetchFestivalDetail = async () => {
    try {
      const serviceKey = import.meta.env.VITE_TOURAPI_KEY;

      const url = `https://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${serviceKey}&MobileApp=festive&MobileOS=ETC&_type=json&contentId=${contentId}&contentTypeId=15`;

      const response = await fetch(url);
      const data = await response.json();
      const item = data?.response?.body?.items?.item;

      if (!item) return;
      setFestivalDetail(item[0]);
      setEventState(
        getFestivalStatus(item[0].eventstartdate, item[0].eventenddate)
      );
      console.log(eventState);
    } catch (error) {
      console.error("축제 소개 정보 로드 실패:", error);
    }
  };

  // 축제 이미지 정보 불러오기
  const fetchFestivalImg = async () => {
    try {
      const serviceKey = import.meta.env.VITE_TOURAPI_KEY;

      const url = `https://apis.data.go.kr/B551011/KorService2/detailImage2?serviceKey=${serviceKey}&MobileApp=Festive&MobileOS=ETC&_type=json&contentId=${contentId}&imageYN=Y`;

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
      let subImgs;
      if (poster != null) {
        subImgs = mapped.filter((img) => img !== poster);
      } else {
        subImgs = mapped;
      }

      setPosterImg(poster);
      setFestivalImg(subImgs);
      // console.log(festivalImg);
    } catch (error) {
      console.error("축제 이미지 정보 로드 실패:", error);
    }
  };

  // 축제 리스트 (추천 축제를 위한 리스트)
  const fetchFestivalList = async () => {
    try {
      const today = new Date();
      const yyyyMMdd = today.toISOString().slice(0, 10).replace(/-/g, "");
      const serviceKey = import.meta.env.VITE_TOURAPI_KEY;

      const url = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=Festive&_type=json&eventStartDate=${yyyyMMdd}&arrange=C&numOfRows=50&pageNo=1`;

      const response = await fetch(url);
      const data = await response.json();
      const items = data?.response?.body?.items?.item;

      if (!items || !Array.isArray(items)) return;

      const mapped = items.map((item) => {
        const start = item.eventstartdate;
        const end = item.eventenddate;
        return {
          id: item.contentid,
          title: item.title,
          location: item.addr1 || "장소 미정",
          date: `${start?.replace(
            /(\d{4})(\d{2})(\d{2})/,
            "$1.$2.$3"
          )} - ${end?.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3")}`,
          image: item.firstimage || "../../logo.png",
          startDate: start,
          status: getFestivalStatus(start, end),
        };
      });

      // 랜덤 셔플 후 3개 선택
      const shuffled = [...mapped].sort(() => Math.random() - 0.5);
      const randomThree = shuffled.slice(0, 3);
      setListFestival(randomThree);
    } catch (error) {
      console.error("추천 축제 리스트 로드 실패:", error);
    }
  };

  // 축제 클릭 핸들러
  const handleFestivalClick = (festivalId) => {
    // 실제로는 React Router로 상세페이지 이동
    window.scrollTo(0, 0);
    console.log(`축제 ${festivalId} 상세페이지로 이동`);
    navigate(`/festival/detail/${festivalId}`);
  };

  // 숙박 정보
  const fetchListStay = async ({ lDongRegnCd, lDongSignguCd }) => {
    try {
      const serviceKey = import.meta.env.VITE_TOURAPI_KEY;

      const url = `https://apis.data.go.kr/B551011/KorService2/searchStay2?serviceKey=${serviceKey}&MobileApp=festive&MobileOS=ETC&pageNo=1&numOfRows=10&arrange=C&_type=json&lDongRegnCd=${lDongRegnCd}&lDongSignguCd=${lDongSignguCd}`;

      const response = await fetch(url);
      const data = await response.json();
      const items = data?.response?.body?.items?.item;
      if (!items || !Array.isArray(items)) return;
      const mapped = items.map((item) => {
        return {
          id: item.contentid,
          title: item.title,
          addr1: item.addr1,
          addr2: item.addr2,
          image: item.firstimage || "../../logo.png",
          tel: item.tel,
        };
      });
      // 랜덤 셔플 후 3개 선택
      const shuffled = [...mapped].sort(() => Math.random() - 0.5);
      const randomThree = shuffled.slice(0, 3);
      setListStay(randomThree);
    } catch (error) {
      console.error("숙박 정보 로드 실패:", error);
    }
  };

  // handleCardClick 함수 정의
  const handleCardClick = (stay) => {
    setSelectedStay(stay);
    setIsOpen(true);
  };

  // 모달 닫기 함수
  const closeModal = () => {
    setIsOpen(false);
    setSelectedStay(null);
  };

  // 부스 참가 신청 페이지로 이동
  const handleClickApply = (
    contentId,
    contentTitle,
    startDate,
    endDate,
    category
  ) => {
    console.log(`부스참가신청 : ${contentId} `);
    navigate("/booth", {
      state: {
        contentId: contentId,
        contentTitle: contentTitle,
        startDate: startDate,
        endDate: endDate,
        category: category,
      },
    });
  };

  // useEffect
  useEffect(() => {
    fetchFestivals();
    fetchFestivalImg();
    fetchFestivalDetail();
    fetchFestivalList();
    setSelectedMarkerInfo(null);
  }, [contentId]);

  useEffect(() => {
    if (
      festival != null &&
      festivalDetail != null &&
      festivalImg != null &&
      eventState != null &&
      listFestival != null &&
      listStay != null
    ) {
      setIsLoading(false);
    }
  }, [
    festival,
    festivalDetail,
    festivalImg,
    eventState,
    listFestival,
    listStay,
  ]);

  // 축제 정보를 불러온 후 숙소 정보 불러오기 가능
  useEffect(() => {
    if (festival && festival.lDongRegnCd && festival.lDongSignguCd) {
      fetchListStay({
        lDongRegnCd: festival.lDongRegnCd,
        lDongSignguCd: festival.lDongSignguCd,
      });
    }
  }, [festival]);

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
              <div className="festival-title-row">
                <h1 className="festival-name">{festival.title}</h1>
                {member != null && (
                  <div className="festival-apply-buttons">
                    <button
                      className="both-apply-btn"
                      onClick={() => {
                        handleClickApply(
                          contentId,
                          festival.title,
                          festivalDetail.eventstartdate,
                          festivalDetail.eventenddate,
                          "foodtruck"
                        );
                      }}
                    >
                      🚒 푸드트럭 참가 신청
                    </button>
                    <button
                      className="both-apply-btn"
                      onClick={() => {
                        handleClickApply(
                          contentId,
                          festival.title,
                          festivalDetail.eventstartdate,
                          festivalDetail.eventenddate,
                          "fleamarket"
                        );
                      }}
                    >
                      🎪 플리마켓 참가 신청
                    </button>
                  </div>
                )}
              </div>
              <div className="festival-badge">
                <span className="badge-button">{eventState}</span>
                <div className="headerweather-placeholder">
                  {festival?.mapx && festival?.mapy ? (
                    <DetailWeather
                      center={{ lat: festival.mapy, lon: festival.mapx }}
                    />
                  ) : (
                    <span>날씨 정보를 불러오는 중입니다!</span>
                  )}
                </div>
              </div>
              <div className="festival-date">
                <Calendar className="icon" />
                <span>
                  {festivalDetail.eventstartdate} ~{" "}
                  {festivalDetail.eventenddate}
                </span>
                <LikeButton contentId={contentId} />

              </div>
            </div>

            {/* Festival Images */}
            <div className="festival-slider">
              {festivalImg && festivalImg.length > 0 && <FestivalSwiper />}
            </div>

            {/* Festival Details 축제 상세설명*/}
            <div className="festival-details">
              <p style={{ whiteSpace: "pre-line" }}>
                {festival.overview?.replace(/<br\s*\/?>/gi, "\n")}
              </p>
            </div>

            {/* Event Poster */}
            <div className="event-poster">
              <div className="poster-image">
                {posterImg && (
                  <img src={posterImg.originimgurl} alt="포스터 이미지" />
                )}
              </div>
              <div className="festival-info-card">
                <div className="info-header">
                  <h3>행사일시</h3>
                  <span className="date-range">
                    {festivalDetail.eventstartdate} ~{" "}
                    {festivalDetail.eventenddate}
                  </span>
                </div>

                <div className="detail-info-item">
                  <h3>장소</h3>
                  <p>
                    {festival.addr1}
                    {festival.addr2}
                  </p>
                </div>

                <div className="detail-info-item">
                  <h3>입장료</h3>
                  <p style={{ whiteSpace: "pre-line" }}>
                    {festivalDetail?.usetimefestival?.replace(
                      /<br\s*\/?>/gi,
                      "\n"
                    )}
                  </p>
                </div>

                <div className="detail-info-item">
                  <h3>개최지</h3>
                  <p>
                    {festivalDetail?.sponsor1}
                    {festivalDetail?.sponsor2}
                  </p>
                </div>

                <div className="detail-info-item">
                  <h3>연락처</h3>
                  <p className="contact">
                    <Phone className="phone-icon" />
                    {festivalDetail?.sponsor1tel}
                  </p>
                </div>

                {festivalDetail?.homepage && (
                  <div className="detail-info-item">
                    <h3>홈페이지 주소</h3>
                    <p className="homepage">{festivalDetail.homepage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map Section */}
          <section className="map-section">
            <h3 className="section-title">
              <MapPin className="title-icon" />
              찾아가기
            </h3>
            <div className="map-container-grid">
              <div className="map-container">
                <PublicCarPark
                  lDongRegnCd={festival.lDongRegnCd}
                  lDongSignguCd={festival.lDongSignguCd}
                  center={{ lat: festival.mapy, lng: festival.mapx }}
                  placeName={festival.title}
                  onMarkerClick={handleMarkerClick}
                />
              </div>

              {selectedMarkerInfo ? (
                <div className="map-container">
                  <div className="map-container-detail">
                    <h3>선택된 주차장</h3>
                    <p>
                      <strong>이름:</strong> {selectedMarkerInfo.name}
                    </p>
                    <p>
                      <strong>도로명 주소:</strong> {selectedMarkerInfo.address}
                    </p>
                    <p>
                      <strong>지번 주소:</strong> {selectedMarkerInfo.jibunAddr}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="map-container">
                  <div className="map-container-detail">
                    <h3>지도에서 주차장을 선택해주세요.</h3>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Public Transportation Maps */}
          {/* <section className="transport-section">
            <div className="transport-grid">
              <div className="transport-item">
                <h4>
                  <span className="transport-icon">🚌</span>
                  근처 공영주차장
                </h4>
                <div className="transport-map">
                   <PublicCarPark
                    lDongRegnCd={festival.lDongRegnCd}
                    lDongSignguCd={festival.lDongSignguCd}
                    center={{ lat: festival.mapy, lng: festival.mapx }}
                  /> 
                </div>
              </div>
              <div className="transport-item">
                <h4>
                  <span className="transport-icon">🚇</span>
                  근처 전기차충전소 충전소
                </h4>
                 <div className="transport-map">
                  <EVChargeApi
                    metroCode={festival.lDongRegnCd}
                    cityCode={festival.lDongSignguCd}
                  />
                </div> 
              </div>
            </div>
          </section> */}

          {/* 플리마켓 / 푸드트럭 정보 */}
          <BoothList contentId={contentId} />

          {/* Accommodation Section */}
          <section className="accommodation-section">
            <h3 className="section-title">주변 숙박 정보</h3>
            <div className="accommodation-grid">
              {listStay.map((stay) => (
                <div
                  key={stay.id}
                  className="festival-card"
                  onClick={() => handleCardClick(stay)}
                >
                  <div className="festival-image-container">
                    <img
                      src={stay.image}
                      alt={stay.title}
                      className="festival-image"
                    />
                  </div>

                  <div className="festival-info">
                    <h3 className="festival-title">{stay.title}</h3>
                    <p className="festival-location">
                      <svg
                        className="icon"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {stay.addr1}
                      {stay.addr2}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Modal 컴포넌트 사용 */}
          <StayModal
            isOpen={isOpen}
            selectedStay={selectedStay}
            onClose={closeModal}
          />

          {/* Other Festivals */}
          <section className="other-festivals">
            <h3 className="section-title">다른 축제도 둘러보세요!</h3>
            <div className="festivals-grid">
              {listFestival.map((festival) => (
                <div
                  key={festival.id}
                  className="festival-card"
                  onClick={() => handleFestivalClick(festival.id)}
                >
                  <div className="festival-image-container">
                    <img
                      src={festival.image}
                      alt={festival.title}
                      className="festival-image"
                    />
                    <div
                      className={`festival-status ${festival.status === "진행중" ? "active" : "upcoming"
                        }`}
                    >
                      {festival.status}
                    </div>
                  </div>

                  <div className="festival-info">
                    <h3 className="festival-title">{festival.title}</h3>
                    <p className="festival-location">
                      <svg
                        className="icon"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {festival.location}
                    </p>
                    <p className="festival-date">
                      <svg
                        className="icon"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {festival.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }
};

export default FestivalDetail;
