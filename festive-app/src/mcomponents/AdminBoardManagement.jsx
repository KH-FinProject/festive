import React, { useEffect, useState } from "react";
import "./AdminBoardManagement.css";
import "./AdminCommon.css";
import { Link } from "react-router-dom";
import AdminSidebar from "./AdminSideBar";
import axiosApi from "../api/axiosAPI";
import Pagination, { usePagination } from "./Pagination";

const AdminBoardManagement = () => {
  const [posts, setPosts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const pageSize = 5;

  // 페이지네이션 훅 사용
  const reportPagination = usePagination({
    totalItems: posts.length,
    pageSize: pageSize,
    initialPage: 1,
  });

  const {
    currentPage,
    totalPages,
    goToPage,
    currentItems,
  } = reportPagination;

  // 현재 페이지 게시글만 가져오기
  const currentPosts = currentItems(posts);

  // 게시글 목록 불러오기 함수 분리 (삭제 후 재사용)
  const fetchPosts = () => {
    axiosApi.get("/admin/board")
      .then((res) => {
        const mapped = res.data.map((post) => ({
          id: post.boardNo,
          type: Number(post.boardCode ?? post.boardTypeNo) === 2 ? "공지" : "일반",
          title: post.boardTitle,
          author: post.memberNickname || "익명",
          date: formatDate(post.boardCreateDate),
          views: post.boardViewCount,
          likes: post.boardLikeCount,
          comments: post.boardCommentCount,
          postNumber: `${post.boardNo}`,
          checked: false,
        }));
        setPosts(mapped);
        setSelectAll(false);
      })
      .catch((err) => {
        console.error("게시글 불러오기 실패", err);
      });
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line
  }, []);

  // 날짜 포맷 (YYYY-MM-DD)
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = ("0" + (d.getMonth() + 1)).slice(-2);
    const dd = ("0" + d.getDate()).slice(-2);
    return `${yyyy}-${mm}-${dd}`;
  }

  // 전체 선택/해제
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setPosts(posts.map((post) => ({ ...post, checked: newSelectAll })));
  };

  // 개별 체크
  const handleSelectPost = (id) => {
    setPosts(posts.map((post) =>
      post.id === id ? { ...post, checked: !post.checked } : post
    ));
  };

  // 선택된 게시글 삭제
  const handleDeleteSelected = async () => {
    const selectedIds = posts.filter((post) => post.checked).map((post) => post.id);

    if (selectedIds.length === 0) {
      alert("삭제할 게시글을 선택하세요.");
      return;
    }

    const confirmed = window.confirm(`${selectedIds.length}개 게시글을 영구적으로 삭제하시겠습니까?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await axiosApi.post("/admin/boardDelete", selectedIds, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 200) {
        alert("삭제가 완료되었습니다.");
        fetchPosts();
      } else {
        alert("삭제 중 오류가 발생했습니다.");
      }
    } catch (err) {
      alert("삭제 실패: " + (err.response?.data || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="admin-management-container">
      <div className="management-content">
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">게시판 관리</h1>
          </div>

          <div className="board-content">
            <div className="post-list paginated-list">
              {/* 헤더(전체 체크박스) */}
              <div className="post-item-header">
                <div className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </div>
                <div className="post-badge">전체 선택</div>
              </div>

              {currentPosts.map((post) => (
                <div key={post.id} className="post-item">
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={post.checked}
                      onChange={() => handleSelectPost(post.id)}
                    />
                  </div>

                  <div className="post-badge">
                    <span className={`badge ${post.type === "공지" ? "notice" : "general"}`}>
                      {post.type}
                    </span>
                  </div>

                  <div className="post-info">
                    {post.postNumber && (
                      <span className="post-number">{post.postNumber}</span>
                    )}
                    <h3 className="post-title">
                      <Link to={`/wagle/${post.id}`} className="post-title-link">
                        {post.title}
                      </Link>
                    </h3>
                    <div className="post-meta">
                      <span className="author">{post.author}</span>
                      <span className="date">{post.date}</span>
                    </div>
                  </div>

                  <div className="post-stats">
                    <span className="views">+{post.views}</span>
                    <span className="likes">♥{post.likes}</span>
                    {/* <span className="comments">💬{post.comments}</span> */}
                  </div>
                </div>
              ))}
            </div>

            <div className="board-actions">
              <div className="action-buttons">
                <Link to="/admin/write" className="btn-notice-write">
                  공지 작성
                </Link>
                <button
                  className="btn-secondary"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                >
                  {isDeleting ? "삭제중..." : "삭제하기"}
                </button>
              </div>
            </div>

            {/* 페이지네이션 */}
            {posts.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                className="custom-pagination"
                showFirstLast={true}
                maxVisiblePages={5}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminBoardManagement;
