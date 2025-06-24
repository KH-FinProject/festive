import React, { useState } from "react";
import Title from "./Title";
import "./WagleDetail.css";
import { useNavigate, useParams } from "react-router-dom";
import { posts } from "./GeneralBoard";
import { notices } from "./NoticeBoard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faHeart as faHeartSolid,
  faTimes,
  faFlag,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import GeneralBoard from "./GeneralBoard";

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

function CommentItem({ comment, onReport }) {
  return (
    <li className="wagle-detail-comment-item">
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
          <button
            className="comment-btn report-btn"
            onClick={() =>
              onReport({
                type: 1, // 댓글
                targetId: comment.id,
                targetAuthor: comment.author,
                content: comment.content,
              })
            }
          >
            <FontAwesomeIcon icon={faFlag} />
          </button>
        </div>
      </div>
      <div className="comment-content">{comment.content}</div>
      {comment.replies &&
        comment.replies.length > 0 &&
        comment.replies.map((reply) => (
          <div className="reply-row" key={reply.id}>
            <div className="comment-main-row">
              <img
                className="comment-avatar"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E"
                alt="프로필"
              />
              <span className="comment-author">{reply.author}</span>
              <span className="comment-date">{reply.date}</span>
              <div className="comment-actions">
                <button className="comment-btn">수정</button>
                <button className="comment-btn">삭제</button>
                <button
                  className="comment-btn report-btn"
                  onClick={() =>
                    onReport({
                      type: 1, // 댓글
                      targetId: reply.id,
                      targetAuthor: reply.author,
                      content: reply.content,
                    })
                  }
                >
                  <FontAwesomeIcon icon={faFlag} />
                </button>
              </div>
            </div>
            <div className="comment-content">{reply.content}</div>
          </div>
        ))}
    </li>
  );
}

// flat하게 댓글+답글을 한 배열로 만들어 렌더링
function flattenComments(comments) {
  const flat = [];
  comments.forEach((comment) => {
    flat.push({ ...comment, depth: 0 });
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach((reply) => {
        flat.push({ ...reply, depth: 1 });
      });
    }
  });
  return flat;
}

function ReportModal({ isOpen, onClose, onSubmit, reportData }) {
  const [reason, setReason] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const reportPayload = {
        memberNo: 1, // 실제로는 로그인된 사용자 ID
        reporterNo: 1, // 실제로는 로그인된 사용자 ID
        reportReason: reason,
        reportType: reportData.type, // 0: 게시글, 1: 댓글
        reportBoardNo: reportData.targetId,
      };

      const response = await fetch("http://localhost:8080/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportPayload),
      });

      if (response.ok) {
        alert("신고가 성공적으로 접수되었습니다.");
        onSubmit(reportPayload);
      } else {
        alert("신고 접수에 실패했습니다.");
      }
    } catch (error) {
      console.error("신고 처리 중 오류:", error);
      alert("신고 처리 중 오류가 발생했습니다.");
    }

    onClose();
    setReason("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>신고하기</h2>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>신고 대상</label>
              <input
                type="text"
                value={reportData?.targetAuthor || ""}
                readOnly
                className="readonly-input"
              />
            </div>
            <div className="form-group">
              <label>신고 대상 내용</label>
              <textarea
                value={reportData?.content || ""}
                readOnly
                className="readonly-textarea"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>신고 사유 *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="신고 사유를 입력해주세요..."
                required
                rows="4"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="submit-btn">
              신고
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WagleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const allPosts = [...posts, ...notices];
  const post = allPosts.find((p) => String(p.id) === String(id));
  const [liked, setLiked] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [currentReportData, setCurrentReportData] = useState(null);

  // flat 구조로 변환
  const flatComments = flattenComments(comments);

  const handleReport = (reportData) => {
    setCurrentReportData(reportData);
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = (reportPayload) => {
    console.log("신고 처리 완료:", reportPayload);
    // 추가 처리 로직이 있다면 여기에 구현
  };

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
            <span className="comments">댓글 {flatComments.length}</span>
            <button
              className="report-btn"
              onClick={() =>
                handleReport({
                  type: 0, // 게시글
                  targetId: post.id,
                  targetAuthor: post.author,
                  content: post.title,
                })
              }
            >
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                style={{ marginRight: 4 }}
              />
              신고
            </button>
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
              <CommentItem key={c.id} comment={c} onReport={handleReport} />
            ))}
          </ul>
        </div>
        <div className="wagle-detail-bottom-list">
          <div className="wagle-divider" />
          <GeneralBoard hideTitle={true} hideWriteBtn={true} />
        </div>
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleReportSubmit}
          reportData={currentReportData}
        />
      </div>
    </div>
  );
}

export default WagleDetail;
