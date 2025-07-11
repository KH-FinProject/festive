import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp, faEye, faSearch } from "@fortawesome/free-solid-svg-icons";
import "./GeneralBoard.css";
import { useNavigate } from "react-router-dom";
import Pagination from "./Pagination";
import { checkNicknameForSocialUser } from "../../utils/nicknameCheck";
import axiosApi from "../../api/axiosAPI";

const PAGE_SIZE = 7;

function GeneralBoard({ hideWriteBtn }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState("title");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // 글쓰기 버튼 클릭 핸들러
  const handleWriteClick = async () => {
    const canProceed = await checkNicknameForSocialUser(navigate);
    if (canProceed) {
      navigate("/wagle/write");
    }
  };

  // API에서 게시글 목록 가져오기
  const fetchPosts = async (
    page = 1,
    searchTypeParam = "",
    searchKeywordParam = ""
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        boardTypeNo: "1", // 일반게시판
        page: page.toString(),
        size: PAGE_SIZE.toString(),
      });

      if (searchTypeParam && searchKeywordParam) {
        params.append("searchType", searchTypeParam);
        params.append("searchKeyword", searchKeywordParam);
      }

      const response = await axiosApi.get(`/api/wagle/boards?${params}`);
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;

        // 데이터 형식 변환
        const formattedPosts = data.boardList.map((post) => {
          // 날짜 포맷팅 함수
          const formatDate = (dateString) => {
            if (!dateString) return "날짜 없음";

            try {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) {
                console.warn("Invalid date:", dateString);
                return "날짜 오류";
              }

              return date
                .toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                .replace(/\. /g, ".")
                .replace(".", ".");
            } catch (error) {
              console.error("날짜 포맷팅 오류:", error, dateString);
              return "날짜 오류";
            }
          };

          return {
            id: post.boardNo,
            title: post.boardTitle,
            author: post.memberNickname,
            memberProfileImage: post.memberProfileImage,
            date: formatDate(post.boardCreateDate),
            likes: post.boardLikeCount,
            views: post.boardViewCount,
          };
        });

        setPosts(formattedPosts);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
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
  }, []);

  // 페이지 변경
  const goToPage = (page) => {
    fetchPosts(page, searchType, searchKeyword);
  };

  // 검색
  const handleSearch = () => {
    setCurrentPage(1);
    fetchPosts(1, searchType, searchKeyword);
  };

  // 검색어 입력 시 엔터키 처리
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleItemClick = (id) => {
    navigate(`/wagle/${id}`);
    setTimeout(() => window.scrollTo(0, 0), 0);
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="general-board-outer">
        <div className="general-board-container">
          <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
            게시글을 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="general-board-outer">
        <div className="general-board-container">
          <div
            style={{ textAlign: "center", padding: "50px", color: "#e74c3c" }}
          >
            {error}
            <br />
            <button
              onClick={() => fetchPosts()}
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                background: "#60a5fa",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="general-board-outer">
      <div className="general-board-container">
        {/* 타이틀이 있다면 여기에 {!hideTitle && <div>타이틀</div>} 추가 가능 */}
        <div className="general-board-list paginated-list">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div
                className="general-board-item"
                key={post.id}
                onClick={() => handleItemClick(post.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="general-board-title">{post.title}</div>
                <div className="general-board-meta">
                  <img
                    src={
                      post.memberProfileImage
                        ? post.memberProfileImage.startsWith("/profile-images/")
                          ? post.memberProfileImage + "?t=" + Date.now()
                          : post.memberProfileImage
                        : "/logo.png"
                    }
                    alt="프로필"
                    className="header-user-profile"
                    onError={(e) => {
                      e.target.src = "/logo.png";
                    }}
                  />
                  {/* <img
                    src={
                      post.memberProfileImage
                        ? `http://localhost:8080${post.memberProfileImage}`
                        : "/logo.png"
                    }
                    alt="프로필"
                    className="wagle-profile-img"
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      marginRight: "6px",
                    }}
                    onError={(e) => {
                      e.target.src = "/logo.png";
                    }}
                  /> */}
                  <span className="general-board-author">{post.author}</span>
                  <span className="general-board-date">{post.date}</span>
                  <span className="general-board-likes">
                    <FontAwesomeIcon icon={faThumbsUp} /> {post.likes}
                  </span>
                  <span className="general-board-views">
                    <FontAwesomeIcon icon={faEye} /> {post.views}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{ textAlign: "center", padding: "50px", color: "#666" }}
            >
              게시글이 없습니다.
            </div>
          )}
        </div>
        <div className="wagle-general-board-search-row">
          <div className="wagle-general-board-search-bar">
            <select
              className="wagle-search-type"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="title">제목</option>
              <option value="title_content">제목+내용</option>
              <option value="author">작성자</option>
            </select>
            <input
              className="wagle-search-input"
              type="text"
              placeholder="검색어를 입력해 주세요..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="wagle-search-btn" onClick={handleSearch}>
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
          {!hideWriteBtn && (
            <button className="wagle-write-btn" onClick={handleWriteClick}>
              글쓰기
            </button>
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          className="wagle-pagination"
        />
      </div>
    </div>
  );
}

export default GeneralBoard;
