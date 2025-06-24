import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp, faEye } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const CustomerBoard = ({ currentPage }) => {
  const navigate = useNavigate();

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
  ];

  const handleItemClick = (id) => {
    navigate(`/customer-center/${id}`);
    setTimeout(() => window.scrollTo(0, 0), 0);
  };

  return (
    <div className="customer-board-list">
      {posts.map((post) => (
        <div
          className="customer-board-item"
          key={post.id}
          onClick={() => handleItemClick(post.id)}
          style={{ cursor: "pointer" }}
        >
          <div className="customer-board-title">{`#${post.id} ${post.title}`}</div>
          <div className="customer-board-meta">
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E"
              alt="프로필"
              className="customer-profile-img"
            />
            <span className="customer-board-author">{post.author}</span>
            <span className="customer-board-date">{post.date}</span>
            <div className="customer-board-likes">
              <FontAwesomeIcon icon={faThumbsUp} />
              <span>{post.likes}</span>
            </div>
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
