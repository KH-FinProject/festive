import { useEffect, useState } from "react";
import mainLogo from "../assets/festiveLogo.png";
import searchbtn from "../assets/searchbtn.png";
import "./HeaderFooter.css";
import { Link } from "react-router-dom";
import Weather from "../scomponents/weatherAPI/WeatherAPI.jsx";
import useAuthStore from "../store/useAuthStore";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { member } = useAuthStore();

  useEffect(() => {
    if (member) {
      setIsLoggedIn(true);

    } else {
      setIsLoggedIn(false);
    }
  }, [member]);

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
          { name: "축제달력", path: "/calendar" },
          { name: "지역별 축제", path: "/festival/local" },
          { name: "와글와글", path: "/wagle" },
          { name: "AI 여행코스 추천", path: "/ai-travel" },
          { name: "고객센터", path: "#" },
          { name: "부스참가신청", path: "/booth" },
          ...(member?.role === "ADMIN" ? [{ name: "관리자", path: "/admin" }] : []),
        ].map((item) =>
          item.path !== "#" ? (
            <Link
              key={item.name}
              to={item.path}
              className="headernav-link hover-grow"
            >
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
        <div className="headerweather-placeholder">
          <Weather />
        </div>
        {isLoggedIn ? (
          <a href={"/mypage/profile"}>
            <div className="header-user-info">
              <img
                src={member?.profileImage || "https://via.placeholder.com/30"}
                alt="프로필"
                className="header-user-profile"
              />
              <span className="header-user-nickname">{member?.nickname || member?.name}</span>
            </div>
          </a>
        ) : (
          <>
            <Link to="/signin" className="headernav-link hover-grow">
              Sign In
            </Link>
            <Link to="/signup" className="headernav-link hover-grow">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
