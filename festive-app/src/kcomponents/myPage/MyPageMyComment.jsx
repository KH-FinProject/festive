import React, { useEffect, useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageMyComment.css';
import MyPageSideBar from './MyPageSideBar';
import { useNavigate } from 'react-router-dom';

const MyPageMyComment = () => {
    const [comments, setComments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // 페이지네이션 구현 시 필요
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = JSON.parse(localStorage.getItem("auth-store"))?.state?.accessToken;

        if (!accessToken) {
            alert('로그인이 필요합니다.');
            navigate('/signin'); // 로그인 페이지로 리디렉션
            return;
        }

        fetch(`http://localhost:8080/mypage/comment`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`, // Authorization 헤더에 토큰을 포함합니다.
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (!res.ok) {
                    // HTTP 오류 응답 처리
                    // 401 Unauthorized 등 특정 상태 코드에 대한 추가 처리도 가능
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                // CommentDto의 필드명과 XML 쿼리 결과를 매핑
                // COMMENT_WRITE_DATE -> commentCreateDate
                // MEMBER_NICKNAME -> memberNickname
                // COMMENT_CONTENT -> commentContent
                // LIKE_COUNT -> likes (CommentDto에 likes 필드를 추가해야 함)
                setComments(data.map(comment => ({
                    commentNo: comment.commentNo,
                    commentContent: comment.commentContent,
                    commentCreateDate: comment.commentCreateDate,
                    boardNo: comment.boardNo,
                    memberNickname: comment.memberNickname, // XML 쿼리의 MEMBER_NICKNAME과 매칭
                    likes: comment.likeCount // XML 쿼리의 LIKE_COUNT와 매칭 (CommentDto에 likes 필드 필요)
                })));
            })
            .catch(err => {
                console.error('댓글 불러오기 실패:', err);
                alert('댓글 목록을 불러오는데 실패했습니다. 다시 시도해주세요.');
            });
    }, [navigate]); // navigate는 useEffect의 의존성 배열에 추가하는 것이 좋습니다.

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
                        {comments.length > 0 ? (
                            comments.map(comment => (
                                <div
                                    key={comment.commentNo}
                                    className="mypage-comment-item"
                                    // 이 부분을 추가하여 클릭 시 해당 게시글로 이동
                                    onClick={() => navigate(`/wagle/${comment.boardNo}`)}
                                >
                                    <div className="mypage-comment-content">
                                        <div className="mypage-comment-avatar">{comment.memberNickname ? comment.memberNickname.charAt(0) : '이'}</div>
                                        <div className="mypage-comment-details">
                                            <div className="mypage-comment-meta">
                                                <span className="mypage-comment-nickname">{comment.memberNickname}</span>
                                                <span className="mypage-comment-date">
                                                    {new Date(comment.commentCreateDate).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="mypage-comment-text">{comment.commentContent}</p>
                                            <div className="mypage-comment-actions">
                                                <span className="likes">❤ {comment.likes}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-comments-message">작성한 댓글이 없습니다.</p>
                        )}
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