import React from "react";
import mainLogo from "../assets/festiveLogo.png";
import searchbtn from "../assets/searchbtn.png";
import "./HeaderFooter.css";
import {Link} from "react-router-dom";

function Header() {
  return (
    <header className="header">
      <div className="logo">
        <img src={mainLogo} alt="festive logo" />
      </div>
      <nav className="nav">
        {[
          "이달의 축제",
          "축제달력",
          "지역별 축제",
          "와글와글",
          "AI 여행코스 추천",
          "고객센터",
          "부스참가신청",
        ].map((item) => (
          <a key={item} href="#" className="nav-link hover-grow">
            {item}
          </a>
        ))}
      </nav>
      <div className="header-right">
        <input
          type="text"
          className="search-input"
          placeholder="검색어를 입력해 주세요."
        />
        <img src={searchbtn} className="search-btn" />
        <div className="weather-placeholder">날씨 API 자리</div>
        <Link to="/signin" className="nav-link hover-grow">
          Sign In
        </Link>
        <Link to="/signup" className="nav-link hover-grow">
          Sign Up
        </Link>
      </div>
    </header>
  );
}

export default Header;
