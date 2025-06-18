import React, { useState } from 'react';
import { Search, Sun, Star, MessageCircle } from 'lucide-react';
import './MyPageWithdrawal.css';
import './MyPageMyComment.css';

const MyPageMyComment = () => {
    const [currentPage, setCurrentPage] = useState(1);

    const posts = [
        {
            id: 1,
            author: "사전작가이셈통",
            date: "2024.04.13 16:45",
            content: "사진 정말 잘 봤으셨네요! 어떤 카메라 쓰셨나요? 저도 이런 우정에게 가서 찍어보고고 하는데 힘 들 알려주세요~~",
            likes: 12,
            comments: 1
        },
        {
            id: 2,
            author: "사전작가이셈통",
            date: "2024.04.13 16:45",
            content: "사진 정말 잘 봤으셨네요! 어떤 카메라 쓰셨나요? 저도 이런 우정에게 가서 찍어보고고 하는데 힘 들 알려주세요~~",
            likes: 12,
            comments: 1
        },
        {
            id: 3,
            author: "사전작가이셈통",
            date: "2024.04.13 16:45",
            content: "사진 정말 잘 봤으셨네요! 어떤 카메라 쓰셨나요? 저도 이런 우정에게 가서 찍어보고고 하는데 힘 들 알려주세요~~",
            likes: 12,
            comments: 1
        },
        {
            id: 4,
            author: "사전작가이셈통",
            date: "2024.04.13 16:45",
            content: "사진 정말 잘 봤으셨네요! 어떤 카메라 쓰셨나요? 저도 이런 우정에게 가서 찍어보고고 하는데 힘 들 알려주세요~~",
            likes: 12,
            comments: 1
        },
        {
            id: 5,
            author: "사전작가이셈통",
            date: "2024.04.13 16:45",
            content: "사진 정말 잘 봤으셨네요! 어떤 카메라 쓰셨나요? 저도 이런 우정에게 가서 찍어보고고 하는데 힘 들 알려주세요~~",
            likes: 12,
            comments: 1
        }
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
                        <button>내가 찜한 축제</button>
                        <button className="active">내가 쓴 게시글 및 댓글</button>
                        <button>회원 탈퇴</button>
                    </div>
                </aside>

                <section className="withdrawal-section">

                    {/* Content Area */}
                    <div className="profile-header">
                        <h1>내가 쓴 게시글 및 댓글</h1>
                        <p>내가 쓴 게시글을 확인합니다.</p>
                    </div>

                    <div className="tabs">
                        <button className="tab active">게시글 7</button>
                        <button className="tab">댓글 22</button>
                    </div>
                    <br />
                    {/* comments List */}
                    <div className="comments-list">
                        {posts.map((post) => (
                            <div key={post.id} className="comment-item">
                                <div className="comment-content">
                                    <div className="comment-avatar">이</div>
                                    <div className="comment-details">
                                        <div className="comment-meta">
                                            <span className="comment-author">{post.author}</span>
                                            <span className="comment-date">{post.date}</span>
                                        </div>
                                        <p className="comment-text">{post.content}</p>
                                        <div className="comment-actions">
                                            <button className="comment-btn">수정</button>
                                            <button className="comment-btn">삭제</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <br />
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

                </section>
            </main>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-left">
                            <div className="footer-logo">FESTIVE</div>
                            <div className="footer-info">
                                <p>서울특별시 강서구 양천로 99, 롯데마트 대방점 - 양천구</p>
                                <p>이메일 : rhckdl01@gmail.com</p>
                            </div>
                        </div>
                        <div className="footer-center">
                            <div className="footer-links">
                                <a href="#">회사소개</a>
                                <a href="#">개인정보처리방침</a>
                                <a href="#">이용약관</a>
                            </div>
                            <div className="footer-partners">
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='30' viewBox='0 0 60 30'%3E%3Crect width='60' height='30' fill='%23e0e0e0'/%3E%3Ctext x='30' y='18' text-anchor='middle' font-size='8' fill='%23666'%3EOPENAPI%3C/text%3E%3C/svg%3E" alt="OpenAPI" />
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='30' viewBox='0 0 60 30'%3E%3Crect width='60' height='30' fill='%23e0e0e0'/%3E%3Ctext x='30' y='15' text-anchor='middle' font-size='6' fill='%23666'%3EFullCalendar%3C/text%3E%3C/svg%3E" alt="FullCalendar" />
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='30' viewBox='0 0 60 30'%3E%3Crect width='60' height='30' fill='%23e0e0e0'/%3E%3Ctext x='30' y='15' text-anchor='middle' font-size='8' fill='%23666'%3E기상청%3C/text%3E%3C/svg%3E" alt="기상청" />
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='30' viewBox='0 0 60 30'%3E%3Crect width='60' height='30' fill='%23e0e0e0'/%3E%3Ctext x='30' y='12' text-anchor='middle' font-size='6' fill='%23666'%3E한국관광공사%3C/text%3E%3C/svg%3E" alt="한국관광공사" />
                            </div>
                        </div>
                        <div className="footer-right">
                            <div className="contact-info">
                                <div className="phone">1588-1234</div>
                                <div className="hours">09:00 ~ 18:00(토요일, 공휴일 휴무)</div>
                                <div className="lunch">11:30타임 ~ 점심 휴무 정보</div>
                                <div className="copyright">Copyright © MEDIA DESIGHNER ALL RIGHTS RESERVED</div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MyPageMyComment;