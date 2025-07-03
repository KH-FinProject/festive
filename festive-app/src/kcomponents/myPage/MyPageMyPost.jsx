import React, { useState, useEffect } from "react";
import "./MyPageMyPost.css";
import MyPageSideBar from "./MyPageSideBar";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import Pagination, { usePagination } from "./Pagination";

const PAGE_SIZE = 7;

const MyPageMyPost = () => {
  // 게시글 데이터 상태
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  const { member } = useAuthStore();

  // location state에서 이름, 프로필 이미지 가져오기
  const location = useLocation();
  const { name, profileImageUrl } = location.state || {};

  // 페이지네이션 커스텀 훅 사용
  const {
    currentPage,
    totalPages,
    goToPage,
    currentItems
  } = usePagination({
    totalItems: posts.length,
    pageSize: PAGE_SIZE,
  });

  // 최초 마운트 시 게시글 불러오기
  useEffect(() => {
    if (!member) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }
    fetch(`http://localhost:8080/mypage/post`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error(err));
  }, [member, navigate]);

  return (
    <div className="page-container">
      <main className="main-content">
        {/* 사이드바 */}
        <MyPageSideBar name={name} profileImageUrl={profileImageUrl} />
        <section className="withdrawal-section">
          {/* 상단 프로필 및 탭 */}
          <div className="profile-header">
            <h1>내가 쓴 게시글 및 댓글</h1>
            <p>내가 쓴 게시글 목록입니다.</p>
          </div>
          <div className="mypage-tabs">
            <button className="mypage-tab active">
              게시글 {posts.length}
            </button>
            <button
              className="mypage-tab"
              onClick={() =>
                navigate("/mypage/mycomment", {
                  state: { name, profileImageUrl },
                })
              }
            >
              댓글
            </button>
          </div>

          {/* 게시글 리스트 */}
          <div className="posts-list paginated-list">
            {posts.length === 0 ? (
              <p className="no-posts">작성한 게시글이 없습니다.</p>
            ) : (
              currentItems(posts).map((post) => (
                <div
                  key={post.boardNo}
                  className="post-item"
                  onClick={() => navigate(`/wagle/${post.boardNo}`)}
                >
                  <div className="post-id">#{post.boardNo}</div>
                  <div className="post-content">
                    <div className="post-title">{post.boardTitle}</div>
                    <div className="post-meta">
                      <span className="nickname">{post.memberNickname}</span>
                      <span className="date">
                        {new Date(post.boardCreateDate).toLocaleString("ko-KR")}
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            className="general-board-pagination"
          />
        </section>
      </main>
    </div>
  );
};

export default MyPageMyPost;
