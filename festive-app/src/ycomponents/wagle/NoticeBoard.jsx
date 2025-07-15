import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import Title from "./Title";
import "./NoticeBoard.css";
import { useNavigate } from "react-router-dom";
import axiosApi from "../../api/axiosAPI";

const INITIAL_DISPLAY_COUNT = 3;

function NoticeBoard({ hideTitle }) {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  // API에서 공지사항 목록 가져오기
  const fetchNotices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        boardTypeNo: "2", // 공지사항
        page: "1",
        size: "50", // 공지사항은 많지 않으므로 넉넉하게 설정
      });

      const response = await axiosApi.get(`/api/wagle/boards?${params}`);
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;

        // 데이터 형식 변환
        const formattedNotices = data.boardList.map((notice) => ({
          id: notice.boardNo,
          title: notice.boardTitle,
          author: notice.memberNickname,
          date: new Date(notice.boardCreateDate)
            .toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
            .replace(/\. /g, ".")
            .replace(".", "."),
          memberProfileImage: notice.memberProfileImage, // 필드명 통일
        }));

        setNotices(formattedNotices);
      }
    } catch (err) {
      console.error("공지사항 로딩 실패:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const displayedNotices = showAll
    ? notices
    : notices.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = notices.length > INITIAL_DISPLAY_COUNT;

  // 로딩 상태
  if (loading) {
    return (
      <div className="notice-board-outer">
        {!hideTitle && <Title />}
        <div style={{ textAlign: "center", padding: "30px", color: "#666" }}>
          공지사항을 불러오는 중...
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="notice-board-outer">
        {!hideTitle && <Title />}
        <div style={{ textAlign: "center", padding: "30px", color: "#e74c3c" }}>
          {error}
          <br />
          <button
            onClick={() => fetchNotices()}
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
    );
  }

  return (
    <div className="notice-board-outer">
      {!hideTitle && <Title />}
      <div className="notice-list">
        {notices.length > 0 ? (
          displayedNotices.map((notice) => (
            <div
              className="notice-item special-notice"
              key={notice.id}
              onClick={() => navigate(`/wagle/${notice.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="notice-row">
                <div className="notice-badge">공지</div>
                <div className="notice-title special-title">{notice.title}</div>
              </div>
              <div className="notice-content">
                <div className="notice-meta">
                  <img
                    src={
                      notice.memberProfileImage
                        ? `${(import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, '')}${notice.memberProfileImage.startsWith('/') ? notice.memberProfileImage : `/${notice.memberProfileImage}`}`
                        : "/logo.png"
                    }
                    alt="관리자 프로필"
                    className="notice-profile-img"
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginRight: "6px",
                      verticalAlign: "middle",
                    }}
                    onError={(e) => {
                      e.target.src = "/logo.png";
                    }}
                  />
                  <span className="notice-author">{notice.author}</span>
                  <span className="notice-date">{notice.date}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "30px", color: "#666" }}>
            등록된 공지사항이 없습니다.
          </div>
        )}
      </div>
      {hasMore && (
        <div className="notice-show-more-container">
          <button
            className="notice-show-more-btn"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <span>접기</span>
                <FontAwesomeIcon icon={faChevronUp} />
              </>
            ) : (
              <>
                <span>더보기</span>
                <FontAwesomeIcon icon={faChevronDown} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default NoticeBoard;
