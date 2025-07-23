import { faComment } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axiosApi from "../../api/axiosAPI";
import useAuthStore from "../../store/useAuthStore";
import "./Signin.css";

const LoginForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    id: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  // OAuth 에러 확인
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "oauth_failed") {
      alert("소셜 로그인에 실패했습니다. 다시 시도해주세요.");
      // URL에서 error 파라미터 제거
      navigate("/signin", { replace: true });
    } else if (error === "withdrawn") {
      alert("탈퇴한 계정입니다. 관리자에게 문의 바랍니다.");
      // URL에서 error 파라미터 제거
      navigate("/signin", { replace: true });
    }
  }, [searchParams, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
  }

  const handleLogin = async (e) => {
    // 이미 로딩 중이면 아무것도 하지 않고 함수를 종료
    if (loading) {
      return;
    }
    setLoading(true); // 로딩 상태 시작, 버튼이 비활성화됨

    try {
      const response = await axiosApi.post(`/auth/login`, {
        id: formData.id,
        password: formData.password,
      });
      const data = response.data;

      if (data) {
        const { login } = useAuthStore.getState();
        login(data);

        navigate("/");
      }
    } catch (error) {
      alert(error.response.data);
    } finally {
      // 요청이 성공하든 실패하든 항상 로딩 상태를 해제
      setLoading(false);
    }
  };

  const handleOAuth2Login = (provider) => {
    // OAuth2 인증 URL 리다이렉트 (배포된 백엔드 서버로 요청)
    window.location.href = `https://api.festivekorea.site/oauth2/authorization/${provider}`;

    // CustomSuccessHandler.java 참고
    // OAuth2 소셜 로그인 인증 이후 서버에서 자동으로 프론트엔드로 리다이렉트 됨
    // 프론트엔드에서는 리다이렉트 된 페이지에서 토큰을 쿠키에 저장하고, 로그인 상태를 유지함
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
              <label htmlFor="id" className="login-input-label">
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
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* 패스워드 입력 필드 */}
            <div className="info-input-group">
              <label htmlFor="password" className="login-input-label">
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
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
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
                        fill="#60a5fa"
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
