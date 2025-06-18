import React, { useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageMyPost.css';

const MyPageMyPost = () => {
    const [posts] = useState([
        {
            id: 1204,
            title: "부산 바다축제 라인업 미쳤다 진짜!!! 누구 같이 갈 사람?",
            author: "축제러버",
            date: "2505.06.12 20:15",
            likes: 456,
            views: 78
        },
        {
            id: 1204,
            title: "부산 바다축제 라인업 미쳤다 진짜!!! 누구 같이 갈 사람?",
            author: "축제러버",
            date: "2505.06.12 20:15",
            likes: 456,
            views: 78
        },
        {
            id: 1204,
            title: "부산 바다축제 라인업 미쳤다 진짜!!! 누구 같이 갈 사람?",
            author: "축제러버",
            date: "2505.06.12 20:15",
            likes: 456,
            views: 78
        },
        {
            id: 1204,
            title: "부산 바다축제 라인업 미쳤다 진짜!!! 누구 같이 갈 사람?",
            author: "축제러버",
            date: "2505.06.12 20:15",
            likes: 456,
            views: 78
        },
        {
            id: 1204,
            title: "부산 바다축제 라인업 미쳤다 진짜!!! 누구 같이 갈 사람?",
            author: "축제러버",
            date: "2505.06.12 20:15",
            likes: 456,
            views: 78
        }
    ]);

    const [currentPage, setCurrentPage] = useState(1);

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
                    <br />
                    <div className="tabs">
                        <button className="tab active">게시글 7</button>
                        <button className="tab">댓글 22</button>
                    </div>

                    <br />
                    {/* Posts List */}
                    <div className="posts-list">
                        {posts.map((post, index) => (
                            <div key={index} className="post-item">
                                <div className="post-id">#{post.id}</div>
                                <div className="post-content">
                                    <div className="post-title">{post.title}</div>
                                    <div className="post-meta">
                                        <span className="author">{post.author}</span>
                                        <span className="date">{post.date}</span>
                                    </div>
                                </div>
                                <div className="post-stats">
                                    <span className="likes">+{post.likes}</span>
                                    <span className="views">+{post.views}</span>
                                </div>
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

                </section>
            </main>
        </div>
    );
};

export default MyPageMyPost;