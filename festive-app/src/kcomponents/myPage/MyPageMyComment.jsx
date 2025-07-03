import React, { useEffect, useState } from "react";
import "./MyPageWithdrawal.css";
import "./MyPageMyComment.css";
import MyPageSideBar from "./MyPageSideBar";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import Pagination, { usePagination } from "./Pagination";

const PAGE_SIZE = 5;

const MyPageMyComment = () => {
  const { member } = useAuthStore();
  const [comments, setComments] = useState([]);
  const navigate = useNavigate();

  const location = useLocation();
  const { name, profileImageUrl } = location.state || {};

  // 커스텀 페이지네이션 훅
  const {
    currentPage,
    totalPages,
    goToPage,
    currentItems
  } = usePagination({
    totalItems: comments.length,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    if (!member) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }

    fetch("http://localhost:8080/mypage/comment", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error(err));
  }, [member, navigate]); // navigate 추가 권장

  return (
    <div className="page-container">
      <main className="main-content">
        <MyPageSideBar
          name={name}
          profileImageUrl={profileImageUrl}
        />
        <section className="withdrawal-section">
          <div className="profile-header">
            <h1>내가 쓴 게시글 및 댓글</h1>
            <p>내가 쓴 댓글 목록입니다.</p>
          </div>
          <br />
          <div className="mypage-tabs">
            <button
              className="mypage-tab"
              onClick={() =>
                navigate("/mypage/mypost", {
                  state: { name, profileImageUrl },
                })
              }
            >
              게시글
            </button>
            <button className="mypage-tab active">
              댓글 {comments.length}
            </button>
          </div>

          <br />
          <div className="mypage-comments-list paginated-list">
            {comments.length > 0 ? (
              currentItems(comments).map((comment) => (
                <div
                  key={comment.commentNo}
                  className="mypage-comment-item"
                  onClick={() => navigate(`/wagle/${comment.boardNo}`)}
                >
                  <div className="mypage-comment-content">
                    <div className="mypage-comment-avatar">
                      {comment.memberNickname
                        ? comment.memberNickname.charAt(0)
                        : "이"}
                    </div>
                    <div className="mypage-comment-details">
                      <div className="mypage-comment-meta">
                        <span className="mypage-comment-nickname">
                          {comment.memberNickname}
                        </span>
                        <span className="mypage-comment-date">
                          {new Date(comment.commentCreateDate).toLocaleString()}
                        </span>
                      </div>
                      <p className="mypage-comment-text">
                        {comment.commentContent}
                      </p>
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
          {/* 페이지네이션 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            className="wagle-pagination"
          />
        </section>
      </main>
    </div>
  );
};

export default MyPageMyComment;
