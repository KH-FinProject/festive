import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import mainLogo from "../assets/festiveLogo.png";
import useAuthStore from "../store/useAuthStore";
import { useAdminNotifications } from "../mcomponents/AdminNotificationContext.jsx";
import Weather from "../scomponents/weatherAPI/WeatherAPI.jsx";
import axiosApi from "../api/axiosAPI.js";
import "./HeaderFooter.css";

const Header = () => {
  const { member, logout, isLoggedIn } = useAuthStore();
  const { hasNewReport, hasNewBooth, hasNewInquiry } = useAdminNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // 로그아웃 관련 상태
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await axiosApi.post("/auth/logout");
      logout();
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // 현재 경로가 해당 링크와 일치하는지 확인하는 함수
  const isActiveLink = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="header">
      <div className="headerlogo">
        <div onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src={mainLogo} alt="festive logo" />
        </div>
      </div>
      <nav className="headernav">
        {[
          { name: "이달의 축제", path: "/this-month" },
          { name: "축제달력", path: "/calendar" },
          { name: "지역별 축제", path: "/festival/local" },
          { name: "와글와글", path: "/wagle" },
          { name: "AI 여행코스 추천", path: "/ai-travel" },
          { name: "고객센터", path: "/customer-center" },
          { name: "부스참가신청", path: "/booth" },
          ...(member?.role === "ADMIN"
            ? [{ name: "관리자", path: "/admin" }]
            : []),
        ].map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`headernav-link hover-grow ${
              isActiveLink(item.path) ? "active" : ""
            }`}
          >
            {item.name}
            {item.name === "관리자" &&
              (hasNewReport || hasNewBooth || hasNewInquiry) && (
                <span
                  style={{
                    background: "#ff4757",
                    color: "white",
                    borderRadius: "8px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    padding: "1px 6px",
                    marginLeft: "6px",
                    verticalAlign: "middle",
                    position: "relative",
                    top: "-7px",
                    animation: "popIn 0.3s",
                  }}
                >
                  new!
                </span>
              )}
          </Link>
        ))}
      </nav>
      <div className="headerheader-right">
        <div className="headerweather-placeholder">
          <Weather />
        </div>
        {isLoggedIn ? (
          <div className="header-user-info">
            <Link to="/mypage/profile">
              <img
                src={
                  member?.profileImage
                    ? `${(
                        import.meta.env.VITE_API_URL ||
                        "https://api.festivekorea.site"
                      ).replace(/\/+$/, "")}${
                        member.profileImage.startsWith("/")
                          ? member.profileImage
                          : `/${member.profileImage}`
                      }`
                    : "/logo.png"
                }
                alt="프로필"
                className="header-user-profile"
                onError={(e) => {
                  e.target.src = "/logo.png";
                }}
              />
              <span className="header-user-nickname">
                {member?.nickname || member?.name}
              </span>
            </Link>
            <span
              onClick={isLoggingOut ? undefined : handleLogout}
              className={`headernav-link hover-grow${
                isLoggingOut ? " disabled" : ""
              }`}
              style={
                isLoggingOut ? { pointerEvents: "none", opacity: 0.5 } : {}
              }
            >
              Sign Out
            </span>
          </div>
        ) : (
          <>
            <Link
              to="/signin"
              className={`headernav-link hover-grow ${
                isActiveLink("/signin") ? "active" : ""
              }`}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className={`headernav-link hover-grow ${
                isActiveLink("/signup") ? "active" : ""
              }`}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
