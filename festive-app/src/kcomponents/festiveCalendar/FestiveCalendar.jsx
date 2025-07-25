import '../myPage/MyPageWithdrawal.css';
import './FestiveCalendar.css';
import { useEffect, useState } from 'react';
import Title from './Title.jsx';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';

import Pagination from "../myPage/Pagination.jsx";

const PAGE_SIZE = 4;

function formatDate(yyyymmdd) {
    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
}

const FestiveCalendar = () => {
    const [festivals, setFestivals] = useState([]);
    const [selectedDateFestivals, setSelectedDateFestivals] = useState([]);
    const [clickedDate, setClickedDate] = useState(() => getTodayStr());
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    // 페이지네이션 관련 계산
    const totalPages = Math.ceil(selectedDateFestivals.length / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const currentFestivals = selectedDateFestivals.slice(startIndex, startIndex + PAGE_SIZE);

    // 페이지 번호 버튼을 그룹화(5개씩만 보여주기)
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
            setIsLoading(true); // 로딩 시작
            const response = await fetch(
                `https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${serviceKey}&MobileOS=ETC&MobileApp=Festive&_type=json&eventStartDate=20210101&arrange=A&numOfRows=1700&pageNo=1`
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

            // 시작 날짜순 정렬
            festivalCards.sort((a, b) => {
                const statusPriority = {
                    '진행중': 1,
                    '예정': 2,
                    '종료': 3,
                };
                const aPriority = statusPriority[a.status];
                const bPriority = statusPriority[b.status];

                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }
                if (a.status === '예정') {
                    return new Date(a.startDate) - new Date(b.startDate);
                } else {
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
            setCurrentPage(1); // 날짜 바뀌면 1페이지로 초기화
        } catch (error) {
            console.error('축제 데이터 로딩 실패:', error);
        } finally {
            setIsLoading(false); // 로딩 끝
        }
    }

    // 페이지 이동 함수
    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

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
                            {/* 로딩 중일 때 "로딩 중..." 메시지 표시 */}
                            {isLoading ? (
                                <div className="loading-message">
                                    로딩 중
                                </div>
                            ) : (
                                currentFestivals.map((festival) => (
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
                                ))
                            )}
                        </div>

                        {selectedDateFestivals.length > 0 && totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={goToPage}
                                className="festival-pagination"
                                pageGroupSize={pageGroupSize}
                                pageGroupStart={pageGroupStart}
                                pageGroupEnd={pageGroupEnd}
                            />
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FestiveCalendar;
