// src/components/MyPage/MyPageCalendar.jsx
import React, { useState, useEffect } from 'react';
import './MyPageWithdrawal.css'; // 스타일 유지
import './MyPageCalendar.css';   // 캘린더 관련 스타일
import MyPageSideBar from './MyPageSideBar';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from "../../store/useAuthStore"; // Zustand 스토어 예시

// 날짜를 하루 더하기 위한 헬퍼 함수
const addOneDay = (dateStr) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0]; // yyyy-MM-dd 형식으로 반환
};

const MyPageCalendar = () => {
    const [festivals, setFestivals] = useState([]); // 서버에서 받아온 축제 목록 전체
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage] = useState(5); // 한 페이지에 보여줄 축제 수
    const { member } = useAuthStore(); // Zustand 등에서 사용자 정보 가져오기
    const navigate = useNavigate();

    const location = useLocation();
    const { name, profileImageUrl } = location.state || {}; // 사이드바용 props

    // 데이터 페칭
    useEffect(() => {
        if (!member) {
            alert("로그인이 필요한 서비스입니다.");
            navigate("/signin");
            return;
        }

        fetch(`http://localhost:8080/mypage/mycalendar`, {
            credentials: "include", // accessToken이 httpOnly 쿠키일 경우 필수
        })
            .then(res => {
                if (!res.ok) {
                    throw res;
                }
                return res.json();
            })
            .then(data => {
                setFestivals(data);
            })
            .catch(err => {
                err.text().then(errorMessage => {
                    alert('데이터를 불러오는 데 실패했습니다. 콘솔을 확인해주세요.');
                    console.error("서버 에러 메시지:", errorMessage);
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
            credentials: 'include', // 반드시 유지!
        })
            .then(res => {
                if (res.ok) {
                    alert("찜 해제되었습니다.");
                    setFestivals(prevFestivals =>
                        prevFestivals.filter(festival => festival.contentId !== contentId)
                    );
                } else {
                    throw res;
                }
            })
            .catch(err => {
                err.text().then(errorMessage => {
                    alert('찜 해제에 실패했습니다. 콘솔을 확인해주세요.');
                    console.error("서버 에러 메시지:", errorMessage);
                });
            });
    };

    // FullCalendar용 이벤트 데이터 가공
    const calendarEvents = festivals.map(festival => ({
        title: festival.title,
        start: festival.startDate,
        end: addOneDay(festival.endDate), // 종료일을 FullCalendar에 맞게 하루 추가
        extendedProps: {
            contentId: festival.contentId
        }
    }));

    // 페이지네이션 로직
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentFestivals = festivals.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(festivals.length / postsPerPage);

    return (
        <div className="page-container">
            <main className="main-content">
                <MyPageSideBar
                    name={name}
                    profileImageUrl={profileImageUrl}
                />
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
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,dayGridWeek'
                            }}
                        />
                    </div>

                    <br /><br />

                    <div className="festival-list-section">
                        <h2>내가 찜한 축제 목록 ({festivals.length}개)</h2>
                        <div className="festival-list">
                            {currentFestivals.length > 0 ? (
                                currentFestivals.map((festival) => (
                                    <div key={festival.contentId} className="festival-item">
                                        <span className="festival-name" onClick={() => navigate(`/festival/${festival.contentId}`)}>
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

                        {/* 페이지네이션 */}
                        {festivals.length > 0 && (
                            <div className="pagination">
                                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>{'<<'}</button>
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>{'<'}</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={`page-btn ${page === currentPage ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>{'>'}</button>
                                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>{'>>'}</button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default MyPageCalendar;
