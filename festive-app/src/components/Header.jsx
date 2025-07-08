import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import mainLogo from "../assets/festiveLogo.png";
import useAuthStore from "../store/useAuthStore";
import { useAdminNotification } from "../mcomponents/AdminNotificationContext.jsx";
import Weather from "../scomponents/weatherAPI/WeatherAPI.jsx";
import axiosApi from "../api/axiosAPI.js";
import "./HeaderFooter.css";

const Header = () => {
  const [login, setLogin] = useState(false);
  const { member, logout, isLoggedIn } = useAuthStore();
  const { hasNewReport, hasNewBooth, hasNewInquiry } = useAdminNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // 로그아웃 관련 상태
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setLogin(isLoggedIn);
  }, [isLoggedIn]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        await axiosApi.post("/auth/logout");

        // 서버 요청 성공 시에만 클라이언트 상태 초기화
        logout();
        navigate("/");
        return;
      } catch (error) {
        retryCount++;
        console.error(
          `로그아웃 요청 실패 (${retryCount}/${maxRetries + 1}):`,
          error
        );

        if (retryCount > maxRetries) {
          // 최대 재시도 횟수 초과
          const errorMessage = getLogoutErrorMessage(error);

          // 보안상 중요한 경우에만 사용자에게 알림
          if (error.response?.status === 401) {
            // 인증 오류는 이미 로그아웃된 상태로 간주
            logout();
            navigate("/");
          } else {
            // 다른 오류는 사용자에게 알림
            alert(
              `로그아웃에 실패했습니다: ${errorMessage}\n잠시 후 다시 시도해주세요.`
            );
          }
        } else {
          // 재시도 전 짧은 대기
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    setIsLoggingOut(false);
  };

  // 에러 메시지 생성 함수
  const getLogoutErrorMessage = (error) => {
    if (error.code === "NETWORK_ERROR") {
      return "네트워크 연결을 확인해주세요.";
    } else if (error.response?.status === 500) {
      return "서버 오류가 발생했습니다.";
    } else if (error.response?.status === 401) {
      return "이미 로그아웃된 상태입니다.";
    } else {
      return "알 수 없는 오류가 발생했습니다.";
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
        {login ? (
          <div className="header-user-info">
            <Link to="/mypage/profile">
              <img
                src={
                  member?.profileImage
                    ? member.profileImage.startsWith("/profile-images/")
                      ? member.profileImage + "?t=" + Date.now()
                      : member.profileImage
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
            <span onClick={handleLogout} className="headernav-link hover-grow">
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
