import React, { useState, useEffect } from "react";
import "./MyPageWithdrawal.css";
import "./MyPageCalendar.css";
import MyPageSideBar from "./MyPageSideBar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

// YYYYMMDD -> YYYY-MM-DD 형식으로 변환하는 헬퍼 함수
const formatApiDate = (dateStr) => {
  if (!dateStr || dateStr.length !== 8) return null; // 유효하지 않은 형식은 null 반환
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
};

// 날짜를 하루 더하기 위한 헬퍼 함수
const addOneDay = (dateStr) => {
  const date = new Date(dateStr); // 이제 'YYYY-MM-DD' 형식이 들어오므로 정상 동작
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const MyPageCalendar = () => {
  const [festivals, setFestivals] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(5);
  const { member } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { name, profileImageUrl } = location.state || {};

  // 데이터 페칭
  useEffect(() => {
    if (!member) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }

    fetch(`http://localhost:8080/mypage/mycalendar`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw res;
        }
        return res.json();
      })
      .then((data) => {
        console.log("서버로부터 받은 원본 데이터:", data);

        const formattedData = data.map((festival) => ({
          ...festival,
          startDate: formatApiDate(festival.startDate),
          endDate: formatApiDate(festival.endDate),
        }));

        console.log("형식이 변환된 데이터:", formattedData);
        setFestivals(formattedData);
      })
      .catch((err) => {
        console.error("찜한 축제 목록 조회 에러:", err);
        err.text().then((errorMessage) => {
          console.error("서버 에러 메시지:", errorMessage);
          alert("데이터를 불러오는 데 실패했습니다. 콘솔을 확인해주세요.");
        });
      });
  }, [member, navigate]);

  // 찜 해제 핸들러 (수정 필요 없음)
  const handleUnfavorite = (contentId) => {
    if (!window.confirm("정말로 찜 해제 하시겠습니까?")) {
      return;
    }

    fetch(`http://localhost:8080/mypage/favorites/${contentId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          alert("찜 해제되었습니다.");
          setFestivals((prevFestivals) =>
            prevFestivals.filter((festival) => festival.contentId !== contentId)
          );
        } else {
          throw res;
        }
      })
      .catch((err) => {
        console.error("찜 해제 에러:", err);
        err.text().then((errorMessage) => {
          console.error("서버 에러 메시지:", errorMessage);
          alert("찜 해제에 실패했습니다. 콘솔을 확인해주세요.");
        });
      });
  };

  // FullCalendar용 이벤트 데이터 가공
  const calendarEvents = festivals.map((festival) => ({
    title: festival.title,
    start: festival.startDate, // 이제 'YYYY-MM-DD' 형식
    end: addOneDay(festival.endDate), // addOneDay 함수가 정상적으로 동작
    extendedProps: {
      contentId: festival.contentId,
    },
  }));

  // 페이지네이션 로직 (수정 필요 없음)
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentFestivals = festivals.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(festivals.length / postsPerPage);

  return (
    <div className="page-container">
      <main className="main-content">
        <MyPageSideBar name={name} profileImageUrl={profileImageUrl} />
        <section className="withdrawal-section">
          <div className="profile-header">
            <h1>내가 찜한 축제</h1>
            <p>내가 찜한 축제 목록입니다.</p>
          </div>

          <div className="mycalendar-wrapper">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              eventClick={(info) => {
                navigate(`/festival/${info.event.extendedProps.contentId}`);
              }}
              height="650px"
              locale="ko"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek",
              }}
            />
          </div>

          <br />
          <br />

          {/* 찜한 축제 목록 렌더링 부분 (수정 필요 없음) */}
          <div className="festival-list-section">
            <h2>내가 찜한 축제 목록 ({festivals.length}개)</h2>
            <div className="festival-list">
              {currentFestivals.length > 0 ? (
                currentFestivals.map((festival) => (
                  <div key={festival.contentId} className="festival-item">
                    <span
                      className="festival-name"
                      onClick={() =>
                        navigate(`/festival/${festival.contentId}`)
                      }
                    >
                      {festival.title}
                    </span>
                    <button
                      className="festival-btn"
                      onClick={() => handleUnfavorite(festival.contentId)}
                    >
                      찜 해제
                    </button>
                  </div>
                ))
              ) : (
                <p>찜한 축제가 없습니다.</p>
              )}
            </div>

            {/* 페이지네이션 (수정 필요 없음) */}
            {festivals.length > 0 && (
              <div className="pagination">
                {/* ... 페이지네이션 버튼들 ... */}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MyPageCalendar;
