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
import logo from "../../assets/festiveLogo.png";

const AITravelCourse = () => {
  const [activeMenu, setActiveMenu] = useState("share");
  const [shareVisibleCount, setShareVisibleCount] = useState(6);
  const [myTravelVisibleCount, setMyTravelVisibleCount] = useState(6);
  const [sharedCourses, setSharedCourses] = useState([]);
  const [myTravelCourses, setMyTravelCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTravelCourses = async () => {
      try {
        const baseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

        // 공유된 여행코스와 내 여행코스를 위한 API 호출
        const sharedUrl = `${baseUrl}/api/travel-course/shared-courses`;
        const myUrl = `${baseUrl}/api/travel-course/my-courses`;

        // 공유 코스는 인증 없이 가져오기
        const sharedResponse = await fetch(sharedUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // 내 여행코스는 쿠키 인증 포함하여 가져오기
        const myResponse = await fetch(myUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // 쿠키 포함 (JWT 토큰)
        });

        // 공유 코스 응답 처리
        const sharedData = await sharedResponse.json();
        const sharedItems = sharedData.success ? sharedData.courses : [];

        // 내 여행코스 응답 처리
        let myItems = [];
        if (myResponse && myResponse.ok) {
          const myData = await myResponse.json();
          myItems = myData.success ? myData.courses : [];
        }

        // 공유 코스 데이터 매핑
        const mappedSharedCourses = sharedItems.map((course, index) => ({
          id: course.courseNo,
          title: course.courseTitle,
          date: course.createdDate
            ? new Date(course.createdDate)
                .toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
                .replace(/\./g, ".")
            : "날짜 미정",
          location: course.regionName || "지역 미정",
          image:
            course.thumbnailImage ||
            [image9, image10, image11, image12, image13][index % 5],
          totalDays: course.totalDays,
          requestType: course.requestType,
        }));

        // 내 여행코스 데이터 매핑
        const mappedMyTravelCourses = myItems.map((course, index) => ({
          id: course.courseNo,
          title: course.courseTitle,
          date: course.createdDate
            ? new Date(course.createdDate)
                .toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
                .replace(/\./g, ".")
            : "날짜 미정",
          location: course.regionName || "지역 미정",
          image: course.thumbnailImage || logo,
          totalDays: course.totalDays,
          requestType: course.requestType,
        }));

        setSharedCourses(mappedSharedCourses);
        setMyTravelCourses(mappedMyTravelCourses);
        setLoading(false);
      } catch (error) {
        console.error("여행 코스 데이터 로드 실패:", error);
        setLoading(false);
      }
    };

    fetchTravelCourses();
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
