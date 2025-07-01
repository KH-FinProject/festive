import '../myPage/MyPageWithdrawal.css';
import './FestiveCalendar.css';
import { useEffect, useState } from 'react';
import Title from './Title.jsx';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';

function formatDate(yyyymmdd) {
    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

// 오늘 날짜 yyyy-mm-dd 반환 함수
function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
}

const FestiveCalendar = () => {
    const [festivals, setFestivals] = useState([]);
    const [selectedDateFestivals, setSelectedDateFestivals] = useState([]);
    // 초기값을 오늘 날짜로!
    const [clickedDate, setClickedDate] = useState(() => getTodayStr());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const navigate = useNavigate();

    const totalPages = Math.ceil(selectedDateFestivals.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentFestivals = selectedDateFestivals.slice(startIndex, startIndex + itemsPerPage);

    // 페이지 번호 버튼을 그룹화하여 5개씩만 보여주기
    const pageGroupSize = 5;
    const pageGroupStart = Math.floor((currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
    const pageGroupEnd = Math.min(pageGroupStart + pageGroupSize - 1, totalPages);

    useEffect(() => {
        const today = new Date();
        const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
        const filterDate = today.toISOString().slice(0, 10);
        fetchFestivalEventsByDate(yyyymmdd, filterDate);
    }, []);

    async function fetchFestivalEventsByDate(dateStr, filterDate) {
        const serviceKey = import.meta.env.VITE_TOURAPI_KEY;

        try {
            const response = await fetch(
                `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=Festive&_type=json&eventStartDate=19960205&arrange=A&numOfRows=10000&pageNo=1`
            );
            const result = await response.json();
            const items = result.response.body.items.item || [];

            const today = new Date();
            const filterTarget = new Date(filterDate);

            const festivalCards = items.map((item, idx) => {
                const start = new Date(formatDate(item.eventstartdate));
                const end = item.eventenddate ? new Date(formatDate(item.eventenddate)) : start;

                let status = '예정';
                if (today >= start && today <= end) {
                    status = '진행중';
                } else if (today > end) {
                    status = '종료';
                }

                return {
                    id: item.contentid || idx + 1,
                    title: item.title,
                    location: item.addr1 || '미정',
                    date: `${formatDate(item.eventstartdate)} - ${formatDate(item.eventenddate)}`,
                    image: item.firstimage || '/logo.png',
                    status,
                    startDate: formatDate(item.eventstartdate),
                    endDate: item.eventenddate ? formatDate(item.eventenddate) : formatDate(item.eventstartdate),
                };
            });

            // 시작 날짜순 정렬 추가
            festivalCards.sort((a, b) => {
                const statusPriority = {
                    '진행중': 1,
                    '예정': 2,
                    '종료': 3,
                };

                const aPriority = statusPriority[a.status];
                const bPriority = statusPriority[b.status];

                // 상태 우선순위 비교
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }

                // 상태가 같을 때
                if (a.status === '예정') {
                    // 예정인 경우: 시작일 오름차순
                    return new Date(a.startDate) - new Date(b.startDate);
                } else {
                    // 그 외: 시작일 내림차순
                    return new Date(b.startDate) - new Date(a.startDate);
                }
            });

            const filteredFestivals = festivalCards.filter((festival) => {
                const start = new Date(festival.startDate);
                const end = new Date(festival.endDate);
                return filterTarget >= start && filterTarget <= end;
            });

            setFestivals(festivalCards);
            setSelectedDateFestivals(filteredFestivals);
        } catch (error) {
            console.error('축제 데이터 로딩 실패:', error);
        }
    }

    const handleDateClick = (info) => {
        const clicked = info.dateStr;
        setClickedDate(clicked);
        fetchFestivalEventsByDate(clicked.replace(/-/g, ''), clicked);
        setCurrentPage(1);
    };

    const groupedByDate = {};
    festivals.forEach((festival) => {
        const start = new Date(festival.startDate);
        const end = new Date(festival.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.toISOString().split('T')[0];
            groupedByDate[key] = (groupedByDate[key] || 0) + 1;
        }
    });

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            // window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDatesSet = (arg) => {
        const calendarDate = arg.start;
        const today = new Date();

        if (
            calendarDate.getFullYear() === today.getFullYear() &&
            calendarDate.getMonth() === today.getMonth()
        ) {
            const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
            const filterDate = today.toISOString().slice(0, 10);
            fetchFestivalEventsByDate(yyyymmdd, filterDate);

            // 클릭된 날짜를 오늘 날짜로 설정
            setClickedDate(today.toISOString().slice(0, 10));
            setCurrentPage(1);
        }
    };

    const handleEventClick = (info) => {
        const clickedDate = info.event.startStr;
        setClickedDate(clickedDate);
        fetchFestivalEventsByDate(clickedDate.replace(/-/g, ''), clickedDate);
        setCurrentPage(1);
        info.jsEvent.preventDefault();
    };

    function formatKoreanDate(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
    }

    // 1. 색상을 결정하는 함수 추가
    function getEventColor(count) {
        const lowRanges = [
            [0, 10], [31, 40], [61, 70], [91, 100]
        ];
        const mediumRanges = [
            [11, 20], [41, 50], [71, 80], [101, 110]
        ];
        const highRanges = [
            [21, 30], [51, 60], [81, 90], [111, 120]
        ];

        for (const [min, max] of lowRanges) {
            if (count >= min && count <= max) {
                return 'skyblue';
            }
        }
        for (const [min, max] of mediumRanges) {
            if (count >= min && count <= max) {
                return 'lightseagreen';
            }
        }
        for (const [min, max] of highRanges) {
            if (count >= min && count <= max) {
                return 'orange';
            }
        }
        return 'lightgray';
    }

    const groupedCalendarEvents = Object.entries(groupedByDate).map(([date, count]) => ({
        title: `${count}개`,
        date,
        backgroundColor: getEventColor(count),
        borderColor: getEventColor(count),
        textColor: 'black'
    }));

    function getEventClassNames(count) {
        const lowRanges = [
            [0, 10], [41, 50], [81, 90], [121, 130], [161, 170], [201, 210]
        ];
        const mediumoneRanges = [
            [11, 20], [51, 60], [91, 100], [131, 140], [171, 180], [211, 220]
        ];
        const mediumtwoRanges = [
            [21, 30], [61, 70], [101, 110], [141, 150], [181, 190], [221, 230]
        ];
        const highRanges = [
            [31, 40], [71, 80], [111, 120], [151, 160], [191, 200], [231, 240]
        ];

        for (const [min, max] of lowRanges) {
            if (count >= min && count <= max) {
                return 'festival-low';
            }
        }
        for (const [min, max] of mediumoneRanges) {
            if (count >= min && count <= max) {
                return 'festival-mediumone';
            }
        }
        for (const [min, max] of mediumtwoRanges) {
            if (count >= min && count <= max) {
                return 'festival-mediumtwo';
            }
        }
        for (const [min, max] of highRanges) {
            if (count >= min && count <= max) {
                return 'festival-high';
            }
        }
        return 'festival-default';
    }

    const handleFestivalClick = (festivalId) => {
        navigate(`/festival/detail/${festivalId}`);
    };

    return (
        <div className="app-container">
            <Title />
            <main className="main-content">
                <aside className="calendar-section">
                    <div className="calendar-container">
                        <div style={{ width: '90%', margin: '30px auto' }}>
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                locale="ko"
                                events={groupedCalendarEvents}
                                dateClick={handleDateClick}
                                datesSet={handleDatesSet}
                                eventClick={handleEventClick}
                                eventClassNames={(arg) => {
                                    const countMatch = arg.event.title.match(/(\d+)개/);
                                    const count = countMatch ? parseInt(countMatch[1]) : 0;
                                    return getEventClassNames(count);
                                }}
                            />
                        </div>
                    </div>
                </aside>

                <section className="content-section">
                    {clickedDate && (
                        <div className="selected-date-heading">
                            <p style={{ fontSize: "24px" }}>
                                {formatKoreanDate(clickedDate)}의 축제
                            </p>
                        </div>
                    )}

                    <div>
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
                                            <span className="icon-wrapper">
                                                <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                            <span className="location-text">{festival.location}</span>
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

                        {totalPages > 1 && (
                            <div className="pagination-container">
                                <button
                                    className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(1)}
                                    disabled={currentPage === 1}
                                >
                                    &laquo;
                                </button>
                                <button
                                    className={`pagination-btn ${pageGroupStart === 1 ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(pageGroupStart - 1)}
                                    disabled={pageGroupStart === 1}
                                >
                                    &lsaquo;
                                </button>
                                <div className="pagination-numbers">
                                    {Array.from({ length: pageGroupEnd - pageGroupStart + 1 }, (_, idx) => {
                                        const pageNumber = pageGroupStart + idx;
                                        return (
                                            <button
                                                key={pageNumber}
                                                className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                                                onClick={() => handlePageChange(pageNumber)}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    className={`pagination-btn ${pageGroupEnd === totalPages ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(pageGroupEnd + 1)}
                                    disabled={pageGroupEnd === totalPages}
                                >
                                    &rsaquo;
                                </button>
                                <button
                                    className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    &raquo;
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FestiveCalendar;
