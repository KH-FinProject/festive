import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./AITravelCourse.css";
import AItitle from "./AItitle";
import ScrollToTop from "./ScrollToTop";
import AISideMenu from "./AISideMenu";
import useAuthStore from "../../store/useAuthStore";
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
  const { member } = useAuthStore(); // 현재 로그인한 사용자 정보

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
          title: removeEmojis(course.courseTitle),
          date: course.createdDate
            ? (() => {
                try {
                  let dateObj;
                  // 배열 형태의 날짜 처리 [year, month, day, hour, minute, second]
                  if (Array.isArray(course.createdDate)) {
                    const [year, month, day, hour, minute, second] =
                      course.createdDate;
                    // JavaScript Date는 month가 0부터 시작하므로 -1
                    dateObj = new Date(
                      year,
                      month - 1,
                      day,
                      hour || 0,
                      minute || 0,
                      second || 0
                    );
                  } else {
                    // 문자열 형태의 날짜 처리
                    dateObj = new Date(course.createdDate);
                  }

                  if (isNaN(dateObj.getTime())) {
                    return "날짜 미정";
                  }
                  return dateObj
                    .toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })
                    .replace(/\./g, ".");
                } catch (error) {
                  console.error("날짜 변환 오류:", error);
                  return "날짜 미정";
                }
              })()
            : "날짜 미정",
          // 공유 코스는 올린 사람 정보 표시 (nickname 우선, 없으면 name 사용)
          memberNickname:
            course.memberNickname || course.memberName || "알 수 없음",
          memberProfileImage: course.memberProfileImage || logo,
          location: course.regionName || "지역 미정", // 개인 코스용 (호환성)
          image:
            course.thumbnailImage ||
            [image9, image10, image11, image12, image13][index % 5],
          totalDays: course.totalDays,
          requestType: course.requestType,
        }));

        // 내 여행코스 데이터 매핑 (백엔드에서 제공하는 작성자 정보 우선 사용)
        const mappedMyTravelCourses = myItems.map((course, index) => ({
          id: course.courseNo,
          title: removeEmojis(course.courseTitle),
          date: course.createdDate
            ? (() => {
                try {
                  let dateObj;
                  // 배열 형태의 날짜 처리 [year, month, day, hour, minute, second]
                  if (Array.isArray(course.createdDate)) {
                    const [year, month, day, hour, minute, second] =
                      course.createdDate;
                    // JavaScript Date는 month가 0부터 시작하므로 -1
                    dateObj = new Date(
                      year,
                      month - 1,
                      day,
                      hour || 0,
                      minute || 0,
                      second || 0
                    );
                  } else {
                    // 문자열 형태의 날짜 처리
                    dateObj = new Date(course.createdDate);
                  }

                  if (isNaN(dateObj.getTime())) {
                    return "날짜 미정";
                  }
                  return dateObj
                    .toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })
                    .replace(/\./g, ".");
                } catch (error) {
                  console.error("날짜 변환 오류:", error);
                  return "날짜 미정";
                }
              })()
            : "날짜 미정",
          // 백엔드에서 제공하는 작성자 정보를 우선 사용 (nickname → name → 현재 사용자 정보 순)
          memberNickname:
            course.memberNickname ||
            course.memberName ||
            member?.nickname ||
            "내 계정",
          memberProfileImage:
            course.memberProfileImage || member?.profileImage || logo,
          location: course.regionName || "지역 미정",
          image: course.thumbnailImage || logo,
          totalDays: course.totalDays,
          requestType: course.requestType,
          isShared: course.isShared || "N", // 공유 상태 추가
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
  }, [member]);

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

  // 텍스트에서 이모지 제거하는 함수
  const removeEmojis = (text) => {
    if (!text) return text;
    return text
      .replace(
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
        ""
      )
      .trim();
  };

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  // 공유 상태 변경 함수
  const handleShareToggle = async (courseId, currentIsShared) => {
    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
      const newIsShared = currentIsShared === "Y" ? "N" : "Y";

      const response = await fetch(
        `${baseUrl}/api/travel-course/${courseId}/share-status?isShared=${newIsShared}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        // 현재 코스 정보 미리 가져오기 (상태 업데이트 전)
        const currentCourse = myTravelCourses.find(
          (course) => course.id === courseId
        );

        // 나만의 여행코스 상태 업데이트
        setMyTravelCourses((prev) =>
          prev.map((course) =>
            course.id === courseId
              ? { ...course, isShared: newIsShared }
              : course
          )
        );

        // 공유 상태에 따른 공유된 여행코스 목록 업데이트
        if (newIsShared === "Y") {
          // 공유하기: 공유된 여행코스 목록에 추가
          if (currentCourse) {
            setSharedCourses((prev) => [
              {
                ...currentCourse,
                isShared: "Y",
              },
              ...prev,
            ]);
          }
        } else {
          // 공유취소: 공유된 여행코스 목록에서 제거
          setSharedCourses((prev) =>
            prev.filter((course) => course.id !== courseId)
          );
        }

        alert(data.message);
      } else {
        alert(data.message || "공유 상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("공유 상태 변경 오류:", error);
      alert("공유 상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 여행코스 삭제 함수
  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (
      !confirm(
        `"${courseTitle}" 여행코스를 삭제하시겠습니까?\n삭제된 여행코스는 복구할 수 없습니다.`
      )
    ) {
      return;
    }

    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

      const response = await fetch(`${baseUrl}/api/travel-course/${courseId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        // 나만의 여행코스에서 제거
        setMyTravelCourses((prev) =>
          prev.filter((course) => course.id !== courseId)
        );

        // 공유된 여행코스에서도 제거 (만약 공유 중이었다면)
        setSharedCourses((prev) =>
          prev.filter((course) => course.id !== courseId)
        );

        alert(data.message);
      } else {
        alert(data.message || "여행코스 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("여행코스 삭제 오류:", error);
      alert("여행코스 삭제 중 오류가 발생했습니다.");
    }
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

            {/* 빈 상태 메시지 */}
            {visibleCourses.length === 0 ? (
              <div className="ai-travel__empty-state">
                {activeMenu === "share" ? (
                  <div className="ai-travel__empty-content">
                    <h3>아직 공유된 여행코스가 없습니다.</h3>
                    <p>다른 사용자들이 공유한 여행코스를 기다려보세요!</p>
                  </div>
                ) : (
                  <div className="ai-travel__empty-content">
                    <h3>현재 저장한 여행코스가 없습니다.</h3>
                    <p>AI에게 여행코스를 추천받아보세요</p>
                    <button
                      className="ai-travel__empty-btn"
                      onClick={() => navigate("/ai-travel/chat")}
                    >
                      AI 여행코스 추천받기
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ai-travel__course-grid">
                {visibleCourses.map((course) => (
                  <div key={course.id} className="ai-travel__course-card">
                    <div
                      className="ai-travel__course-image"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <img src={course.image} alt={course.title} />

                      {/* 나만의 여행코스에서만 공유중 태그 표시 */}
                      {activeMenu === "myTravel" && course.isShared === "Y" && (
                        <div className="ai-travel__shared-tag">공유중</div>
                      )}
                    </div>

                    <div
                      className="ai-travel__course-info"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <h3>{course.title}</h3>
                      <p className="ai-travel__course-date">{course.date}</p>
                      {/* 공유 코스와 개인 코스 모두 작성자 정보 표시 */}
                      <div className="ai-travel__course-author">
                        <img
                          src={course.memberProfileImage}
                          alt={course.memberNickname}
                          className="ai-travel__author-profile"
                          onError={(e) => {
                            e.target.src = logo; // 프로필 이미지 로드 실패시 로고 표시
                          }}
                        />
                        <span className="ai-travel__author-nickname">
                          {course.memberNickname}
                        </span>
                      </div>
                    </div>

                    {/* 나만의 여행코스에서만 버튼들 표시 */}
                    {activeMenu === "myTravel" && (
                      <div className="ai-travel__course-actions">
                        <button
                          className={`ai-travel__action-btn ${
                            course.isShared === "Y" ? "share-cancel" : "share"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareToggle(course.id, course.isShared);
                          }}
                        >
                          {course.isShared === "Y" ? "공유취소" : "공유하기"}
                        </button>
                        <button
                          className="ai-travel__action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id, course.title);
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
};

export default AITravelCourse;
