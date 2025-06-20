import React, { useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageMyPost.css';
import MyPageSideBar from './MyPageSideBar';
import { Navigate, useNavigate } from 'react-router-dom';


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
    const navigate = useNavigate();

    return (
        <div className="page-container">

            <main className="main-content">
                <MyPageSideBar />

                <section className="withdrawal-section">

                    {/* Content Area */}
                    <div className="profile-header">
                        <h1>내가 쓴 게시글 및 댓글</h1>
                        <p>내가 쓴 게시글을 목록입니다.</p>
                    </div>
                    <br />
                    <div className="mypage-tabs">
                        <button className="mypage-tab active">게시글 7</button>
                        <button className="mypage-tab" onClick={() => navigate('/mypage/mycomment')}>
                            댓글 22
                        </button>

                        <br />
                    </div>
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