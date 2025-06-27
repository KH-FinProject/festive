import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import mainLogo from "../assets/festiveLogo.png";
import useAuthStore from "../store/useAuthStore";
import { useAdminNotification } from '../mcomponents/AdminNotificationContext.jsx';
import Weather from "../scomponents/weatherAPI/WeatherAPI.jsx";
import "./HeaderFooter.css";

const Header = () => {
  const [login, setLogin] = useState(false);
  const { member, isLoggedIn } = useAuthStore();
  const { hasNewReport } = useAdminNotification();

  useEffect(() => {
    console.log('Header member:', member);

    setLogin(isLoggedIn);
  }, [isLoggedIn]);

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
          { name: "고객센터", path: "/customer-center" },
          { name: "부스참가신청", path: "/booth" },
          ...(member?.role === "ADMIN"
            ? [{ name: "관리자", path: "/admin" }]
            : []),
        ].map((item) =>
          item.path !== "#" ? (
            <Link
              key={item.name}
              to={item.path}
              className="headernav-link hover-grow"
            >
              {item.name}
              {item.role === "ADMIN" && hasNewReport && (
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
          ) : (
            <a key={item.name} href="#" className="headernav-link hover-grow">
              {item.name}
            </a>
          )
        )}
      </nav>
      <div className="headerheader-right">
        <div className="headerweather-placeholder">
          <Weather />
        </div>
        {login ? (
          <a href={"/mypage/profile"}>
            <div className="header-user-info">
              <img
                src={member?.profileImage || "/logo.png"}
                alt="프로필"
                className="header-user-profile"
                onError={e => { e.target.src = "/logo.png"; }}
              />
              <span className="header-user-nickname">
                {member?.nickname || member?.name}
              </span>
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
};

export default Header;
