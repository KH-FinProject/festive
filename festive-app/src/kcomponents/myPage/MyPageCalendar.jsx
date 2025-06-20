import React, { useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageCalendar.css';
import MyPageSideBar from './MyPageSideBar';

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
                <MyPageSideBar />

                <section className="withdrawal-section">

                    <div className="profile-header">
                        <h1>내가 찜한 축제</h1>
                        <p>내가 찜한 축제 목록입니다.</p>
                    </div>

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