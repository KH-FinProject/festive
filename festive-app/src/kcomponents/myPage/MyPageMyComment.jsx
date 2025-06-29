import React, { useEffect, useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageMyComment.css';
import MyPageSideBar from './MyPageSideBar';
import { useNavigate } from 'react-router-dom';

const MyPageMyComment = () => {
    const [comments, setComments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    useEffect(() => {
        const memberNo = localStorage.getItem('memberNo');
        // if (!memberNo) {
        //     alert('로그인이 필요합니다.');
        //     navigate('/signin');
        //     return;
        // }

        fetch(`http://localhost:8080/mypage/comment?memberNo=${memberNo}`)
            .then(res => res.json())
            .then(data => {
                setComments(data);
            })
            .catch(err => {
                console.error('댓글 불러오기 실패:', err);
            });
    }, []);

    return (
        <div className="page-container">
            <main className="main-content">
                <MyPageSideBar />
                <section className="withdrawal-section">
                    <div className="profile-header">
                        <h1>내가 쓴 게시글 및 댓글</h1>
                        <p>내가 쓴 댓글 목록입니다.</p>
                    </div>
                    <br />
                    <div className="mypage-tabs">
                        <button className="mypage-tab" onClick={() => navigate('/mypage/mypost')}>
                            게시글
                        </button>
                        <button className="mypage-tab active">댓글 {comments.length}</button>
                    </div>

                    <br />
                    <div className="mypage-comments-list">
                        {comments.map(comment => (
                            <div key={comment.commentNo} className="mypage-comment-item">
                                <div className="mypage-comment-content">
                                    <div className="mypage-comment-avatar">이</div>
                                    <div className="mypage-comment-details">
                                        <div className="mypage-comment-meta">
                                            <span className="mypage-comment-nickname">{comment.nickname}</span>
                                            <span className="mypage-comment-date">
                                                {new Date(comment.writeDate).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="mypage-comment-text">{comment.content}</p>
                                        <div className="mypage-comment-actions">
                                            <span className="likes">❤ {comment.likes}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <br />
                    <div className="pagination">
                        <button className="page-btn">{'<'}</button>
                        <button className="page-btn">{'<<'}</button>
                        {[1, 2, 3, 4, 5].map(page => (
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
