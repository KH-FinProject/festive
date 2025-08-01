import React, { useState, useEffect } from "react";
import Title from "./Title";
import "./WagleDetail.css";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faHeart as faHeartSolid,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import GeneralBoard from "./GeneralBoard";
import NoticeBoard from "./NoticeBoard";
import useAuthStore from "../../store/useAuthStore";
import { checkNicknameForSocialUser } from "../../utils/nicknameCheck";
import { Viewer } from "@toast-ui/react-editor";
import axiosApi from "../../api/axiosAPI.js";

function CommentItem({
  comment,
  onReport,
  currentUser,
  onReplySubmit,
  onEditComment,
  onDeleteComment,
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.commentContent);

  const formatDate = (dateString) => {
    return new Date(dateString)
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/\. /g, ".")
      .replace(".", ".");
  };

  // 댓글 작성자 여부 확인
  const isCommentAuthor = currentUser?.memberNo === comment.memberNo;

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    await onReplySubmit(comment.commentNo, replyContent);
    setReplyContent("");
    setShowReplyInput(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    await onEditComment(comment.commentNo, editContent);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm("댓글을 삭제하시겠습니까?")) {
      await onDeleteComment(comment.commentNo);
    }
  };

  const navigate = useNavigate();

  return (
    <li className="wagle-detail-comment-item">
      <div className="comment-main-row">
        <img
          className="comment-avatar"
          src={
            comment.memberProfileImage
              ? `${
                  import.meta.env.VITE_API_URL ||
                  "https://api.festivekorea.site"
                }${comment.memberProfileImage}`
              : "/logo.png"
          }
          alt="프로필"
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            marginRight: "6px",
          }}
          onError={(e) => {
            e.target.src = "/logo.png";
          }}
        />
        <span className="comment-author">
          {comment.memberNickname ? comment.memberNickname : "알 수 없음"}
        </span>
        <span className="comment-date">
          {formatDate(comment.commentCreateDate)}
        </span>
        <div className="comment-actions">
          {isCommentAuthor && (
            <>
              <button
                className="comment-btn"
                onClick={() => setIsEditing(true)}
              >
                수정
              </button>
              <button className="comment-btn" onClick={handleDelete}>
                삭제
              </button>
              <button
                className="comment-btn"
                onClick={() => navigate("/mypage/mycomment")}
              >
                내 댓글 목록
              </button>
            </>
          )}
          <button
            className="comment-btn"
            onClick={() => setShowReplyInput((v) => !v)}
          >
            답글
          </button>
          <button
            className="comment-btn report-btn"
            onClick={() =>
              onReport({
                type: 1, // 댓글
                targetId: comment.commentNo,
                targetAuthor: comment.memberNickname,
                content: comment.commentContent,
                targetMemberNo: comment.memberNo, // 댓글 작성자 회원번호
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
      </div>
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="edit-comment-form">
          <input
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{ width: "80%", marginRight: 8 }}
          />
          <button type="submit">저장</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            취소
          </button>
        </form>
      ) : (
        <div className="comment-content">{comment.commentContent}</div>
      )}
      {showReplyInput && (
        <form onSubmit={handleReplySubmit} className="reply-input-form">
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="답글을 입력하세요"
            style={{ width: "80%", marginRight: 8 }}
          />
          <button type="submit">등록</button>
        </form>
      )}
      {comment.replies &&
        comment.replies.length > 0 &&
        comment.replies.map((reply) => {
          // 답글 작성자 여부 확인
          const isReplyAuthor = currentUser?.memberNo === reply.memberNo;

          return (
            <div className="reply-row" key={reply.commentNo}>
              <div className="comment-main-row">
                <img
                  className="comment-avatar"
                  src={
                    reply.memberProfileImage
                      ? `${(
                          import.meta.env.VITE_API_URL ||
                          "https://api.festivekorea.site"
                        ).replace(/\/+$/, "")}${
                          reply.memberProfileImage.startsWith("/")
                            ? reply.memberProfileImage
                            : `/${reply.memberProfileImage}`
                        }`
                      : "/logo.png"
                  }
                  alt="프로필"
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    marginRight: "6px",
                  }}
                  onError={(e) => {
                    e.target.src = "/logo.png";
                  }}
                />
                <span className="comment-author">
                  {reply.memberNickname ? reply.memberNickname : "알 수 없음"}
                </span>
                <span className="comment-date">
                  {formatDate(reply.commentCreateDate)}
                </span>
                <div className="comment-actions">
                  {isReplyAuthor && (
                    <>
                      <button
                        className="comment-btn"
                        onClick={() => {
                          if (window.confirm("답글을 수정하시겠습니까?")) {
                            const newContent = prompt(
                              "답글 내용을 입력하세요:",
                              reply.commentContent
                            );
                            if (newContent && newContent.trim()) {
                              onEditComment(reply.commentNo, newContent.trim());
                            }
                          }
                        }}
                      >
                        수정
                      </button>
                      <button
                        className="comment-btn"
                        onClick={() => {
                          if (window.confirm("답글을 삭제하시겠습니까?")) {
                            onDeleteComment(reply.commentNo);
                          }
                        }}
                      >
                        삭제
                      </button>
                      <button
                        className="comment-btn"
                        onClick={() => navigate("/mypage/mycomment")}
                      >
                        내 댓글 목록
                      </button>
                    </>
                  )}
                  <button
                    className="comment-btn report-btn"
                    onClick={() =>
                      onReport({
                        type: 1, // 댓글
                        targetId: reply.commentNo,
                        targetAuthor: reply.memberNickname,
                        content: reply.commentContent,
                        targetMemberNo: reply.memberNo, // 답글 작성자 회원번호
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
              </div>
              <div className="comment-content">{reply.commentContent}</div>
            </div>
          );
        })}
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

function ReportModal({ isOpen, onClose, onSubmit, reportData, currentUser }) {
  const [reason, setReason] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("신고 사유를 입력해주세요.");
      return;
    }

    try {
      const reportPayload = {
        memberNo: reportData.targetMemberNo, // 신고 대상 회원번호
        reporterNo: currentUser?.memberNo, // 로그인 유저 회원번호
        reportReason: reason,
        reportType: reportData.type, // 0: 게시글, 1: 댓글
        reportBoardNo: reportData.targetId,
      };

      const response = await axiosApi.post("/api/reports", reportPayload);

      if (response.status >= 200 && response.status < 300) {
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
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [currentReportData, setCurrentReportData] = useState(null);
  const [newComment, setNewComment] = useState("");
  const { member, isLoggedIn } = useAuthStore();

  // 게시글 상세 정보 가져오기
  const fetchPostDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosApi.get(`/api/wagle/boards/${id}`);
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        // 데이터 형식 변환
        const formattedPost = {
          id: data.boardNo,
          boardTypeNo: data.boardTypeNo,
          title: data.boardTitle,
          author: data.memberNickname,
          date: new Date(data.boardCreateDate)
            .toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
            .replace(/\. /g, ".")
            .replace(".", "."),
          content: data.boardContent,
          views: data.boardViewCount,
          likes: data.boardLikeCount,
          commentCount: data.boardCommentCount,

          memberNo: data.memberNo,
          memberProfileImage: data.memberProfileImage,
        };
        setPost(formattedPost);
      } else {
        throw new Error("게시글을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("게시글 로딩 실패:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 목록 가져오기
  const fetchComments = async () => {
    try {
      const response = await axiosApi.get(`/api/wagle/boards/${id}/comments`);
      if (response.status >= 200 && response.status < 300) {
        setComments(response.data);
      }
    } catch (err) {
      console.error("댓글 로딩 실패:", err);
    }
  };

  // 좋아요 상태 확인
  const checkLikeStatus = async () => {
    if (!member) return;
    try {
      const response = await axiosApi.get(`/api/wagle/boards/${id}/like/check`);
      if (response.status >= 200 && response.status < 300) {
        setLiked(response.data.liked);
      }
    } catch (err) {
      console.error("좋아요 상태 확인 실패:", err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPostDetail();
      fetchComments();
      checkLikeStatus();
    }
  }, [id]);

  // 좋아요 토글
  const handleLikeToggle = async () => {
    if (!member) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }
    try {
      const response = await axiosApi.post(`/api/wagle/boards/${id}/like`);
      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        setLiked(data.action === "like");
        setPost((prev) => ({ ...prev, likes: data.likeCount }));
      } else {
        alert("좋아요 처리에 실패했습니다.");
      }
    } catch (err) {
      console.error("좋아요 처리 실패:", err);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // 로그인 체크
    if (!member) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }

    // 닉네임 체크
    const canProceed = await checkNicknameForSocialUser(navigate);
    if (!canProceed) return;

    try {
      const response = await axiosApi.post(`/api/wagle/boards/${id}/comments`, {
        commentContent: newComment,
      });

      if (response.status >= 200 && response.status < 300) {
        setNewComment("");
        fetchComments(); // 댓글 목록 새로고침
        fetchPostDetail(); // 댓글 수 업데이트를 위해 게시글 정보도 새로고침
      } else {
        alert("댓글 작성에 실패했습니다.");
      }
    } catch (err) {
      console.error("댓글 작성 실패:", err);
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  };

  // 답글 작성
  const handleReplySubmit = async (parentCommentNo, replyContent) => {
    if (!member) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }
    // 닉네임 체크
    const canProceed = await checkNicknameForSocialUser(navigate);
    if (!canProceed) return;
    try {
      const response = await axiosApi.post(`/api/wagle/boards/${id}/comments`, {
        commentContent: replyContent,
        commentParentNo: parentCommentNo,
      });
      if (response.status >= 200 && response.status < 300) {
        fetchComments();
        fetchPostDetail();
      } else {
        alert("답글 작성에 실패했습니다.");
      }
    } catch (err) {
      console.error("답글 작성 실패:", err);
      alert("답글 작성 중 오류가 발생했습니다.");
    }
  };

  // 댓글 수정
  const handleEditComment = async (commentNo, newContent) => {
    if (!member) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }
    try {
      const response = await axiosApi.put(`/api/wagle/comments/${commentNo}`, {
        commentContent: newContent,
      });
      if (response.status >= 200 && response.status < 300) {
        fetchComments();
        fetchPostDetail();
      } else {
        alert("댓글 수정에 실패했습니다.");
      }
    } catch (err) {
      console.error("댓글 수정 실패:", err);
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentNo) => {
    if (!member) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }
    try {
      const response = await axiosApi.delete(
        `/api/wagle/comments/${commentNo}`
      );
      if (response.status >= 200 && response.status < 300) {
        fetchComments();
        fetchPostDetail();
      } else {
        alert("댓글 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("댓글 삭제 실패:", err);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  // 게시글 수정
  const handleEditPost = () => {
    navigate(`/wagle/edit/${id}`);
  };

  // 게시글 삭제
  const handleDeletePost = async () => {
    if (!member) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }
    if (!window.confirm("게시글을 삭제하시겠습니까?")) {
      return;
    }
    try {
      const response = await axiosApi.delete(`/api/wagle/boards/${id}`);
      if (response.status >= 200 && response.status < 300) {
        alert("게시글이 삭제되었습니다.");
        navigate("/wagle");
      } else {
        alert("게시글 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("게시글 삭제 실패:", err);
      alert("게시글 삭제 중 오류가 발생했습니다.");
    }
  };

  // 공지사항인지 확인 (boardTypeNo가 2인 경우)
  const isNotice = post?.boardTypeNo === 2;

  // flat 구조로 변환
  const flatComments = flattenComments(comments);

  const handleReport = (reportData) => {
    // 로그인 체크
    if (!isLoggedIn || !member) {
      alert("로그인이 필요한 서비스입니다.\n로그인 후 신고해주세요!");
      navigate("/signin");
      return;
    }

    setCurrentReportData(reportData);
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = () => {
    // 추가 처리 로직이 있다면 여기에 구현
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="wagle-detail-outer" style={{ background: "#fff" }}>
        <Title currentPage="게시글 상세" hideSubtitle={true} />
        <div className="wagle-detail-container">
          <div className="wagle-detail-main">
            <div
              style={{ textAlign: "center", padding: "50px", color: "#666" }}
            >
              게시글을 불러오는 중...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !post) {
    return (
      <div className="wagle-detail-outer" style={{ background: "#fff" }}>
        <Title currentPage="게시글 상세" hideSubtitle={true} />
        <div className="wagle-detail-container">
          <div className="wagle-detail-main">
            <div
              style={{ textAlign: "center", padding: "50px", color: "#e74c3c" }}
            >
              {error || "존재하지 않는 게시글입니다."}
              <br />
              <button
                onClick={() => navigate("/wagle")}
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
                목록으로 돌아가기
              </button>
            </div>
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
              {member?.memberNo === post.memberNo && (
                <>
                  <button className="edit" onClick={handleEditPost}>
                    수정
                  </button>
                  <button className="delete" onClick={handleDeletePost}>
                    삭제
                  </button>
                  <button
                    className="delete"
                    onClick={() => navigate("/mypage/mypost")}
                  >
                    내 게시글 목록
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="wagle-detail-meta">
            <img
              className="wagle-profile-img"
              src={
                post.memberProfileImage
                  ? `${(
                      import.meta.env.VITE_API_URL ||
                      "https://api.festivekorea.site"
                    ).replace(/\/+$/, "")}${
                      post.memberProfileImage.startsWith("/")
                        ? post.memberProfileImage
                        : `/${post.memberProfileImage}`
                    }`
                  : "/logo.png"
              }
              alt="프로필"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                marginRight: "6px",
              }}
              onError={(e) => {
                e.target.src = "/logo.png";
              }}
            />
            <span className="author">
              {post.author ? post.author : "알 수 없음"}
            </span>
            <span className="date">{post.date}</span>
            <span className="views">{post.views}</span>
            {!isNotice && (
              <span className="comments">댓글 {flatComments.length}</span>
            )}
            {!isNotice && (
              <button
                className="report-btn"
                onClick={() => {
                  setCurrentReportData({
                    type: 0, // 게시글
                    targetId: post.id,
                    targetAuthor: post.author,
                    content: post.title,
                    targetMemberNo: post.memberNo, // 게시글 작성자 회원번호
                  });
                  setIsReportModalOpen(true);
                }}
              >
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  style={{ marginRight: 4 }}
                />
                신고
              </button>
            )}
          </div>
          <div className="wagle-detail-content">
            <Viewer initialValue={post?.content || ""} />
          </div>
          <div className="wagle-detail-actions-bar">
            <div className="wagle-detail-actions">
              <button className="like-btn" onClick={handleLikeToggle}>
                <FontAwesomeIcon
                  icon={liked ? faHeartSolid : faHeartRegular}
                  style={{ marginRight: 4 }}
                />{" "}
                좋아요 ({post.likes || 0})
              </button>
            </div>
            <button className="list-btn" onClick={() => navigate("/wagle")}>
              목록
            </button>
          </div>
        </div>
        {!isNotice && (
          <div className="wagle-detail-comments">
            <div className="wagle-detail-comments-title">
              댓글 ({flatComments.length})
            </div>
            <form
              className="wagle-detail-comment-form"
              onSubmit={handleCommentSubmit}
            >
              <input
                type="text"
                placeholder="댓글을 남겨주세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit">댓글 작성</button>
            </form>
            <ul className="wagle-detail-comment-list">
              {comments.map((c) => (
                <CommentItem
                  key={c.commentNo}
                  comment={c}
                  onReport={handleReport}
                  currentUser={member}
                  onReplySubmit={handleReplySubmit}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                />
              ))}
            </ul>
          </div>
        )}
        <div className="wagle-detail-bottom-list">
          <div className="wagle-divider" />
          <div className="wagle-detail-bottom-title">
            <h3>{isNotice ? "공지사항" : "게시글"}</h3>
          </div>
          {isNotice ? (
            <NoticeBoard hideTitle={true} />
          ) : (
            <GeneralBoard hideTitle={true} hideWriteBtn={true} />
          )}
        </div>
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleReportSubmit}
          reportData={currentReportData}
          currentUser={member}
        />
      </div>
    </div>
  );
}

export default WagleDetail;
