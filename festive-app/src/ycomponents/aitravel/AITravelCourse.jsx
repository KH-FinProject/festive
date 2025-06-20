import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./AITravelCourse.css";
import AItitle from "./AItitle";
import ScrollToTop from "./ScrollToTop";
import AISideMenu from "./AISideMenu";
import image9 from "../../assets/temp/image 9.png";
import image10 from "../../assets/temp/image 10.png";
import image11 from "../../assets/temp/image 11.png";
import image12 from "../../assets/temp/image 12.png";
import image13 from "../../assets/temp/image 13.png";

const AITravelCourse = () => {
  const [activeMenu, setActiveMenu] = useState("share");
  const [shareVisibleCount, setShareVisibleCount] = useState(6);
  const [myTravelVisibleCount, setMyTravelVisibleCount] = useState(6);
  const [sharedCourses, setSharedCourses] = useState([]);
  const [myTravelCourses, setMyTravelCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTourData = async () => {
      try {
        const today = new Date();
        const yyyyMMdd = today.toISOString().slice(0, 10).replace(/-/g, "");
        const serviceKey = import.meta.env.VITE_TOURAPI_KEY;

        // 공유 코스와 개인 코스를 위한 두 개의 API 호출
        const sharedUrl = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=Festive&_type=json&eventStartDate=${yyyyMMdd}&arrange=A&numOfRows=28&pageNo=1`;
        const myUrl = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=Festive&_type=json&eventStartDate=${yyyyMMdd}&arrange=B&numOfRows=28&pageNo=1`;

        const [sharedResponse, myResponse] = await Promise.all([
          fetch(sharedUrl),
          fetch(myUrl),
        ]);

        const sharedData = await sharedResponse.json();
        const myData = await myResponse.json();

        const sharedItems = sharedData?.response?.body?.items?.item || [];
        const myItems = myData?.response?.body?.items?.item || [];

        // 공유 코스 데이터 매핑
        const mappedSharedCourses = sharedItems.map((item, index) => ({
          id: item.contentid,
          title: item.title,
          date: `${item.eventstartdate?.replace(
            /(\d{4})(\d{2})(\d{2})/,
            "$1.$2.$3"
          )} - ${item.eventenddate?.replace(
            /(\d{4})(\d{2})(\d{2})/,
            "$1.$2.$3"
          )}`,
          location: item.addr1 || "장소 미정",
          image:
            item.firstimage ||
            [image9, image10, image11, image12, image13][index % 5],
        }));

        // 개인 코스 데이터 매핑
        const mappedMyTravelCourses = myItems.map((item, index) => ({
          id: item.contentid,
          title: item.title,
          date: `${item.eventstartdate?.replace(
            /(\d{4})(\d{2})(\d{2})/,
            "$1.$2.$3"
          )} - ${item.eventenddate?.replace(
            /(\d{4})(\d{2})(\d{2})/,
            "$1.$2.$3"
          )}`,
          location: item.addr1 || "장소 미정",
          image:
            item.firstimage ||
            [image9, image10, image11, image12, image13][index % 5],
        }));

        setSharedCourses(mappedSharedCourses);
        setMyTravelCourses(mappedMyTravelCourses);
        setLoading(false);
      } catch (error) {
        console.error("여행 코스 데이터 로드 실패:", error);
        setLoading(false);
      }
    };

    fetchTourData();
  }, []);

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 100
    ) {
      if (activeMenu === "share") {
        setShareVisibleCount((prev) => prev + 6);
      } else {
        setMyTravelVisibleCount((prev) => prev + 6);
      }
    }
  };

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    activeMenu,
    shareVisibleCount,
    myTravelVisibleCount,
    sharedCourses,
    myTravelCourses,
  ]);

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) {
    return <div>데이터를 불러오는 중입니다...</div>;
  }

  const currentCourses =
    activeMenu === "share" ? sharedCourses : myTravelCourses;
  const visibleCount =
    activeMenu === "share" ? shareVisibleCount : myTravelVisibleCount;
  const visibleCourses = currentCourses.slice(0, visibleCount);

  return (
    <div className="ai-travel-container">
      <AItitle />

      {/* 메인 배너 섹션 */}
      <div className="ai-travel__main-banner">
        <div className="ai-travel__banner-content">
          <h2>당신만을 위한 완벽한 여행이 시작됩니다.</h2>
          <p>
            더 이상 여행 계획 때문에 고민하지 마세요! 우리의
            <br />
            똑똑한 AI가 당신의 취향, 예산, 일정에 딱 맞는 여행 코스를
            추천해드립니다.
          </p>
          <button
            className="recommendation-btn"
            onClick={() => navigate("/ai-travel/chat")}
          >
            추천받으러 가기 →
          </button>
        </div>
      </div>

      <div className="ai-travel__content-wrapper">
        <AISideMenu activeMenu={activeMenu} onMenuClick={handleMenuClick} />

        <div className="ai-travel__main-content">
          <div className="ai-travel__course-section">
            <div className="ai-travel__section-header">
              <h2>
                {activeMenu === "share" ? "여행코스 공유" : "나만의 여행코스"}
              </h2>
            </div>
            <div className="ai-travel__course-grid">
              {visibleCourses.map((course) => (
                <div
                  key={course.id}
                  className="ai-travel__course-card"
                  onClick={() => handleCourseClick(course.id)}
                >
                  <div className="ai-travel__course-image">
                    <img src={course.image} alt={course.title} />
                  </div>
                  <div className="ai-travel__course-info">
                    <h3>{course.title}</h3>
                    <p className="ai-travel__course-date">{course.date}</p>
                    <p className="ai-travel__course-location">
                      {course.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
};

export default AITravelCourse;
