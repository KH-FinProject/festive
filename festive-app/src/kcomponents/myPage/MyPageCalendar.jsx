import React, { useState, useEffect } from 'react';
import './MyPageWithdrawal.css';
import './MyPageCalendar.css';
import MyPageSideBar from './MyPageSideBar';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from "../../store/useAuthStore";

// 날짜 형식 변환 헬퍼 함수
const formatApiDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return null;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
};

// FullCalendar용 날짜 +1일 헬퍼 함수
const addOneDay = (dateStr) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
};

// 랜덤 색상 생성 함수 추가
const getRandomColor = () => {
    const colors = [
        '#60a5fa', '#34d399', '#fbbf24', '#f87171',
        '#a78bfa', '#fb7185', '#4ade80', '#38bdf8'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
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
            .then(res => {
                if (!res.ok) throw res;
                return res.json();
            })
            .then(data => {
                const formattedData = data.map(festival => ({
                    ...festival,
                    // 날짜 형식을 YYYY-MM-DD로 미리 변환
                    formattedStartDate: formatApiDate(festival.startDate),
                    formattedEndDate: formatApiDate(festival.endDate)
                }));
                setFestivals(formattedData);
            })
            .catch(err => {
                console.error("찜한 축제 목록 조회 에러:", err);
                err.text().then(errorMessage => {
                    console.error("서버 에러 메시지:", errorMessage);
                    alert('데이터를 불러오는 데 실패했습니다. 콘솔을 확인해주세요.');
                });
            });
    }, [member, navigate]);

    // 찜 해제 핸들러
    const handleUnfavorite = (contentId) => {
        if (!window.confirm("정말로 찜 해제 하시겠습니까?")) {
            return;
        }
        fetch(`http://localhost:8080/mypage/favorites/${contentId}`, {
            method: 'DELETE',
            credentials: 'include',
        })
            .then(res => {
                if (res.ok) {
                    alert("찜 해제되었습니다.");
                    setFestivals(prev => prev.filter(f => f.contentId !== contentId));
                } else {
                    throw res;
                }
            })
            .catch(err => {
                console.error("찜 해제 에러:", err);
                err.text().then(errorMessage => {
                    console.error("서버 에러 메시지:", errorMessage);
                    alert('찜 해제에 실패했습니다. 콘솔을 확인해주세요.');
                });
            });
    };

    // FullCalendar용 이벤트 데이터 가공 - 랜덤 색상 적용
    const calendarEvents = festivals.map(festival => ({
        title: festival.title,
        start: festival.formattedStartDate,
        end: addOneDay(festival.formattedEndDate),
        backgroundColor: getRandomColor(),  // 랜덤 배경색
        borderColor: getRandomColor(),      // 랜덤 테두리색
        extendedProps: {
            contentId: festival.contentId
        }
    }));

    // 페이지네이션 로직
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentFestivals = festivals.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(festivals.length / postsPerPage);

    const handleFestivalClick = (contentId) => {
        navigate(`/festival/detail/${contentId}`);
    };

    return (
        <div className="page-container">
            <main className="main-content">
                <MyPageSideBar name={name} profileImageUrl={profileImageUrl} />
                <section className="withdrawal-section">
                    <div className="profile-header">
                        <h1>내가 찜한 축제</h1>
                        <p>내가 찜한 {festivals.length}개의 축제입니다.</p>
                    </div>

                    <div className="mycalendar-wrapper">
                        {/* FullCalendar 컴포넌트 */}
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={calendarEvents}
                            eventClick={(info) => navigate(`/festival/detail/${info.event.extendedProps.contentId}`)}
                            height="650px"
                            locale="ko"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,dayGridWeek'
                            }}
                        />
                    </div>

                    <br /><br />

                    {/* 찜한 축제 목록 렌더링 부분 */}
                    <div className="myfestival-list-section">
                        <div className="festival-list">
                            {currentFestivals.length > 0 ? (
                                currentFestivals.map((festival) => (
                                    <div key={festival.contentId} className="festival-item-card">
                                        <div className="myfestival-info">
                                            <span className="myfestival-name"
                                                onClick={() => handleFestivalClick(festival.contentId)}>
                                                {festival.title}
                                            </span>
                                            <p className="myfestival-details">
                                                {festival.formattedStartDate} ~ {festival.formattedEndDate}
                                            </p>
                                            <button
                                                className="festival-btn"
                                                onClick={() => handleUnfavorite(festival.contentId)}
                                            >
                                                찜 해제
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>찜한 축제가 없습니다.</p>
                            )}
                        </div>

                        {/* 페이지네이션 */}
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