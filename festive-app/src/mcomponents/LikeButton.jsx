import { useEffect, useState } from "react";
import "./LikeButton.css";
import axiosApi from "../api/axiosAPI";
import useAuthStore from "../store/useAuthStore";

const LikeButton = ({ contentId }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isfavorite, setIsfavorite] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const { member } = useAuthStore();

  // 좋아요 수 DB에서 조회해오기
  const fetchLikes = async () => {
    try {
      const resp = await axiosApi.get("/festival/detail/likes", {
        params: {
          contentId: contentId,
        },
      });

      setLikeCount(resp.data);
    } catch (err) {
      console.error("좋아요 수 조회 실패:", err);
    }
  };

  // 축제 찜하기
  const checkFavorite = async () => {
    try {
      // 로그인 상태일 경우에만 기존에 찜해두었던 축제인지 확인)
      if (member != null) {
        const resp = await axiosApi.get("/festival/detail/favorites", {
          params: {
            contentId: contentId,
          },
        });

        if (resp.status === 200) {
          const checkFavoriteStatus = resp.data;
          setIsfavorite(checkFavoriteStatus); // true or false
          console.log("checkFavoriteStatus : ", checkFavoriteStatus);
        } else if (resp.status === 401) {
          console.log("로그인 필요");
        }
      }
    } catch (err) {
      console.error("찜 여부 확인 실패", err);
    }
  };

  useEffect(() => {
    const storedLikes = JSON.parse(localStorage.getItem("likes")) || [];
    setIsLiked(storedLikes.includes(contentId));

    fetchLikes();
    checkFavorite();
  }, [contentId]);

  // 좋아요 눌렀을 때 토글
  const handleClickLike = async () => {
    try {
      const storedLikes = JSON.parse(localStorage.getItem("likes")) || [];

      // 서버에 현재 상태 넘기고 성공 시에만 상태 변경 및 로컬스토리지 업데이트
      const resp = await axiosApi.post("/festival/detail/likes", {
        currLike: isLiked,
        contentId: contentId,
      });

      if (resp.status === 200) {
        // 토글 상태 변경
        const newLikeStatus = !isLiked;
        setIsLiked(newLikeStatus);

        if (newLikeStatus) {
          // 좋아요 눌린 상태면 localStorage에 추가
          if (!storedLikes.includes(contentId)) {
            storedLikes.push(contentId);
          }
          localStorage.setItem("likes", JSON.stringify(storedLikes));
        } else {
          // 좋아요 해제면 localStorage에서 제거
          const updated = storedLikes.filter(
            (id) => String(id) !== String(contentId)
          );
          localStorage.setItem("likes", JSON.stringify(updated));
        }
        fetchLikes();
        console.log("좋아요 반영 성공 : ", newLikeStatus);
      }
    } catch (error) {
      console.log("좋아요 반영 중 에러 발생 : ", error);
    }
  };

  // 찜하기 눌렀을 때
  const handleClickFavorite = async () => {
    console.log("isfavorite : ", isfavorite);
    try {
      const resp = await axiosApi.post("/festival/detail/favorites", {
        currFavorite: isfavorite,
        contentId: contentId,
      });

      if (resp.status === 200) {
        setIsfavorite(!isfavorite);
        console.log("찜목록 반영 성공");
      }
    } catch (error) {
      console.log("찜하기 반영 중 에러 발생 : ", error);
    }
  };

  return (
    <div className="like-container">
      {/* 좋아요 */}
      <div className="like">
        <button
          onClick={handleClickLike}
          className={`heart-button ${isLiked ? "liked" : ""}`}
        >
          <img
            src={isLiked ? "/heart-solid.png" : "/heart-regular.png"}
            alt={isLiked ? "좋아요" : "좋아요 안함"}
            className="heart-image"
          />

          {/* 클릭 애니메이션 효과 */}
          {/* {isLiked && (
          <div className="particles">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${50 + Math.cos((i * 45 * Math.PI) / 180) * 35}%`,
                  top: `${50 + Math.sin((i * 45 * Math.PI) / 180) * 35}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )} */}
        </button>
        {likeCount > 0 && <span>{likeCount}</span>}
      </div>
      {/* 찜하기 */}
      <div className="favorite">
        {member != null && (
          <button onClick={handleClickFavorite} className="heart-button">
            <img
              src={isfavorite ? "/favorite-solid.png" : "/favorite-regular.png"}
              alt={isfavorite ? "찜하기" : "찜 안함"}
              className="heart-image"
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default LikeButton;
