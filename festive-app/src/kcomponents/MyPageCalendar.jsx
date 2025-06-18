import React, { useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageCalendar.css';

const FestiveWebsite = () => {
    const [currentPage, setCurrentPage] = useState(1);

    const festivals = [
        { name: '축제명', date: '6월 1일' },
        { name: '축제명', date: '6월 15일' },
        { name: '축제명', date: '6월 15일' },
        { name: '축제명', date: '6월 15일' },
        { name: '축제명', date: '6월 15일' }
    ];

    return (
        <div className="page-container">
            <header className="header">
                <div className="header-content">
                    <div className="logo">festive</div>
                    <nav className="nav-links">
                        <a href="#">이달의 축제</a>
                        <a href="#">축제달력</a>
                        <a href="#">지역별 축제</a>
                        <a href="#">AI 여행코스 추천</a>
                        <a href="#">고객센터</a>
                        <a href="#">부스참가신청</a>
                    </nav>
                    <div className="weather-auth">
                        <span className="weather">-7°C</span>
                        <button>Sign In</button>
                        <button>Sign Up</button>
                    </div>
                </div>
            </header>

            <main className="main-content">
                <aside className="sidebar">
                    <div className="profile">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E" alt="프로필" />
                        <p>김성환</p>
                    </div>
                    <div className="menu-buttons">
                        <button>프로필 수정</button>
                        <button>개인정보 수정</button>
                        <button>비밀번호 수정</button>
                        <button className="active">내가 찜한 축제</button>
                        <button>내가 쓴 게시글 및 댓글</button>
                        <button>회원 탈퇴</button>
                    </div>
                </aside>

                <section className="withdrawal-section">

                    <h1>내가 찜한 축제</h1>
                    <p>내가 찜한 축제 목록입니다.<br /><br /></p>

                    <div className="content-body">
                        {/* Calendar Section */}
                        <div className="calendar-section">
                            <div id="calendar-container">
                                {/* FullCalendar will be mounted here */}
                                <div className="calendar-placeholder">
                                    <p>FullCalendar API가 여기에 들어갑니다</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Festival List Section - Moved below calendar */}
                    <div className="festival-list-section">
                        <h2>내가 찜한 축제</h2>
                        <div className="festival-list">
                            {festivals.map((festival, index) => (
                                <div key={index} className="festival-item">
                                    <span className="festival-name">{festival.name}</span>
                                    <button className="festival-btn">찜 해제</button>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="pagination">
                            <button className="page-btn">{'<'}</button>
                            <button className="page-btn">{'<<'}</button>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(page => (
                                <button
                                    key={page}
                                    className={`page-btn ${page === currentPage ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}
                            <button className="page-btn">{'>'}</button>
                            <button className="page-btn">{'>>'}</button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <div className="footer-content">
                    <div>
                        <h3>FESTIVE</h3>
                        <p>서울특별시 강서구 상암산업로 99, 월드컵사북</p>
                        <p>이메일 : rkdlsrh811@gmail.com</p>
                    </div>
                    <div>
                        <p>회사소개 | 개인정보처리방침 | 이용약관</p>
                    </div>
                    <div>
                        <p className="tel">1588-1234</p>
                        <p>09:00 ~ 18:00 (토요일, 공휴일 휴무)</p>
                        <p className="copyright">Copyright © MEDIA DESIGNER</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default FestiveWebsite;