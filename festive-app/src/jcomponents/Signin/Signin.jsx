import { faComment } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosAPI from "../../api/axiosAPI";
import useAuthStore from "../../store/useAuthStore";
import "./Signin.css";

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {

    // 이미 로딩 중이면 아무것도 하지 않고 함수를 종료
    if (loading) {
      return;
    }

    console.log("로그인 시도");
    setLoading(true); // 로딩 상태 시작, 버튼이 비활성화됨

    try {
      const response = await axiosAPI.post(`/auth/login`, {
        id: formData.id,
        password: formData.password,
      });
      const data = response.data;
      
      if (data && data.loginResponse) {
        const { login } = useAuthStore.getState();
        login(data.accessToken, data.loginResponse);
        navigate("/");
      } else {
        console.log("로그인 실패");
      }

    } catch (error) {
      console.log("로그인 중 오류 발생");
      
    } finally {
      // 요청이 성공하든 실패하든 항상 로딩 상태를 해제
      setLoading(false);
    }
  };

  const handleOAuth2Login = (provider) => {
    // 팝업을 화면 중앙에 위치
    const popupWidth = 500;
    const popupHeight = 600;
    const left = window.screenX + (window.outerWidth - popupWidth) / 2;
    const top = window.screenY + (window.outerHeight - popupHeight) / 2;

    // OAuth2 인증 URL
    const oauthUrl = `${
      import.meta.env.VITE_API_URL
    }/oauth2/authorization/${provider}`;

    // 팝업을 통해 OAuth2 로그인 요청
    const popup = window.open(
      oauthUrl,
      "oauth2",
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
    );

    // 팝업이 차단되었는지 확인
    if (!popup) {
      alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
      return;
    }

    // 팝업에서 응답을 받기 위한 이벤트 리스너
    const handlePopupMessage = (event) => {
      // 팝업에서 부모 창으로 보내는 메시지인지 확인
      if (event.source === popup) {
        if (event.data.accessToken) {
          // 성공: accessToken 저장
          const { setAccessToken } = useAuthStore.getState();
          setAccessToken(event.data.accessToken);

          // 메인 페이지로 이동
          navigate("/");
        } else if (event.data.error) {
          // 오류: 오류 메시지 표시
          alert(event.data.error);
        }

        // 팝업 닫기
        popup.close();

        // 이벤트 리스너 제거
        window.removeEventListener("message", handlePopupMessage);
      }
    };

    // 부모 창에서 팝업 메시지 수신
    window.addEventListener("message", handlePopupMessage);

    // 팝업이 닫혔는지 주기적으로 확인 (타임아웃 처리)
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handlePopupMessage);
      }
    }, 1000);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          {/* 제목 */}
          <div className="login-header">
            <h2 className="login-title">Log-in</h2>
          </div>

          {/* 로그인 폼 */}
          <div className="login-form">
            {/* ID 입력 필드 */}
            <div className="info-input-group">
              <label htmlFor="id" className="input-label">
                ID
              </label>
              <input
                id="id"
                name="id"
                type="text"
                required
                value={formData.id}
                onChange={handleInputChange}
                placeholder="아이디"
                className="input-field"
              />
            </div>

            {/* 패스워드 입력 필드 */}
            <div className="info-input-group">
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                placeholder="비밀번호"
                className="input-field"
              />
            </div>

            {/* 아이디 찾기 | 비밀번호 찾기 링크 */}
            <div className="find-links">
              <div className="find-links-content">
                <Link to="/find?tab=id" className="find-link">
                  아이디 찾기
                </Link>
                <span className="separator">|</span>
                <Link to="/find?tab=pw" className="find-link">
                  비밀번호 찾기
                </Link>
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="button-group">
              <Link to="/signup" className="btn btn-signup">
                회원가입
              </Link>
              <button
                type="button"
                onClick={handleLogin}
                className="btn btn-login"
                disabled={loading} // loading이 true일 때 버튼을 비활성화
              >
              {loading ? "로그인 중..." : "로그인"}
            </button>
            </div>

            {/* SNS 로그인 섹션 */}
            <div className="sns-section">
              <div className="sns-title">
                <span>SNS 계정으로 간편하게 시작하기</span>
              </div>

              <div className="sns-buttons">
                {/* Google 로그인 */}
                <button
                  className="sns-btn sns-google"
                  onClick={() => handleOAuth2Login("google")}
                >
                  <div className="google-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: "block" }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      ></path>
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      ></path>
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      ></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                </button>

                {/* Naver 로그인 */}
                <button
                  type="button"
                  className="sns-btn sns-naver"
                  onClick={() => handleOAuth2Login("naver")}
                >
                  <span>N</span>
                </button>

                {/* Kakao 로그인 */}
                <button
                  type="button"
                  className="sns-btn sns-kakao"
                  onClick={() => handleOAuth2Login("kakao")}
                >
                  <div className="kakao-icon">
                    <FontAwesomeIcon className="kakao-item" icon={faComment} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
