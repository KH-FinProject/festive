import React, { useState } from 'react';
import { Search, Sun, Star, MessageCircle } from 'lucide-react';
import './MyPageWithdrawal.css';
import './MyPageMyComment.css';
import MyPageSideBar from './MyPageSideBar';
import { Navigate, useNavigate } from 'react-router-dom';

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

    const navigate = useNavigate();

    return (
        <div className="page-container">

            <main className="main-content">
                <MyPageSideBar />

                <section className="withdrawal-section">

                    {/* Content Area */}
                    <div className="profile-header">
                        <h1>내가 쓴 게시글 및 댓글</h1>
                        <p>내가 쓴 댓글 목록입니다.</p>
                    </div>
                    <br />
                    <div className="mypage-tabs">
                        <button className="mypage-tab" onClick={() => navigate('/mypage/mypost')}>
                            게시글 7
                        </button>
                        <button className="mypage-tab active">댓글 22</button>

                        <br />
                    </div>
                    <br />
                    {/* comments List */}
                    <div className="mypage-comments-list">
                        {posts.map((post) => (
                            <div key={post.id} className="mypage-comment-item">
                                <div className="mypage-comment-content">
                                    <div className="mypage-comment-avatar">이</div>
                                    <div className="mypage-comment-details">
                                        <div className="mypage-comment-meta">
                                            <span className="mypage-comment-author">{post.author}</span>
                                            <span className="mypage-comment-date">{post.date}</span>
                                        </div>
                                        <p className="mypage-comment-text">{post.content}</p>
                                        <div className="mypage-comment-actions">
                                            <button className="mypage-comment-btn">수정</button>
                                            <button className="mypage-comment-btn">삭제</button>
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