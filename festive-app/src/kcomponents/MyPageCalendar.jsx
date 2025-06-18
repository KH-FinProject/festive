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
        </div>
    );
};

export default FestiveWebsite;