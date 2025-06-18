import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThumbsUp,
  faEye,
  faSearch,
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "./Pagination";
import "./GeneralBoard.css";
import { useNavigate } from "react-router-dom";

const posts = [
  {
    id: 1205,
    title:
      "서울 불꽃축제 다녀왔어요 완전 대박이었음 ㅠㅠ 사진도 엄청 많이 찍었는데 날씨도 좋고 너무 예뻤어요",
    author: "축제러버",
    date: "2024.05.16 14:32",
    likes: 123,
    views: 96,
  },
  {
    id: 1204,
    title: "부산 바다축제 후기에요! 예전엔 진짜루 누가 같이 갈 사람?",
    author: "바다왕",
    date: "2024.05.16 13:20",
    likes: 56,
    views: 78,
  },
  // ... 10개 더미 데이터 추가 (총 17개)
  {
    id: 1203,
    title: "전주 한옥마을 축제 프로그램 완전 추천!",
    author: "전주러",
    date: "2024.05.15 18:45",
    likes: 24,
    views: 45,
  },
  {
    id: 1202,
    title: "논산 딸기축제 2년째 반박자씩 늦게 갑니다",
    author: "딸기마니아",
    date: "2024.05.15 11:00",
    likes: 47,
    views: 13,
  },
  {
    id: 1201,
    title: "청주 흥덕 축제 야경 사진 공유해요~ (사진 많음 주의)",
    author: "흥덕주민",
    date: "2024.05.14 20:10",
    likes: 80,
    views: 156,
  },
  {
    id: 1200,
    title: "해운대 모래축제 현실 리뷰 꿀팁 전해드려요!",
    author: "모래왕",
    date: "2024.05.14 12:00",
    likes: 56,
    views: 34,
  },
  {
    id: 1199,
    title: "대구 치맥페스티벌 일정 정리했습니다",
    author: "치맥러버",
    date: "2024.05.13 09:00",
    likes: 12,
    views: 24,
  },
  {
    id: 1198,
    title: "춘천 마임축제 후기!",
    author: "마임러",
    date: "2024.05.12 15:00",
    likes: 33,
    views: 44,
  },
  {
    id: 1197,
    title: "광주 비엔날레 축제 정보 공유",
    author: "광주인",
    date: "2024.05.12 10:00",
    likes: 22,
    views: 19,
  },
  {
    id: 1196,
    title: "울산 고래축제 다녀온 후기",
    author: "고래사랑",
    date: "2024.05.11 17:00",
    likes: 15,
    views: 18,
  },
  {
    id: 1195,
    title: "포항 불빛축제 꿀팁!",
    author: "포항러",
    date: "2024.05.10 20:00",
    likes: 19,
    views: 21,
  },
  {
    id: 1194,
    title: "여수 밤바다 축제 진짜 예뻐요",
    author: "여수밤바다",
    date: "2024.05.09 22:00",
    likes: 41,
    views: 55,
  },
  {
    id: 1193,
    title: "제주 유채꽃 축제 후기!",
    author: "제주러버",
    date: "2024.05.08 18:00",
    likes: 25,
    views: 30,
  },
  {
    id: 1192,
    title: "속초 오징어축제 꿀팁 공유",
    author: "오징어킹",
    date: "2024.05.07 15:00",
    likes: 17,
    views: 22,
  },
  {
    id: 1191,
    title: "광양 매화축제 사진 자랑합니다",
    author: "매화러버",
    date: "2024.05.06 13:00",
    likes: 29,
    views: 40,
  },
  {
    id: 1190,
    title: "진해 군항제 벚꽃 만개!",
    author: "벚꽃매니아",
    date: "2024.05.05 11:00",
    likes: 38,
    views: 51,
  },
  {
    id: 1189,
    title: "부산 불꽃축제 꿀팁!",
    author: "불꽃러버",
    date: "2024.05.04 20:00",
    likes: 44,
    views: 60,
  },
];

const PAGE_SIZE = 7;

function GeneralBoard() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const pagedPosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const navigate = useNavigate();

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    setTimeout(() => {
      const list = document.querySelector(".general-board-list");
      if (list) {
        list.scrollIntoView({ behavior: "auto", block: "start" });
      }
    }, 0);
  };

  return (
    <div className="general-board-outer">
      <div className="general-board-container">
        <div className="general-board-list">
          {pagedPosts.map((post) => (
            <div className="general-board-item" key={post.id}>
              <div className="general-board-title">{`#${post.id} ${post.title}`}</div>
              <div className="general-board-meta">
                <img
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E"
                  alt="프로필"
                  className="wagle-profile-img"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    marginRight: "6px",
                  }}
                />
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
          ))}
        </div>
        <div className="wagle-general-board-search-row">
          <div className="wagle-general-board-search-bar">
            <select className="wagle-search-type">
              <option value="title">제목</option>
              <option value="title_content">제목+내용</option>
              <option value="author">작성자</option>
            </select>
            <input
              className="wagle-search-input"
              type="text"
              placeholder="검색어를 입력해 주세요..."
            />
            <button className="wagle-search-btn">
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
          <button
            className="wagle-write-btn"
            onClick={() => navigate("/wagle/write")}
          >
            글쓰기
          </button>
        </div>
        <Pagination page={page} totalPages={totalPages} goToPage={goToPage} />
      </div>
    </div>
  );
}

export default GeneralBoard;
