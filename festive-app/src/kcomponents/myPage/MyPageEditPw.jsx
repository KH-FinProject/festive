import React, { useState, useEffect, useRef } from "react";
import "./MyPageWithdrawal.css";
import "./MyPageEditPw.css";
import MyPageSideBar from "./MyPageSideBar";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/;


const MyPageEditPw = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [currentPwStatus, setCurrentPwStatus] = useState(""); // "empty" | "checking" | "matched" | "unmatched"
  const [newPwStatus, setNewPwStatus] = useState(""); // "empty" | "valid" | "invalid"
  const [confirmPwStatus, setConfirmPwStatus] = useState(""); // "empty" | "matched" | "unmatched"
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState(""); // success | error

  const currentPwTimeout = useRef(null);

  const location = useLocation();
  const { name, profileImageUrl } = location.state || {};

  const navigate = useNavigate();
  const { member } = useAuthStore();

  // 현재 비밀번호 일치 확인
  useEffect(() => {
    const currentPassword = passwordData.currentPassword;
    setSubmitMessage("");
    setSubmitStatus("");

    if (!currentPassword) {
      setCurrentPwStatus("empty");
      return;
    }

    if (submitMessage) {
      alert(submitMessage);
    }



    setCurrentPwStatus("checking");
    if (currentPwTimeout.current) clearTimeout(currentPwTimeout.current);
    currentPwTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch("http://localhost:8080/mypage/check-current-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ password: currentPassword }),
        });
        const data = await response.json();
        if (response.ok && data.match === true) {
          setCurrentPwStatus("matched");
        } else {
          setCurrentPwStatus("unmatched");
        }
      } catch (e) {
        setCurrentPwStatus("unmatched");
      }
    }, 400);

    return () => {
      if (currentPwTimeout.current) clearTimeout(currentPwTimeout.current);
    };
  }, [passwordData.currentPassword, submitMessage]);

  // 새 비밀번호 유효성 체크
  useEffect(() => {
    setSubmitMessage("");
    setSubmitStatus("");
    if (!passwordData.newPassword) {
      setNewPwStatus("empty");
    } else if (passwordRegex.test(passwordData.newPassword)) {
      setNewPwStatus("valid");
    } else {
      setNewPwStatus("invalid");
    }
  }, [passwordData.newPassword]);

  // 새 비밀번호 확인 일치 여부 체크
  useEffect(() => {
    setSubmitMessage("");
    setSubmitStatus("");
    if (!passwordData.confirmPassword) {
      setConfirmPwStatus("empty");
    } else if (passwordData.newPassword === passwordData.confirmPassword) {
      setConfirmPwStatus("matched");
    } else {
      setConfirmPwStatus("unmatched");
    }
  }, [passwordData.newPassword, passwordData.confirmPassword]);

  // 입력 핸들러
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage("");
    setSubmitStatus("");

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!member) {
      setSubmitMessage("로그인이 필요한 서비스입니다.");
      setSubmitStatus("error");
      navigate("/signin");
      return;
    }

    // 필수 입력 체크
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSubmitMessage("모든 필드를 입력해주세요.");
      setSubmitStatus("error");
      return;
    }

    // 현재 비밀번호 일치
    if (currentPwStatus !== "matched") {
      setSubmitMessage("현재 비밀번호가 일치하지 않습니다.");
      setSubmitStatus("error");
      return;
    }

    // 새 비밀번호 유효성
    if (newPwStatus !== "valid") {
      setSubmitMessage("비밀번호는 영문자+숫자 조합 6~20자로 입력하세요.");
      setSubmitStatus("error");
      return;
    }

    // 새 비밀번호 일치
    if (confirmPwStatus !== "matched") {
      setSubmitMessage("비밀번호 확인이 일치하지 않습니다.");
      setSubmitStatus("error");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/mypage/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.");
        setSubmitStatus("success");
        setTimeout(() => {
          localStorage.clear();
          navigate("/");
        }, 1500);
      } else {
        alert(data.message || "비밀번호 변경 실패");
        setSubmitMessage(data.message || "비밀번호 변경 실패");
        setSubmitStatus("error");
      }
    } catch (error) {
      alert("네트워크 오류 또는 서버 오류가 발생했습니다.");
      setSubmitMessage("네트워크 오류 또는 서버 오류가 발생했습니다.");
      setSubmitStatus("error");
    }
  };

  return (
    <div className="page-container">
      <main className="main-content">
        <MyPageSideBar
          name={name}
          profileImageUrl={profileImageUrl}
        />
        <section className="profile-main">
          <div className="profile-header">
            <h1>비밀번호 수정</h1>
            <p>
              현재 비밀번호가 일치하는 경우 새 비밀번호로 변경할 수 있습니다.
            </p>
          </div>

          <div className="password-content">
            <form className="password-form" onSubmit={handleSubmit} autoComplete="off">
              <div className="password-form-row">
                <label>현재 비밀번호</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="현재 비밀번호를 입력하세요"
                  autoComplete="off"
                />
                {currentPwStatus === "matched" && (
                  <p className="nickname-message success">현재 비밀번호가 일치합니다.</p>
                )}
                {currentPwStatus === "unmatched" && passwordData.currentPassword && (
                  <p className="nickname-message error">현재 비밀번호가 일치하지 않습니다.</p>
                )}
                {currentPwStatus === "checking" && (
                  <p className="nickname-message info">비밀번호 확인 중...</p>
                )}
              </div>

              <div className="password-form-row">
                <label>새 비밀번호</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="새 비밀번호를 입력하세요"
                  autoComplete="off"
                />
                {newPwStatus === "valid" && (
                  <p className="nickname-message success">사용 가능한 비밀번호입니다.</p>
                )}
                {newPwStatus === "invalid" && (
                  <p className="nickname-message error">비밀번호는 영문자+숫자 조합 6~20자여야 합니다.</p>
                )}
              </div>

              <div className="password-form-row">
                <label>새 비밀번호 확인</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="새 비밀번호를 다시 입력하세요"
                  autoComplete="off"
                  onKeyDown={handleKeyDown}
                />
                {confirmPwStatus === "matched" && passwordData.confirmPassword && (
                  <p className="nickname-message success">비밀번호가 일치합니다.</p>
                )}
                {confirmPwStatus === "unmatched" && passwordData.confirmPassword && (
                  <p className="nickname-message error">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>

              <div className="password-form-buttons">
                <button type="submit" className="submit-btn">
                  수정하기
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setCurrentPwStatus("empty");
                    setNewPwStatus("empty");
                    setConfirmPwStatus("empty");
                    setSubmitMessage("");
                    setSubmitStatus("");
                  }}
                >
                  취소하기
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MyPageEditPw;
