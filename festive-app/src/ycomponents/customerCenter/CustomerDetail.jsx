import React from "react";
import Title from "./Title";
import "./CustomerDetail.css";
import { useNavigate, useParams } from "react-router-dom";

// 고객센터 게시글 더미 데이터 (실제로는 API에서 가져올 데이터)
const customerPosts = [
  {
    id: 1205,
    title:
      "서울 불꽃축제 다녀왔어요 완전 대박이었음 ㅠㅠ 사진도 엄청 많이 찍었는데 날씨도 좋고 너무 예뻤어요",
    author: "축제러버",
    date: "2024.05.16 14:32",
    views: 96,
    content: `안녕하세요! 어제 서울 불꽃축제에 다녀왔는데 정말 최고였습니다!
    
날씨도 너무 좋았고, 사람들도 많았지만 그만큼 분위기가 정말 좋았어요.
특히 마지막 피날레 불꽃이 정말 장관이었습니다.

다음에도 꼭 가고 싶어요! 감사합니다.`,
  },
  {
    id: 1204,
    title: "부산 바다축제 후기에요! 예전엔 진짜루 누가 같이 갈 사람?",
    author: "바다왕",
    date: "2024.05.16 13:20",
    views: 78,
    content: "부산 바다축제 관련 문의 내용입니다.",
  },
  {
    id: 1203,
    title: "전주 한옥마을 축제 프로그램 완전 추천!",
    author: "전주러",
    date: "2024.05.15 18:45",
    views: 45,
    content: "전주 한옥마을 축제 관련 문의입니다.",
  },
  {
    id: 1202,
    title: "논산 딸기축제 2년째 반박자씩 늦게 갑니다",
    author: "딸기마니아",
    date: "2024.05.15 11:00",
    views: 13,
    content: "논산 딸기축제 관련 문의입니다.",
  },
  {
    id: 1201,
    title: "청주 흥덕 축제 야경 사진 공유해요~ (사진 많음 주의)",
    author: "흥덕주민",
    date: "2024.05.14 20:10",
    views: 156,
    content: "청주 흥덕 축제 관련 문의입니다.",
  },
  {
    id: 1200,
    title: "해운대 모래축제 현실 리뷰 꿀팁 전해드려요!",
    author: "모래왕",
    date: "2024.05.14 12:00",
    views: 34,
    content: "해운대 모래축제 관련 문의입니다.",
  },
  {
    id: 1199,
    title: "대구 치맥페스티벌 일정 정리했습니다",
    author: "치맥러버",
    date: "2024.05.13 09:00",
    views: 24,
    content: "대구 치맥페스티벌 관련 문의입니다.",
  },
];

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = customerPosts.find((p) => String(p.id) === String(id));

  if (!post) {
    return (
      <div className="customer-detail-outer">
        <Title />
        <div className="customer-detail-container">
          <div className="customer-detail-main">
            <h2 className="customer-detail-not-found">
              존재하지 않는 문의글입니다.
            </h2>
            <div className="customer-detail-actions-bar">
              <button
                className="customer-detail-list-btn"
                onClick={() => navigate("/customer-center")}
              >
                목록
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-detail-outer">
      <Title />
      <div className="customer-detail-container">
        <div className="customer-detail-main">
          <div className="customer-detail-title-row">
            <h2 className="customer-detail-title">{post.title}</h2>
          </div>
          <div className="customer-detail-meta">
            <span className="customer-detail-profile-img"></span>
            <span className="customer-detail-author">{post.author}</span>
            <span className="customer-detail-date">{post.date}</span>
            <span className="customer-detail-views">조회수 {post.views}</span>
          </div>
          <div className="customer-detail-content">{post.content}</div>
          <div className="customer-detail-actions-bar">
            <button
              className="customer-detail-list-btn"
              onClick={() => navigate("/customer-center")}
            >
              목록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetail;
