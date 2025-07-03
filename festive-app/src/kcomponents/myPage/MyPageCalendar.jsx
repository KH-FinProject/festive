import React, { useState, useEffect, useMemo } from "react";
import "./MyPageWithdrawal.css";
import "./MyPageCalendar.css";
import MyPageSideBar from "./MyPageSideBar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import Pagination, { usePagination } from "./Pagination";

const PAGE_SIZE = 2;

const MONTHLY_PASTEL_PALETTES = {
    1: ["#ffe9ec", "#fff1f7", "#ffeef4", "#ffd6e9"],
    2: ["#eaf6ff", "#e6faff", "#d9f1ff", "#cfe8ff"],
    3: ["#ffffe0", "#fffbe6", "#fcffed", "#f6ffe9"],
    4: ["#eafff1", "#f6ffed", "#e8ffe9", "#e9fff7"],
    5: ["#eaeaff", "#f2eaff", "#faeaff", "#ffeafd"],
    6: ["#ffe9e3", "#fff7e6", "#ffe7c7", "#fffaf0"],
    7: ["#e9f9ff", "#e5f6ff", "#f7f9ff", "#f2f8ff"],
    8: ["#f6f6f6", "#fcfaff", "#fff6fb", "#fdf6ff"],
    9: ["#f9e2ae", "#ffe0ac", "#ffd1dc", "#fffbe6"],
    10: ["#e2f0cb", "#b6efd4", "#e3ffe3", "#e6ffe9"],
    11: ["#ffe6fa", "#f8cdda", "#e2cfcf", "#f6dfeb"],
    12: ["#c7ceea", "#c2dfff", "#a2d5f2", "#b5ead7"],
};

const formatApiDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return null;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
};
const addOneDay = (dateStr) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
};
const getMonthFromDate = (dateStr) => {
    if (!dateStr) return 1;
    return Number(dateStr.slice(5, 7));
};

const MyPageCalendar = () => {
    const [festivals, setFestivals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState("");
    const { member } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { name, profileImageUrl } = location.state || {};

    // 검색어가 반영된 축제 필터링 (검색어 없으면 전체)
    const filteredFestivals = useMemo(() => {
        if (!searchKeyword.trim()) return festivals;
        return festivals.filter(festival =>
            festival.title.toLowerCase().includes(searchKeyword.trim().toLowerCase())
        );
    }, [festivals, searchKeyword]);

    // usePagination 훅 사용 (필터링된 축제 기준)
    const {
        currentPage,
        totalPages,
        goToPage,
        currentItems
    } = usePagination({
        totalItems: filteredFestivals.length,
        pageSize: PAGE_SIZE,
    });

    // 월별로 축제들을 그룹핑
    const eventsByMonth = useMemo(() => {
        const grouped = {};
        festivals.forEach(festival => {
            const month = getMonthFromDate(festival.formattedStartDate);
            if (!grouped[month]) grouped[month] = [];
            grouped[month].push(festival);
        });
        return grouped;
    }, [festivals]);

    const calendarEvents = useMemo(() => {
        let events = [];
        Object.entries(eventsByMonth).forEach(([month, festList]) => {
            const palette = MONTHLY_PASTEL_PALETTES[month] || MONTHLY_PASTEL_PALETTES[1];
            festList.forEach((festival, idx) => {
                const color = palette[idx % palette.length];
                events.push({
                    title: festival.title,
                    start: festival.formattedStartDate,
                    end: festival.formattedEndDate ? addOneDay(festival.formattedEndDate) : null,
                    backgroundColor: color,
                    borderColor: color,
                    textColor: "#333",
                    className: "custom-event",
                    extendedProps: {
                        contentId: festival.contentId,
                        originalData: festival
                    }
                });
            });
        });
        return events;
    }, [eventsByMonth]);

    useEffect(() => {
        if (!member) {
            alert("로그인이 필요한 서비스입니다.");
            navigate("/signin");
            return;
        }
        const fetchFestivals = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`http://localhost:8080/mypage/mycalendar`, {
                    credentials: "include",
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const formattedData = data.map(festival => ({
                    ...festival,
                    formattedStartDate: formatApiDate(festival.startDate),
                    formattedEndDate: formatApiDate(festival.endDate)
                }));
                setFestivals(formattedData);
            } catch (error) {
                console.error("찜한 축제 목록 조회 에러:", error);
                alert('데이터를 불러오는 데 실패했습니다. 콘솔을 확인해주세요.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFestivals();
    }, [member, navigate]);

    const handleUnfavorite = async (contentId) => {
        if (!window.confirm("정말로 찜 해제 하시겠습니까?")) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:8080/mypage/favorites/${contentId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (response.ok) {
                alert("찜 해제되었습니다.");
                setFestivals(prev => prev.filter(f => f.contentId !== contentId));
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("찜 해제 에러:", error);
            alert('찜 해제에 실패했습니다. 콘솔을 확인해주세요.');
        }
    };

    const handleFestivalClick = (contentId) => {
        navigate(`/festival/detail/${contentId}`);
    };
    const handleEventClick = (info) => {
        const contentId = info.event.extendedProps.contentId;
        if (contentId) {
            navigate(`/festival/detail/${contentId}`);
        }
    };

    if (isLoading) {
        return (
            <div className="page-container">
                <main className="main-content">
                    <MyPageSideBar name={name} profileImageUrl={profileImageUrl} />
                    <section className="withdrawal-section">
                        <div className="profile-header">
                            <h1>내가 찜한 축제</h1>
                            <p>로딩 중...</p>
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
                        <p>내가 찜한 {festivals.length}개의 축제입니다.</p>
                    </div>
                    {/* FullCalendar 컴포넌트 */}
                    <div className="mycalendar-wrapper">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                            initialView="dayGridMonth"
                            events={calendarEvents}
                            eventClick={handleEventClick}
                            height="auto"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,listMonth'
                            }}
                            locale="ko"
                            eventDisplay="block"
                            dayMaxEvents={3}
                            moreLinkClick="popover"
                        />
                    </div>
                    <br /><br />
                    {/* ===== 찜한 축제 목록 검색창 추가 ===== */}
                    <div className="myfestival-search-bar" style={{
                        display: "flex", alignItems: "center", marginBottom: 16
                    }}>
                        <input
                            type="text"
                            placeholder="축제명을 검색하세요"
                            value={searchKeyword}
                            onChange={e => setSearchKeyword(e.target.value)}
                            style={{
                                width: "100%",
                                maxWidth: 320,
                                padding: "10px 14px",
                                border: "1px solid #e2e8f0",
                                borderRadius: 8,
                                fontSize: 16,
                                outline: "none",
                                background: "#fafafa"
                            }}
                        />
                    </div>
                    {/* ===== 찜한 축제 목록 ===== */}
                    <div className="myfestival-list-section">
                        <div className="festival-list paginated-list">
                            {currentItems(filteredFestivals).length > 0 ? (
                                currentItems(filteredFestivals).map((festival) => (
                                    <div key={festival.contentId} className="festival-item-card">
                                        <div className="myfestival-info">
                                            <div className="myfestival-left">
                                                <span
                                                    className="myfestival-name"
                                                    onClick={() => handleFestivalClick(festival.contentId)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {festival.title}
                                                </span>
                                                <p className="myfestival-details">
                                                    {festival.formattedStartDate} ~ {festival.formattedEndDate}
                                                </p>
                                            </div>
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
                        {filteredFestivals.length > 0 && totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={goToPage}
                                className="festival-pagination"
                            />
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default MyPageCalendar;
