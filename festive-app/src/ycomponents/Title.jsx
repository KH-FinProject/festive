import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import "./Title.css";
import { useNavigate } from "react-router-dom";

function Title({ currentPage = "와글와글", hideSubtitle = false }) {
  const isMainPage = currentPage === "와글와글";
  const navigate = useNavigate();

  return (
    <div className="wagle-header">
      <div className="wagle-main-title">와글와글</div>
      {!hideSubtitle && (
        <div className="wagle-sub-title">
          #축제 후기와 여러분의 의견을 자유롭게 나눌 수 있는 공간입니다.
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
          onClick={() => navigate("/wagle")}
        >
          와글와글
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

export default Title;
