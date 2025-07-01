import { useEffect, useState } from "react";
import "./LikeButton.css";
import axiosApi from "../api/axiosAPI";
import useAuthStore from "../store/useAuthStore";

const LikeButton = ({ contentId }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isfavorite, setIsfavorite] = useState(false);

  const { member } = useAuthStore();

  useEffect(() => {
    const checkFavorite = async () => {
      try {
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
    checkFavorite();
  }, [contentId]);

  const handleClickLike = async () => {
    setIsLiked(!isLiked);
  };

  const handleClickFavorite = async () => {
    console.log("isfavorite : ", isfavorite);
    try {
      const resp = await axiosApi.post("/festival/detail/favorites", {
        currFavorite: isfavorite,
        contentId: contentId,
      });

      if (resp.status === 200) {
        setIsfavorite(!isfavorite);
        console.log("찜목록 반영 성공 성공");
      }
    } catch (error) {
      console.log("찜하기 반영 중 에러 발생 : ", error);
    }
  };
  return (
    <div className="container">
      {/* 좋아요 */}
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

      {/* 찜하기 */}
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
  );
};

export default LikeButton;
