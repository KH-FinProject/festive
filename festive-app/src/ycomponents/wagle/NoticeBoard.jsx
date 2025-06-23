import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserShield,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import Title from "./Title";
import "./NoticeBoard.css";
import { useNavigate } from "react-router-dom";

export const notices = [
  {
    id: 1,
    title: "안녕하세요 저는 공지입니다",
    author: "관리자",
    date: "2505.06.13 14:30",
  },
  {
    id: 2,
    title: "와글와글 게시판 이용 안내 및 규칙",
    author: "관리자",
    date: "2505.06.13 14:30",
  },
  {
    id: 3,
    title: "와글와글 게시판 업데이트 안내",
    author: "관리자",
    date: "2505.06.13 14:30",
  },
  {
    id: 4,
    title: "와글와글 게시판 이벤트 안내",
    author: "관리자",
    date: "2505.06.13 14:30",
  },
  {
    id: 5,
    title: "와글와글 게시판 베타 테스트 안내",
    author: "관리자",
    date: "2505.06.13 14:30",
  },
];

const INITIAL_DISPLAY_COUNT = 3;

function NoticeBoard({ hideTitle }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const displayedNotices = showAll
    ? notices
    : notices.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = notices.length > INITIAL_DISPLAY_COUNT;

  return (
    <div className="notice-board-outer">
      {!hideTitle && <Title />}
      <div className="notice-list">
        {displayedNotices.map((notice) => (
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
                <span className="notice-admin-badge">
                  <FontAwesomeIcon icon={faUserShield} /> 관
                </span>
                <span className="notice-author">{notice.author}</span>
                <span className="notice-date">{notice.date}</span>
              </div>
            </div>
          </div>
        ))}
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
