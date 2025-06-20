// import React, { useState } from 'react';
import '../myPage/MyPageWithdrawal.css';
import './FestiveCalendar.css';
import { useEffect, useState } from 'react';
import Title from './Title.jsx';

const FestiveCalendar = () => {
    // 축제 목록 상태
    const [festivals, setFestivals] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4; // 페이지당 4개씩 표시

    // 페이지네이션 계산
    const totalPages = Math.ceil(festivals.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentFestivals = festivals.slice(startIndex, startIndex + itemsPerPage);

    // 예시 축제 목록 데이터
    useEffect(() => {
        // 실제로는 API 호출이 들어갈 부분
        const mockFestivals = [
            {
                id: 1,
                title: "서울 벚꽃축제",
                location: "여의도 한강공원",
                date: "2025.04.05 - 2025.04.15",
                image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=300&h=200&fit=crop",
                status: "진행중"
            },
            {
                id: 2,
                title: "부산 바다축제",
                location: "해운대 해수욕장",
                date: "2025.07.20 - 2025.07.25",
                image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=200&fit=crop",
                status: "예정"
            },
            {
                id: 3,
                title: "전주 한옥마을 축제",
                location: "전주 한옥마을",
                date: "2025.05.01 - 2025.05.07",
                image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
                status: "진행중"
            },
            {
                id: 4,
                title: "제주 유채꽃축제",
                location: "제주 성산일출봉",
                date: "2025.04.10 - 2025.04.20",
                image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=300&h=200&fit=crop",
                status: "진행중"
            },
            {
                id: 5,
                title: "경주 문화축제",
                location: "경주 불국사",
                date: "2025.09.15 - 2025.09.22",
                image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
                status: "예정"
            },
            {
                id: 6,
                title: "강릉 커피축제",
                location: "강릉 안목해변",
                date: "2025.10.01 - 2025.10.07",
                image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",
                status: "예정"
            },
            {
                id: 7,
                title: "대구 치킨축제",
                location: "대구 두류공원",
                date: "2025.06.15 - 2025.06.20",
                image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&h=200&fit=crop",
                status: "예정"
            },
            {
                id: 8,
                title: "인천 차이나타운 축제",
                location: "인천 차이나타운",
                date: "2025.08.10 - 2025.08.15",
                image: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=300&h=200&fit=crop",
                status: "예정"
            },
            {
                id: 9,
                title: "광주 김치축제",
                location: "광주 국립아시아문화전당",
                date: "2025.11.01 - 2025.11.07",
                image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop",
                status: "예정"
            }
        ];
        setFestivals(mockFestivals);
    }, []);

    // handlePageChange 함수를 App 컴포넌트에 추가
    const handlePageChange = (pageNumber) => {
        // 페이지 번호가 유효한 범위 내에 있는지 확인
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);

            // 페이지 변경 시 스크롤을 맨 위로 이동 (선택사항)
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    // 축제 클릭 핸들러
    const handleFestivalClick = (festivalId) => {
        // 실제로는 React Router로 상세페이지 이동
        console.log(`축제 ${festivalId} 상세페이지로 이동`);
        // navigate(`/festival/${festivalId}`);
    };

    return (
        <div className="app-container">

            <Title />

            {/* Main Content */}
            <main className="main-content">
                {/* Left Calendar Section */}
                <aside className="calendar-section">
                    <div className="calendar-header">
                        <h2>일정 관리</h2>
                    </div>
                    <div className="calendar-container">
                        {/* FullCalendar API가 들어갈 자리 */}
                        <div className="fullcalendar-placeholder">
                            <p>FullCalendar API 연동 예정</p>
                            <div className="calendar-mock">
                                <div className="calendar-grid">
                                    {[...Array(35)].map((_, i) => (
                                        <div key={i} className="calendar-day">
                                            {i > 6 && i < 32 ? i - 6 : ''}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Content Section */}
                <section className="content-section">
                    {/* 축제 그리드 - 현재 페이지의 축제들만 표시 */}
                    <div className="calendar-festivals-grid">
                        {currentFestivals.map((festival) => (
                            <div
                                key={festival.id}
                                className="calendar-festival-card"
                                onClick={() => handleFestivalClick(festival.id)}
                            >
                                <div className="calendar-festival-image-container">
                                    <img
                                        src={festival.image}
                                        alt={festival.title}
                                        className="calendar-festival-image"
                                    />
                                    <div className={`calendar-festival-status ${festival.status === '진행중' ? 'active' : 'upcoming'}`}>
                                        {festival.status}
                                    </div>
                                </div>

                                <div className="calendar-festival-info">
                                    <h3 className="calendar-festival-title">{festival.title}</h3>
                                    <p className="calendar-festival-location">
                                        <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                        {festival.location}
                                    </p>
                                    <p className="calendar-festival-date">
                                        <svg className="calendar-icon" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        {festival.date}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <button
                                className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                이전
                            </button>

                            <div className="pagination-numbers">
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index + 1}
                                        className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                                        onClick={() => handlePageChange(index + 1)}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                다음
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default FestiveCalendar;