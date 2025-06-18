import React from "react";
import mainLogo from "../assets/festiveLogo.png";
import searchbtn from "../assets/searchbtn.png";
import "./HeaderFooter.css";

function Header() {
  return (
    <header className="header">
      <div className="headerlogo">
        <img src={mainLogo} alt="festive logo" />
      </div>
      <nav className="headernav">
        {[
          "이달의 축제",
          "축제달력",
          "지역별 축제",
          "와글와글",
          "AI 여행코스 추천",
          "고객센터",
          "부스참가신청",
        ].map((item) => (
          <a key={item} href="#" className="headernav-link hover-grow">
            {item}
          </a>
        ))}
      </nav>
      <div className="headerheader-right">
        <input
          type="text"
          className="headersearch-input"
          placeholder="검색어를 입력해 주세요."
        />
        <img src={searchbtn} className="headersearch-btn" />
        <div className="headerweather-placeholder">날씨 API 자리</div>
        <a href="#" className="headernav-link hover-grow">
          Sign In
        </a>
        <a href="#" className="headernav-link hover-grow">
          Sign Up
        </a>
      </div>
    </header>
  );
}

export default Header;
