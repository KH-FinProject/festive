import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserShield,
  faChevronRight,
  faHouse,
} from "@fortawesome/free-solid-svg-icons";
import "./NoticeBoard.css";

const notices = [
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

function NoticeBoard() {
  return (
    <div className="notice-board-outer">
      <div className="wagle-header">
        <div className="wagle-main-title">와글와글</div>
        <div className="wagle-sub-title">
          #축제 후기와 여러분의 의견을 자유롭게 나눌 수 있는 공간입니다.
        </div>
        <div className="wagle-location">
          <span className="wagle-location-home">홈</span>
          <FontAwesomeIcon
            icon={faChevronRight}
            className="wagle-location-arrow"
          />
          <span className="wagle-location-current">와글와글</span>
        </div>
      </div>
      <div className="notice-list">
        {notices.map((notice) => (
          <div className="notice-item special-notice" key={notice.id}>
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
