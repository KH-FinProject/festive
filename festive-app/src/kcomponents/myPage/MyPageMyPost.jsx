import React, { useState, useEffect } from 'react';
import './MyPageMyPost.css';
import MyPageSideBar from './MyPageSideBar';
import { useNavigate } from 'react-router-dom';

const MyPageMyPost = () => {
    const [posts, setPosts] = useState([]);
    const navigate = useNavigate();

    const accessToken = JSON.parse(localStorage.getItem("auth-store"))?.state?.accessToken;

    useEffect(() => {
        if (!accessToken) {
            console.error("Access token not found.");
            return;
        }

        fetch(`http://localhost:8080/mypage/post`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch posts");
                return res.json();
            })
            .then((data) => setPosts(data))
            .catch((err) => console.error(err));
    }, [accessToken]);

    return (
        <div className="page-container">
            <main className="main-content">
                <MyPageSideBar />
                <section className="withdrawal-section">
                    <div className="profile-header">
                        <h1>내가 쓴 게시글 및 댓글</h1>
                        <p>내가 쓴 게시글 목록입니다.</p>
                    </div>
                    <div className="mypage-tabs">
                        <button className="mypage-tab active">게시글 {posts.length}</button>
                        <button className="mypage-tab" onClick={() => navigate('/mypage/mycomment')}>
                            댓글
                        </button>
                    </div>
                    <div className="posts-list">
                        {posts.length === 0 ? (
                            <p className="no-posts">작성한 게시글이 없습니다.</p>
                        ) : (
                            posts.map((post) => (
                                <div
                                    key={post.boardNo}
                                    className="post-item"
                                    // 이 부분을 추가하여 클릭 시 해당 게시글로 이동
                                    onClick={() => navigate(`/wagle/${post.boardNo}`)}
                                >
                                    <div className="post-id">#{post.boardNo}</div>
                                    <div className="post-content">
                                        <div className="post-title">{post.boardTitle}</div>
                                        <div className="post-meta">
                                            <span className="nickname">{post.memberNickname}</span>
                                            <span className="date">
                                                {new Date(post.boardCreateDate).toLocaleString('ko-KR')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="post-stats">
                                        <span className="likes">♥{post.boardLikeCount}</span>
                                        <span className="views">👁{post.boardViewCount}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default MyPageMyPost;