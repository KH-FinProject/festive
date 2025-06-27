import React, { useState, useEffect } from 'react';
import './MyPageMyPost.css';
import MyPageSideBar from './MyPageSideBar';
import { useNavigate } from 'react-router-dom';

const MyPageMyPost = () => {
    const [posts, setPosts] = useState([]);
    // const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    const memberNo = localStorage.getItem('memberNo');

    useEffect(() => {
        // if (!memberNo) {
        //     navigate('/signin');
        //     return;
        // }
        fetch(`http://localhost:8080/mypage/posts?memberNo=${memberNo}`)
            .then(res => res.json())
            .then(data => setPosts(data))
            .catch(err => console.error(err));
    }, [memberNo]);

    return (
        <div className="page-container">
            <main className="main-content">
                <MyPageSideBar />
                <section className="withdrawal-section">
                    <div className="profile-header">
                        <h1>내가 쓴 게시글 및 댓글</h1>
                        <p>내가 쓴 게시글을 목록입니다.</p>
                    </div>
                    <div className="mypage-tabs">
                        <button className="mypage-tab active">게시글 {posts.length}</button>
                        <button className="mypage-tab" onClick={() => navigate('/mypage/mycomment')}>
                            댓글
                        </button>
                    </div>
                    <div className="posts-list">
                        {posts.map((post) => (
                            <div key={post.boardNo} className="post-item">
                                <div className="post-id">#{post.boardNo}</div>
                                <div className="post-content">
                                    <div className="post-title">{post.title}</div>
                                    <div className="post-meta">
                                        <span className="nickname">{post.nickname}</span>
                                        <span className="date">
                                            {new Date(post.createDate)
                                                .toLocaleString('ko-KR')}
                                        </span>
                                    </div>
                                </div>
                                <div className="post-stats">
                                    <span className="likes">♥{post.likes}</span>
                                    <span className="views">👁{post.views}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Pagination 생략 or 구현 */}
                </section>
            </main>
        </div>
    );
};

export default MyPageMyPost;
