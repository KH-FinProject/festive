import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";
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
];

function NoticeBoard({ hideTitle }) {
  const navigate = useNavigate();
  return (
    <div className="notice-board-outer">
      {!hideTitle && <Title />}
      <div className="notice-list">
        {notices.map((notice) => (
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
    </div>
  );
}

export default NoticeBoard;
