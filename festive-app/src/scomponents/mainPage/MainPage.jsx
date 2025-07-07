import React, { useState, useEffect } from "react";
import "./MainPage.css";
import VerticalSlider from "./VerticalSlider.jsx";
import axiosApi from "../../api/axiosAPI";
import { useNavigate } from "react-router-dom";

function MainPage() {
  const [festivals, setFestivals] = useState([]);
  const navigate = useNavigate();

  // 현재 진행중인 축제 리스트를 외부 투어API에서 한 번에 불러오고, 각 축제의 좋아요 수를 조회해 정렬
  useEffect(() => {
    const fetchCurrentFestivals = async () => {
      try {
        // 1. 외부 투어API에서 현재 진행중인 축제 리스트 불러오기
        const serviceKey = import.meta.env.VITE_TOURAPI_KEY;
        const today = new Date();
        const yyyyMMdd = today.toISOString().slice(0, 10).replace(/-/g, "");
        const url = `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&MobileOS=WEB&MobileApp=Festive&_type=json&eventStartDate=${yyyyMMdd}&arrange=A&numOfRows=50&pageNo=1`;
        const res = await fetch(url);
        const data = await res.json();
        const items = data?.response?.body?.items?.item || [];

        // 2. 각 축제별로 좋아요 수 조회 (병렬)
        const festivalsWithLikes = await Promise.all(
          items.map(async (festival) => {
            let likeCount = 0;
            try {
              const likeRes = await axiosApi.get("/festival/detail/likes", {
                params: { contentId: festival.contentid },
              });
              likeCount = likeRes.data;
            } catch {
              likeCount = 0;
            }
            return {
              id: festival.contentid,
              title: festival.title,
              image: festival.firstimage || "/logo.png",
              date: `${festival.eventstartdate?.replace(
                /(\d{4})(\d{2})(\d{2})/,
                "$1.$2.$3"
              )} - ${festival.eventenddate?.replace(
                /(\d{4})(\d{2})(\d{2})/,
                "$1.$2.$3"
              )}`,
              location: festival.addr1 || "장소 미정",
              status: getFestivalStatus(
                festival.eventstartdate,
                festival.eventenddate
              ),
              likeCount,
            };
          })
        );

        // 3. 좋아요 순 내림차순 정렬 후 상위 7개만
        const sorted = festivalsWithLikes
          .sort((a, b) => b.likeCount - a.likeCount)
          .slice(0, 7);
        setFestivals(sorted);
      } catch (err) {
        console.error("진행중인 축제 불러오기 실패:", err);
      }
    };
    fetchCurrentFestivals();
  }, []);

  // 축제 상태 계산 함수
  function getFestivalStatus(start, end) {
    const now = new Date();
    const startDate = new Date(
      `${start?.slice(0, 4)}-${start?.slice(4, 6)}-${start?.slice(6, 8)}`
    );
    const endDate = new Date(
      `${end?.slice(0, 4)}-${end?.slice(4, 6)}-${end?.slice(6, 8)}`
    );
    if (now < startDate) return "예정";
    else if (now > endDate) return "종료";
    else return "진행중";
  }

  // 축제 클릭 핸들러
  const handleFestivalClick = (festivalId) => {
    window.scrollTo(0, 0);
    navigate(`/festival/detail/${festivalId}`);
  };

  return (
    <div>
      <VerticalSlider />
      <section className="top5-section" style={{ marginTop: "48px" }}>
        <h1 style={{ marginBottom: "56px", marginLeft: "48px" }}>
          🔥 인기 축제 TOP 7
        </h1>
        <div className="festival-gallery-section">
          <div className="gallery-grid">
            {festivals.map((festival, index) => (
              <div
                key={festival.id}
                className={`gallery-card ${index === 0 ? "large-card" : ""}`}
                onClick={() => handleFestivalClick(festival.id)}
              >
                <div className="gallery-image-container">
                  <img
                    src={festival.image}
                    alt={festival.title}
                    className="gallery-image"
                  />
                  <div className="gallery-overlay">
                    <div className="gallery-content">
                      <h3 className="gallery-title">{festival.title}</h3>
                      <p className="gallery-date">{festival.date}</p>
                      <p className="gallery-location">{festival.location}</p>
                    </div>
                    <div
                      className={`gallery-status ${
                        festival.status === "진행중" ? "active" : "upcoming"
                      }`}
                    >
                      {festival.status}
                    </div>
                    <div
                      style={{
                        marginTop: "8px",
                        color: "#ff4757",
                        fontWeight: "bold",
                      }}
                    >
                      좋아요 {festival.likeCount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default MainPage;
