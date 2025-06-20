import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import "./AITravelCourse.css";
import AItitle from "./AItitle";
import ScrollToTop from "./ScrollToTop";
import image9 from "../../assets/temp/image 9.png";
import image10 from "../../assets/temp/image 10.png";
import image11 from "../../assets/temp/image 11.png";
import image12 from "../../assets/temp/image 12.png";
import image13 from "../../assets/temp/image 13.png";

function SideMenu({ activeMenu, onMenuClick }) {
  return (
    <div className="side-menu">
      <ul>
        <li
          className={activeMenu === "share" ? "active" : ""}
          onClick={() => onMenuClick("share")}
        >
          여행코스 공유
        </li>
        <li
          className={activeMenu === "myTravel" ? "active" : ""}
          onClick={() => onMenuClick("myTravel")}
        >
          나만의 여행코스
        </li>
      </ul>
    </div>
  );
}

const sharedCourses = [
  {
    id: 1,
    title: "서울 도심 속 문화여행",
    date: "2024.04.20 - 2024.04.23",
    location: "서울 성동구・종로구",
    image: image9,
  },
  {
    id: 2,
    title: "강원도 자연 힐링코스",
    date: "2024.05.01 - 2024.05.04",
    location: "강릉・속초・양양",
    image: image10,
  },
  {
    id: 3,
    title: "제주 로컬 맛집투어",
    date: "2024.05.15 - 2024.05.19",
    location: "제주시・서귀포시",
    image: image11,
  },
  {
    id: 4,
    title: "부산 해안가 드라이브",
    date: "2024.06.01 - 2024.06.04",
    location: "해운대・광안리・태종대",
    image: image12,
  },
  {
    id: 5,
    title: "전주 전통문화 체험",
    date: "2024.06.10 - 2024.06.12",
    location: "전주 한옥마을",
    image: image13,
  },
  {
    id: 6,
    title: "여수 밤바다 여행",
    date: "2024.06.20 - 2024.06.23",
    location: "여수 해상케이블카・돌산공원",
    image: image9,
  },
  {
    id: 7,
    title: "경주 역사 탐방",
    date: "2024.07.01 - 2024.07.04",
    location: "불국사・첨성대・안압지",
    image: image10,
  },
  {
    id: 8,
    title: "통영 섬 여행",
    date: "2024.07.10 - 2024.07.13",
    location: "통영・거제・남해",
    image: image11,
  },
  {
    id: 9,
    title: "강화도 역사 탐방",
    date: "2024.07.20 - 2024.07.22",
    location: "강화도・교동도",
    image: image12,
  },
  {
    id: 10,
    title: "안동 전통 문화 여행",
    date: "2024.08.01 - 2024.08.03",
    location: "하회마을・도산서원",
    image: image13,
  },
  {
    id: 11,
    title: "포항 해안도로 드라이브",
    date: "2024.08.05 - 2024.08.07",
    location: "호미곶・영일대해수욕장",
    image: image9,
  },
  {
    id: 12,
    title: "대전 과학관 투어",
    date: "2024.08.10 - 2024.08.12",
    location: "대전엑스포・카이스트",
    image: image10,
  },
  {
    id: 13,
    title: "춘천 맛집 여행",
    date: "2024.08.15 - 2024.08.17",
    location: "남이섬・춘천닭갈비거리",
    image: image11,
  },
  {
    id: 14,
    title: "군산 근대문화 탐방",
    date: "2024.08.20 - 2024.08.22",
    location: "군산근대문화거리・초원사진관",
    image: image12,
  },
  {
    id: 15,
    title: "목포 항구도시 여행",
    date: "2024.08.25 - 2024.08.27",
    location: "목포근대역사관・유달산",
    image: image13,
  },
  {
    id: 16,
    title: "단양 패러글라이딩 체험",
    date: "2024.09.01 - 2024.09.03",
    location: "단양팔경・온달관광지",
    image: image9,
  },
  {
    id: 17,
    title: "태안 해안 국립공원",
    date: "2024.09.05 - 2024.09.07",
    location: "만리포・천리포수목원",
    image: image10,
  },
  {
    id: 18,
    title: "보성 녹차밭 여행",
    date: "2024.09.10 - 2024.09.12",
    location: "대한다원・율포해수욕장",
    image: image11,
  },
  {
    id: 19,
    title: "거창 항노화 여행",
    date: "2024.09.15 - 2024.09.17",
    location: "거창항노화힐링랜드・수승대",
    image: image12,
  },
  {
    id: 20,
    title: "영월 동강 래프팅",
    date: "2024.09.20 - 2024.09.22",
    location: "동강・장릉",
    image: image13,
  },
  {
    id: 21,
    title: "문경 세재 트래킹",
    date: "2024.09.25 - 2024.09.27",
    location: "문경새재・문경온천",
    image: image9,
  },
  {
    id: 22,
    title: "청송 사과따기 체험",
    date: "2024.10.01 - 2024.10.03",
    location: "청송사과공원・주왕산",
    image: image10,
  },
  {
    id: 23,
    title: "남해 독일마을 여행",
    date: "2024.10.05 - 2024.10.07",
    location: "독일마을・금산보리암",
    image: image11,
  },
  {
    id: 24,
    title: "영덕 대게 맛집 투어",
    date: "2024.10.10 - 2024.10.12",
    location: "영덕대게거리・블루로드",
    image: image12,
  },
  {
    id: 25,
    title: "완도 해조류 체험",
    date: "2024.10.15 - 2024.10.17",
    location: "청산도・완도타워",
    image: image13,
  },
  {
    id: 26,
    title: "고창 청보리밭 여행",
    date: "2024.10.20 - 2024.10.22",
    location: "학원농장・선운산",
    image: image9,
  },
  {
    id: 27,
    title: "공주 백제문화 탐방",
    date: "2024.10.25 - 2024.10.27",
    location: "공산성・무령왕릉",
    image: image10,
  },
  {
    id: 28,
    title: "영주 소수서원 여행",
    date: "2024.11.01 - 2024.11.03",
    location: "소수서원・부석사",
    image: image11,
  },
];

const myTravelCourses = [
  {
    id: 1,
    title: "나만의 제주 힐링 여행",
    date: "2024.05.01 - 2024.05.04",
    location: "제주시・서귀포시",
    image: image12,
  },
  {
    id: 2,
    title: "서울 야경 투어",
    date: "2024.05.10 - 2024.05.12",
    location: "남산・북악스카이웨이",
    image: image13,
  },
  {
    id: 3,
    title: "부산 맛집 탐방",
    date: "2024.06.01 - 2024.06.03",
    location: "서면・남포동・해운대",
    image: image9,
  },
  {
    id: 4,
    title: "강릉 커피거리 여행",
    date: "2024.06.15 - 2024.06.17",
    location: "안목해변・정동진",
    image: image10,
  },
  {
    id: 5,
    title: "전주 한옥마을 데이트",
    date: "2024.07.01 - 2024.07.03",
    location: "전주 한옥마을",
    image: image11,
  },
  {
    id: 6,
    title: "속초 해변 드라이브",
    date: "2024.07.15 - 2024.07.17",
    location: "속초해변・설악산",
    image: image12,
  },
  {
    id: 7,
    title: "여수 야경 투어",
    date: "2024.08.01 - 2024.08.03",
    location: "여수밤바다・오동도",
    image: image13,
  },
  {
    id: 8,
    title: "울릉도 트레킹",
    date: "2024.08.15 - 2024.08.18",
    location: "독도・울릉도",
    image: image9,
  },
  {
    id: 9,
    title: "대구 근대골목 투어",
    date: "2024.08.20 - 2024.08.22",
    location: "근대문화골목・김광석거리",
    image: image10,
  },
  {
    id: 10,
    title: "광주 예술여행",
    date: "2024.09.01 - 2024.09.03",
    location: "국립아시아문화전당・양림동",
    image: image11,
  },
  {
    id: 11,
    title: "인천 차이나타운",
    date: "2024.09.10 - 2024.09.12",
    location: "차이나타운・월미도",
    image: image12,
  },
  {
    id: 12,
    title: "대전 와인 투어",
    date: "2024.09.15 - 2024.09.17",
    location: "대전와인터널・성심당",
    image: image13,
  },
  {
    id: 13,
    title: "천안 독립기념관",
    date: "2024.09.20 - 2024.09.22",
    location: "독립기념관・유관순열사사적지",
    image: image9,
  },
  {
    id: 14,
    title: "아산 온천여행",
    date: "2024.09.25 - 2024.09.27",
    location: "온양온천・외암민속마을",
    image: image10,
  },
  {
    id: 15,
    title: "원주 치악산 등반",
    date: "2024.10.01 - 2024.10.03",
    location: "치악산・강원감영",
    image: image11,
  },
  {
    id: 16,
    title: "충주 호수 여행",
    date: "2024.10.05 - 2024.10.07",
    location: "충주호・탄금대",
    image: image12,
  },
  {
    id: 17,
    title: "제천 약초시장",
    date: "2024.10.10 - 2024.10.12",
    location: "약초시장・의림지",
    image: image13,
  },
  {
    id: 18,
    title: "서산 해미읍성",
    date: "2024.10.15 - 2024.10.17",
    location: "해미읍성・간월암",
    image: image9,
  },
  {
    id: 19,
    title: "당진 왜목마을",
    date: "2024.10.20 - 2024.10.22",
    location: "왜목마을・삽교호",
    image: image10,
  },
  {
    id: 20,
    title: "보령 머드축제",
    date: "2024.10.25 - 2024.10.27",
    location: "대천해수욕장・무창포",
    image: image11,
  },
  {
    id: 21,
    title: "익산 미륵사지",
    date: "2024.11.01 - 2024.11.03",
    location: "미륵사지・왕궁리유적",
    image: image12,
  },
  {
    id: 22,
    title: "정읍 내장산",
    date: "2024.11.05 - 2024.11.07",
    location: "내장산・정읍사공원",
    image: image13,
  },
  {
    id: 23,
    title: "김제 벽골제",
    date: "2024.11.10 - 2024.11.12",
    location: "벽골제・금산사",
    image: image9,
  },
  {
    id: 24,
    title: "나주 영산강 투어",
    date: "2024.11.15 - 2024.11.17",
    location: "영산강・나주향교",
    image: image10,
  },
  {
    id: 25,
    title: "순천만 생태공원",
    date: "2024.11.20 - 2024.11.22",
    location: "순천만・낙안읍성",
    image: image11,
  },
  {
    id: 26,
    title: "담양 죽녹원",
    date: "2024.11.25 - 2024.11.27",
    location: "죽녹원・메타세쿼이아길",
    image: image12,
  },
  {
    id: 27,
    title: "곡성 기차마을",
    date: "2024.12.01 - 2024.12.03",
    location: "섬진강기차마을・도림사",
    image: image13,
  },
  {
    id: 28,
    title: "구례 산수유마을",
    date: "2024.12.05 - 2024.12.07",
    location: "산수유마을・화엄사",
    image: image9,
  },
];

function AITravelCourse() {
  const [activeMenu, setActiveMenu] = useState("share");
  const [shareVisibleCount, setShareVisibleCount] = useState(6);
  const [myTravelVisibleCount, setMyTravelVisibleCount] = useState(6);
  const navigate = useNavigate();

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    // 스크롤 위치 계산
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 스크롤이 하단에서 100px 이내일 때 추가 로드
    if (documentHeight - (scrollY + windowHeight) < 100) {
      if (activeMenu === "share" && shareVisibleCount < sharedCourses.length) {
        setShareVisibleCount((prev) =>
          Math.min(prev + 6, sharedCourses.length)
        );
      } else if (
        activeMenu === "myTravel" &&
        myTravelVisibleCount < myTravelCourses.length
      ) {
        setMyTravelVisibleCount((prev) =>
          Math.min(prev + 6, myTravelCourses.length)
        );
      }
    }
  }, [activeMenu, shareVisibleCount, myTravelVisibleCount]);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    if (menu === "share") {
      setShareVisibleCount(6);
    } else {
      setMyTravelVisibleCount(6);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        <SideMenu activeMenu={activeMenu} onMenuClick={handleMenuClick} />

        <div className="ai-travel__main-content">
          <div className="ai-travel__course-section">
            <div className="ai-travel__section-header">
              <h2>
                {activeMenu === "share" ? "여행코스 공유" : "나만의 여행코스"}
              </h2>
            </div>
            <div className="ai-travel__course-grid">
              {visibleCourses.map((course) => (
                <div key={course.id} className="ai-travel__course-card">
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
}

export default AITravelCourse;
