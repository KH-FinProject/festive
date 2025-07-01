import React, { useState, useEffect } from 'react';
import './MyPageWithdrawal.css';
import './MyPageCalendar.css';
import MyPageSideBar from './MyPageSideBar';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from "../../store/useAuthStore";

const addOneDay = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
};

const MyPageCalendar = () => {
    const [festivals, setFestivals] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 5;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { member } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { name, profileImageUrl } = location.state || {};

    // 축제 목록 조회
    useEffect(() => {
        if (!member) {
            alert("로그인이 필요한 서비스입니다.");
            navigate("/signin");
            return;
        }
        setLoading(true);
        setError(null);

        fetch(`http://localhost:8080/mypage/mycalendar`, {
            credentials: "include",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
            .then(async res => {
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`HTTP ${res.status}: ${errorText}`);
                }
                return res.json();
            })
            .then(data => {
                // API 응답 데이터 검증 및 정제
                if (Array.isArray(data)) {
                    setFestivals(data.filter(f =>
                        f.contentId && f.title && f.startDate // 필수값 필터
                    ));
                } else {
                    setError('데이터 형식이 올바르지 않습니다.');
                    setFestivals([]);
                }
            })
            .catch(err => {
                setError(err.message || '데이터를 불러오는 데 실패했습니다.');
                setFestivals([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [member, navigate]);

    // 찜 해제
    const handleUnfavorite = async (contentId) => {
        if (!window.confirm("정말로 찜 해제 하시겠습니까?")) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:8080/mypage/favorites/${contentId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert("찜 해제되었습니다.");
                setFestivals(prev =>
                    prev.filter(festival => festival.contentId !== contentId)
                );
            } else {
                const errorText = await response.text();
                alert('찜 해제에 실패했습니다. ' + errorText);
            }
        } catch (err) {
            alert('찜 해제 중 오류가 발생했습니다.');
        }
    };

    // FullCalendar 이벤트 데이터로 변환
    const calendarEvents = festivals.map(festival => ({
        title: festival.title,
        start: festival.startDate,
        end: addOneDay(festival.endDate),
        extendedProps: {
            contentId: festival.contentId
        },
        backgroundColor: '#4285f4',
        borderColor: '#4285f4',
        textColor: '#ffffff'
    }));

    // 페이징 처리
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentFestivals = festivals.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(festivals.length / postsPerPage);

    if (loading) {
        return (
            <div className="page-container">
                <main className="main-content">
                    <MyPageSideBar name={name} profileImageUrl={profileImageUrl} />
                    <section className="withdrawal-section">
                        <div className="profile-header">
                            <h1>내가 찜한 축제</h1>
                            <p>데이터를 불러오는 중...</p>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container">
                <main className="main-content">
                    <MyPageSideBar name={name} profileImageUrl={profileImageUrl} />
                    <section className="withdrawal-section">
                        <div className="profile-header">
                            <h1>내가 찜한 축제</h1>
                            <p style={{ color: 'red' }}>오류: {error}</p>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

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
                            eventClick={info => {
                                navigate(`/festival/${info.event.extendedProps.contentId}`);
                            }}
                            height="650px"
                            locale="ko"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,dayGridWeek'
                            }}
                            eventDisplay="block"
                            dayMaxEvents={3}
                            moreLinkClick="popover"
                        />
                    </div>
                    <br /><br />
                    <div className="festival-list-section">
                        <h2>내가 찜한 축제 목록 ({festivals.length}개)</h2>
                        <div className="festival-list">
                            {currentFestivals.length > 0 ? (
                                currentFestivals.map((festival) => (
                                    <div key={festival.contentId} className="festival-item">
                                        <div className="festival-info">
                                            <span
                                                className="festival-name"
                                                onClick={() => navigate(`/festival/${festival.contentId}`)}
                                                style={{ cursor: 'pointer', color: '#4285f4' }}
                                            >
                                                {festival.title}
                                            </span>
                                            <span className="festival-date">
                                                {festival.startDate} ~ {festival.endDate}
                                            </span>
                                        </div>
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
                        {/* 페이징 */}
                        {festivals.length > 0 && totalPages > 1 && (
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
