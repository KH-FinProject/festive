import React from "react";
import mainLogo from "../assets/festiveLogo.png";
import searchbtn from "../assets/searchbtn.png";
import "./HeaderFooter.css";
import { Link } from "react-router-dom";

function Header() {
    const isLoggedIn = false;
    const user = { nickname: "홍길동", profileImage: "https://via.placeholder.com/30" };
    return (
    <header className="header">
      <div className="headerlogo">
          <a href="/">
              <img src={mainLogo} alt="festive logo" />
          </a>
      </div>
      <nav className="headernav">
          {[
              { name: "이달의 축제", path: "/this-month" },
              { name: "축제달력", path: "#" },
              { name: "지역별 축제", path: "#" },
              { name: "와글와글", path: "/wagle" },
              { name: "AI 여행코스 추천", path: "#" },
              { name: "고객센터", path: "#" },
              { name: "부스참가신청", path: "#" },
          ].map((item) =>
              item.path !== "#" ? (
                  <Link key={item.name} to={item.path} className="headernav-link hover-grow">
                      {item.name}
                  </Link>
              ) : (
                  <a key={item.name} href="#" className="headernav-link hover-grow">
                      {item.name}
                  </a>
              )
          )}
      </nav>
      <div className="headerheader-right">
        <input
          type="text"
          className="headersearch-input"
          placeholder="검색어를 입력해 주세요."
        />
        <img src={searchbtn} className="headersearch-btn" />
        <div className="headerweather-placeholder">날씨 API 자리</div>
          {isLoggedIn ? (
              <a href={"#"}>
              <div className="header-user-info">
                  <img
                      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E"
                      alt="프로필"
                      className="header-user-profile"
                  />
                  <span className="header-user-nickname">{user.nickname}</span>
              </div>
              </a>
          ) : (
              <>
                  <Link to="/signin" className="headernav-link hover-grow">
                      Sign In
                  </Link>
                  <Link to="/signup/agreement" className="headernav-link hover-grow">
                      Sign Up
                  </Link>
              </>
          )}
      </div>
    </header>
  );
}

export default Header;
