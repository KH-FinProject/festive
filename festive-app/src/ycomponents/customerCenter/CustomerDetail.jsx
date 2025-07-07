import React, { useState, useEffect } from "react";
import Title from "./Title";
import "./CustomerDetail.css";
import { useNavigate, useParams } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { member: currentUser } = useAuthStore();

  // 게시글 상세 정보 가져오기
  const fetchPostDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8080/api/customer/boards/${id}`
      );

      if (!response.ok) {
        throw new Error("게시글을 불러오는데 실패했습니다.");
      }

      const data = await response.json();

      // 데이터 형식 변환 (CustomerInquiryDto 사용)
      const formattedPost = {
        id: data.boardNo,
        memberNo: data.memberNo, // 작성자 회원번호 추가
        title: data.boardTitle,
        author: data.memberNickname || "익명",
        memberProfileImage: data.memberProfileImage, // 프로필 이미지 추가
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
        // 고객센터 전용 정보
        status: data.inquiryStatus || "대기중",
        hasAnswer: data.hasAnswer || false,
        answerContent: data.answerContent,
        answerDate: data.answerDate
          ? new Date(data.answerDate)
            .toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
            .replace(/\. /g, ".")
            .replace(".", ".")
            .slice(0, -1)
          : null,
        priority: data.priority || "일반",
        category: data.category || "기타",
      };

      setPost(formattedPost);
    } catch (err) {
      console.error("게시글 로딩 실패:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPostDetail();
    }
  }, [id]);

  // 접근 권한 확인 (작성자 또는 관리자만 접근 가능)
  const hasAccess = () => {
    if (!currentUser || !post) return false;
    return (
      currentUser.memberNo === post.memberNo || currentUser.role === "ADMIN"
    );
  };

  // 게시글 수정 핸들러
  const handleEditPost = () => {
    navigate(`/customer-center/edit/${id}`);
  };

  // 게시글 삭제 핸들러
  const handleDeletePost = async () => {
    if (!currentUser) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/signin");
      return;
    }

    if (!window.confirm("문의글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/customer/boards/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        alert("문의글이 삭제되었습니다.");
        navigate("/customer-center");
      } else {
        alert("문의글 삭제에 실패했습니다.");
      }
    } catch (err) {
      console.error("문의글 삭제 실패:", err);
      alert("문의글 삭제 중 오류가 발생했습니다.");
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="customer-detail-outer">
        <Title />
        <div className="customer-detail-container">
          <div className="customer-detail-main">
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

  // 에러 상태 또는 게시글이 없는 경우
  if (error || !post) {
    return (
      <div className="customer-detail-outer">
        <Title />
        <div className="customer-detail-container">
          <div className="customer-detail-main">
            <div
              style={{ textAlign: "center", padding: "50px", color: "#e74c3c" }}
            >
              {error || "존재하지 않는 문의글입니다."}
              <br />
              <button
                className="customer-detail-list-btn"
                onClick={() => navigate("/customer-center")}
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
                목록
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 접근 권한이 없는 경우
  if (!hasAccess()) {
    return (
      <div className="customer-detail-outer">
        <Title />
        <div className="customer-detail-container">
          <div className="customer-detail-main">
            <div
              style={{ textAlign: "center", padding: "50px", color: "#e74c3c" }}
            >
              접근 권한이 없습니다.
              <br />
              <button
                className="customer-detail-list-btn"
                onClick={() => navigate("/customer-center")}
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
          <div
            className="customer-detail-title-row"
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <h2
              className="customer-detail-title"
              style={{ margin: "0", marginRight: "15px" }}
            >
              {post.title}
            </h2>
            <div
              className="customer-detail-badges"
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                className={`status-badge ${post.hasAnswer ? "answered" : "waiting"
                  }`}
                style={{
                  padding: "6px 12px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  backgroundColor: post.hasAnswer ? "#e8f5e8" : "#fff3e0",
                  color: post.hasAnswer ? "#2e7d32" : "#f57c00",
                  border: `1px solid ${post.hasAnswer ? "#a5d6a7" : "#ffcc02"}`,
                }}
              >
                {post.status}
              </span>
            </div>
            {/* 작성자만 수정/삭제 버튼 표시 */}
            {currentUser?.memberNo === post.memberNo && (
              <div
                className="customer-detail-btns"
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  className="customer-detail-edit-btn"
                  onClick={handleEditPost}
                  style={{
                    padding: "6px 12px",
                    background: "#60a5fa",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  수정
                </button>
                <button
                  className="customer-detail-delete-btn"
                  onClick={handleDeletePost}
                  style={{
                    padding: "6px 12px",
                    background: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
          <div className="customer-detail-meta">
            <img
              src={
                post.memberProfileImage
                  ? post.memberProfileImage.startsWith("/profile-images/")
                    ? post.memberProfileImage + "?t=" + Date.now()
                    : post.memberProfileImage
                  : "/logo.png"
              }
              alt="프로필"
              className="customer-detail-profile-img"
              onError={(e) => {
                e.target.src = "/logo.png";
              }}
            />
            <span className="customer-detail-author">{post.author}</span>
            <span className="customer-detail-date">{post.date}</span>
            <span className="customer-detail-views">조회수 {post.views}</span>
          </div>
          <div className="customer-detail-content">
            <h3
              style={{
                borderBottom: "2px solid #60a5fa",
                paddingBottom: "10px",
                marginBottom: "20px",
              }}
            >
              문의 내용
            </h3>
            {post.content && (
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.6",
                  marginBottom: "30px",
                }}
              >
                {post.content}
              </div>
            )}
          </div>

          {/* 답변 섹션 */}
          <div
            className="customer-detail-answer"
            style={{
              marginTop: "40px",
              borderTop: "1px solid #eee",
              paddingTop: "30px",
            }}
          >
            <h3
              style={{
                borderBottom: "2px solid #2ecc71",
                paddingBottom: "10px",
                marginBottom: "20px",
              }}
            >
              관리자 답변
            </h3>
            {post.hasAnswer && post.answerContent ? (
              <div>
                <div
                  style={{
                    backgroundColor: "#f8fffe",
                    border: "1px solid #2ecc71",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                      color: "#2c3e50",
                    }}
                  >
                    {post.answerContent}
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontSize: "14px",
                    color: "#7f8c8d",
                  }}
                >
                  답변일: {post.answerDate}
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "#fafafa",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "30px",
                  textAlign: "center",
                  color: "#7f8c8d",
                }}
              >
                <div style={{ fontSize: "16px", marginBottom: "10px" }}>
                  📝 아직 답변이 없습니다
                </div>
                <div style={{ fontSize: "14px" }}>
                  관리자가 확인 후 빠른 시일 내에 답변드리겠습니다.
                </div>
              </div>
            )}
          </div>
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
