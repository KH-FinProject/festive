import React, { useState } from "react";
import Title from "./Title";
import "./WagleDetail.css";
import { useNavigate, useParams } from "react-router-dom";
import { posts } from "./GeneralBoard";
import { notices } from "./NoticeBoard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamation,
  faHeart as faHeartSolid,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import NoticeBoard from "./NoticeBoard";
import GeneralBoard from "./GeneralBoard";
import Pagination from "./Pagination";

const images = [
  // 실제로는 서버에서 받아온 이미지 URL 배열
  "https://via.placeholder.com/180x120/9dc4fe/fff?text=Image1",
  "https://via.placeholder.com/180x120/9dc4fe/fff?text=Image2",
  "https://via.placeholder.com/180x120/9dc4fe/fff?text=Image3",
  "https://via.placeholder.com/180x120/9dc4fe/fff?text=Image4",
];

const comments = [
  {
    id: 1,
    author: "김춘자",
    date: "2024.04.13 15:20",
    content: "와 정말 예쁘네요! 저도 내일 가려고 했는데 더 기대돼요",
    replies: [
      {
        id: 11,
        author: "벚꽃사랑",
        date: "2024.04.13 15:25",
        content: "@김춘자 네! 꼭 가보세요~ 지금이 딱 절정이에요",
      },
    ],
  },
  {
    id: 2,
    author: "사진작가이재용",
    date: "2024.04.13 16:45",
    content:
      "사진 정말 잘 찍으셨네요! 어떤 카메라 쓰셨어요? 저도 이번 주말에 가서 찍어보려고 하는데 팁 좀 알려주세요~",
    replies: [],
  },
  {
    id: 3,
    author: "박서현",
    date: "2024.04.13 17:30",
    content:
      "저도 어제 갔었는데 정말 예뻤어요! 다만 사람이 너무 많아서 좀 힘들었지만... 그래도 갈 만해요!",
    replies: [],
  },
  {
    id: 4,
    author: "최민호",
    date: "2024.04.13 18:15",
    content: "몇 시쯤 가는게 가장 좋을까요? 평일에도 사람 많나요?",
    replies: [],
  },
];

function CommentItem({ comment, depth = 0 }) {
  return (
    <li className={`wagle-detail-comment-item depth-${depth}`}>
      <div className="comment-main-row">
        <img
          className="comment-avatar"
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E"
          alt="프로필"
        />
        <span className="comment-author">{comment.author}</span>
        <span className="comment-date">{comment.date}</span>
        <div className="comment-actions">
          <button className="comment-btn">수정</button>
          <button className="comment-btn">삭제</button>
          <button className="comment-btn">답글</button>
        </div>
      </div>
      <div className="comment-content">{comment.content}</div>
      {comment.replies && comment.replies.length > 0 && (
        <ul className="wagle-detail-comment-list replies">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function WagleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const allPosts = [...posts, ...notices];
  const post = allPosts.find((p) => String(p.id) === String(id));
  const [liked, setLiked] = useState(false);

  if (!post) {
    return (
      <div className="wagle-detail-outer" style={{ background: "#fff" }}>
        <Title currentPage="게시글 상세" hideSubtitle={true} />
        <div className="wagle-detail-container">
          <div className="wagle-detail-main">
            <h2
              style={{ color: "#888", textAlign: "center", margin: "80px 0" }}
            >
              존재하지 않는 게시글입니다.
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wagle-detail-outer" style={{ background: "#fff" }}>
      <Title currentPage="게시글 상세" hideSubtitle={false} />
      <div className="wagle-detail-container">
        <div className="wagle-detail-main">
          <div className="wagle-detail-title-row">
            <h2 className="wagle-detail-title">{post.title}</h2>
            <div className="wagle-detail-btns">
              <button className="edit">수정</button>
              <button className="delete">삭제</button>
            </div>
          </div>
          <div className="wagle-detail-meta">
            <span className="profile-img"></span>
            <span className="author">{post.author}</span>
            <span className="date">{post.date}</span>
            <span className="views">{post.views}</span>
            <span className="comments">댓글 {comments.length}</span>
          </div>
          <div className="wagle-detail-content">
            {/* 실제 본문은 post.content로 확장 가능 */}
            (여기에 본문 예시 또는 post.content)
          </div>
          <div className="wagle-detail-images">
            {images.map((img, idx) => (
              <img src={img} alt={`user-upload-${idx}`} key={idx} />
            ))}
          </div>
          <div className="wagle-detail-actions-bar">
            <div className="wagle-detail-actions">
              <button
                className="like-btn"
                onClick={() => setLiked((prev) => !prev)}
              >
                <FontAwesomeIcon
                  icon={liked ? faHeartSolid : faHeartRegular}
                  style={{ marginRight: 4 }}
                />{" "}
                좋아요
              </button>
              <button className="report-btn">
                <FontAwesomeIcon
                  icon={faExclamation}
                  style={{ marginRight: 4 }}
                />{" "}
                신고
              </button>
            </div>
            <button className="list-btn" onClick={() => navigate("/wagle")}>
              목록
            </button>
          </div>
        </div>
        <div className="wagle-detail-comments">
          <div className="wagle-detail-comments-title">댓글</div>
          <form className="wagle-detail-comment-form">
            <input type="text" placeholder="댓글을 남겨주세요..." />
            <button type="submit">댓글 작성</button>
          </form>
          <ul className="wagle-detail-comment-list">
            {comments.map((c) => (
              <CommentItem key={c.id} comment={c} />
            ))}
          </ul>
        </div>
        <div className="wagle-detail-bottom-list">
          <div className="wagle-divider" />
          <GeneralBoard hideTitle={true} hideWriteBtn={true} />
        </div>
      </div>
    </div>
  );
}

export default WagleDetail;
