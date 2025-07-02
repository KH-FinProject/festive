import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const CustomerBoard = ({
  currentPage,
  searchType,
  searchQuery,
  onTotalPagesChange,
}) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 게시글 목록 가져오기
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: "7",
      });

      if (searchType && searchQuery) {
        params.append("searchType", searchType);
        params.append("searchKeyword", searchQuery);
      }

      const response = await fetch(
        `http://localhost:8080/api/customer/boards?${params}`
      );

      if (!response.ok) {
        throw new Error("게시글을 불러오는데 실패했습니다.");
      }

      const data = await response.json();

      console.log("고객센터 데이터:", data); // 디버깅용

      // 데이터 형식 변환 (inquiryList 사용)
      const formattedPosts = (data.inquiryList || []).map((post) => {
        console.log("개별 게시글:", post); // 디버깅용
        return {
          id: post.boardNo,
          title: post.boardTitle,
          author: post.memberNickname || "익명",
          date: post.boardCreateDate
            ? new Date(post.boardCreateDate)
                .toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                .replace(/\. /g, ".")
                .replace(".", ".")
                .slice(0, -1)
            : "날짜 없음",
          likes: post.boardLikeCount || 0,
          views: post.boardViewCount || 0,
          status: post.inquiryStatus || "대기중", // 고객센터 전용 상태 정보
          hasAnswer: post.hasAnswer || false, // 답변 여부
        };
      });

      setPosts(formattedPosts);

      // 총 페이지 수 업데이트
      if (onTotalPagesChange) {
        onTotalPagesChange(data.totalPages || 1);
      }
    } catch (err) {
      console.error("게시글 로딩 실패:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, searchType, searchQuery]);

  const handleItemClick = (id) => {
    navigate(`/customer-center/${id}`);
    setTimeout(() => window.scrollTo(0, 0), 0);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="customer-board-list">
        <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
          게시글을 불러오는 중...
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="customer-board-list">
        <div style={{ textAlign: "center", padding: "50px", color: "#e74c3c" }}>
          {error}
        </div>
      </div>
    );
  }

  // 게시글이 없는 경우
  if (posts.length === 0) {
    return (
      <div className="customer-board-list">
        <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
          등록된 게시글이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="customer-board-list">
      {posts.map((post) => (
        <div
          className="customer-board-item"
          key={post.id}
          onClick={() => handleItemClick(post.id)}
          style={{ cursor: "pointer" }}
        >
          <div className="customer-board-title">
            {post.title}
            <span
              className={`status-badge ${
                post.hasAnswer ? "answered" : "waiting"
              }`}
              style={{
                marginLeft: "10px",
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold",
                backgroundColor: post.hasAnswer ? "#e8f5e8" : "#fff3e0",
                color: post.hasAnswer ? "#2e7d32" : "#f57c00",
                border: `1px solid ${post.hasAnswer ? "#a5d6a7" : "#ffcc02"}`,
              }}
            >
              {post.status}
            </span>
          </div>
          <div className="customer-board-meta">
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E"
              alt="프로필"
              className="customer-profile-img"
            />
            <span className="customer-board-author">{post.author}</span>
            <span className="customer-board-date">{post.date}</span>
            <div className="customer-board-views">
              <FontAwesomeIcon icon={faEye} />
              <span>{post.views}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomerBoard;
