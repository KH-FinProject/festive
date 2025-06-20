import React, { useState } from "react";
import "./AdminBoardManagement.css";
import "./AdminCommon.css";
import { Link, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSideBar";

const AdminBoardManagement = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      type: "공지",
      title: "안녕하세요 저는 공지입니다",
      author: "생애쇼",
      date: "2505.06.13 14:30",
      views: 123,
      likes: 96,
      checked: false,
    },
    {
      id: 2,
      type: "공지",
      title: "안녕하세요 저는 공지입니다",
      author: "생애쇼",
      date: "2505.06.13 14:30",
      views: 123,
      likes: 96,
      checked: false,
    },
    {
      id: 3,
      type: "일반",
      title: "부산 바다축제 라인업 미쳤다 진짜!!! 누구 같이 갈 사람?",
      postNumber: "#1204",
      author: "축제러버",
      date: "2505.06.12 20:15",
      views: 456,
      likes: 78,
      checked: false,
    },
    {
      id: 4,
      type: "일반",
      title: "부산 바다축제 라인업 미쳤다 진짜!!! 누구 같이 갈 사람?",
      postNumber: "#1204",
      author: "축제러버",
      date: "2505.06.12 20:15",
      views: 456,
      likes: 78,
      checked: false,
    },
    {
      id: 5,
      type: "일반",
      title: "부산 바다축제 라인업 미쳤다 진짜!!! 누구 같이 갈 사람?",
      postNumber: "#1204",
      author: "축제러버",
      date: "2505.06.12 20:15",
      views: 456,
      likes: 78,
      checked: false,
    },
    {
      id: 6,
      type: "일반",
      title: "부산 바다축제 라인업 미쳤다 진짜!!! 누구 같이 갈 사람?",
      postNumber: "#1204",
      author: "축제러버",
      date: "2505.06.12 20:15",
      views: 456,
      likes: 78,
      checked: false,
    },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setPosts(posts.map((post) => ({ ...post, checked: newSelectAll })));
  };

  const handleSelectPost = (id) => {
    setPosts(
      posts.map((post) =>
        post.id === id ? { ...post, checked: !post.checked } : post
      )
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= 10; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="admin-management-container">
      <div className="management-content">
        {/* Sidebar */}
        <AdminSidebar />
        <main className="admin-main">
          <div className="admin-header">
            <h1 className="admin-title">게시판 관리</h1>
          </div>

          <div className="board-content">
            <div className="post-list">
              {posts.map((post) => (
                <div key={post.id} className="post-item">
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={post.checked}
                      onChange={() => handleSelectPost(post.id)}
                    />
                  </div>

                  <div className="post-badge">
                    <span
                      className={`badge ${
                        post.type === "공지" ? "notice" : "general"
                      }`}
                    >
                      {post.type}
                    </span>
                  </div>

                  <div className="post-info">
                    {post.postNumber && (
                      <span className="post-number">{post.postNumber}</span>
                    )}
                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-meta">
                      <span className="author">{post.author}</span>
                      <span className="date">{post.date}</span>
                    </div>
                  </div>

                  <div className="post-stats">
                    <span className="views">+{post.views}</span>
                    <span className="likes">♥{post.likes}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="board-actions">
              <div className="action-buttons">
                <Link to="/admin/write" className="btn-notice-write">
                  공지 작성
                </Link>
                <button className="btn-secondary">삭제하기</button>
              </div>
            </div>

            <div className="pagination">
              <button className="pagination-btn nav-btn">‹</button>
              {renderPagination()}
              <button className="pagination-btn nav-btn">›</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminBoardManagement;
