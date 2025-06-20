import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import "./AItitle.css";
import { useNavigate } from "react-router-dom";

function AItitle({ currentPage = "AI 여행 코스", hideSubtitle = false }) {
  const isMainPage = currentPage === "AI 여행 코스";
  const navigate = useNavigate();

  return (
    <div className="wagle-header">
      <div className="wagle-main-title">AI 여행 코스</div>
      {!hideSubtitle && (
        <div className="wagle-sub-title">
          #AI가 당신에게 추천하는 맞춤형 여행 코스
        </div>
      )}
      <div className="wagle-location">
        <span
          className="wagle-location-home wagle-location-link"
          onClick={() => navigate("/")}
        >
          홈
        </span>
        <FontAwesomeIcon
          icon={faChevronRight}
          className="wagle-location-arrow"
        />
        <span
          className="wagle-location-current wagle-location-link"
          onClick={() => navigate("/ai-travel")}
        >
          AI 여행 코스
        </span>
        {!isMainPage && (
          <>
            <FontAwesomeIcon
              icon={faChevronRight}
              className="wagle-location-arrow"
            />
            <span className="wagle-location-current">{currentPage}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default AItitle;
