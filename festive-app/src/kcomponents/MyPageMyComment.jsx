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
        </div>
    );
};

export default MyPageMyComment;