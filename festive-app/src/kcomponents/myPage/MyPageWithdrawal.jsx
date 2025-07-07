import React, { useState } from "react";
import "./MyPageWithdrawal.css";
import MyPageSideBar from "./MyPageSideBar";
import useAuthStore from "../../store/useAuthStore";
import { useLocation, useNavigate } from "react-router-dom";
import axiosApi from "../../api/axiosAPI";

const MyPageWithdrawal = () => {
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { member } = useAuthStore();
  const navigate = useNavigate();

  const location = useLocation();
  const { name, profileImageUrl } = location.state || {};

  const handleWithdrawal = async (e) => {
    e.preventDefault();

    if (!agreed) {
      alert("탈퇴 약관에 동의해주세요.");
      return;
    }

    // 소셜로그인 회원이 아니면(=비밀번호로 확인)
    if (!member?.socialId) {
      if (!password) {
        alert("비밀번호를 입력해주세요.");
        return;
      }
    } else {
      // 소셜로그인 회원은 confirmText 체크
      if (confirmText !== "탈퇴하겠습니다.") {
        alert('"탈퇴하겠습니다."를 정확히 입력해주세요.');
        return;
      }
    }

    const confirmed = window.confirm("탈퇴하시겠습니까?");
    if (!confirmed) {
      alert("회원 탈퇴가 취소되었습니다.");
      return;
    }

    try {
      if (!member) {
        alert("로그인이 필요한 서비스입니다.");
        navigate("/signin");
        return;
      }

      // API 호출 (소셜/일반 공통 - 서버에서 분기 처리)
      const response = await fetch("http://localhost:8080/mypage/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(
          !member.socialId
            ? { password }
            : { socialId: member.socialId }
        ),
      });

      const text = await response.text();

      if (response.ok) {
        handleLogout();
        alert("회원 탈퇴가 완료되었습니다.");
        return;
      } else {
        alert(text);
      }
    } catch (error) {
      alert("서버 통신 오류");
      console.error("Error:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleWithdrawal();
    }
  };

  const handleLogout = async () => {
    // 로그아웃 시 토큰 삭제
    await axiosApi.post("/auth/logout");
    // authStore state 초기화
    useAuthStore.getState().logout();
    navigate("/");
  };

  return (
    <div className="page-container">
      <main className="main-content">
        <MyPageSideBar name={name} profileImageUrl={profileImageUrl} />

        <section className="withdrawal-section">
          <div className="profile-header">
            <h1>회원 탈퇴</h1>
            <p>
              동의하신 후, {member?.socialId ? `"탈퇴하겠습니다."` : "비밀번호"}를 입력하시면 회원이 탈퇴됩니다.
              <br />
              <br />
            </p>
          </div>

          <div className="notice-box">
            <ol>
              <li>
                <h4>
                  회원 탈퇴 시 계정 정보는 즉시 삭제되며 복구가 불가능합니다.
                </h4>
                <p>
                  탈퇴 시에는 로그인, 축제 찜 목록, 구독, 개인정보 등 모든
                  서비스 이용이 중지됩니다.
                </p>
              </li>
              <li>
                <h4>작성하신 게시글 및 댓글은 모두 유지됩니다.</h4>
                <p>
                  탈퇴 이후에도 다른 이용자들과의 소통 기록(글, 댓글 등)은
                  커뮤니티의 연속성을 위해 유지됩니다.
                </p>
              </li>
              <li>
                <h4>구독한 축제 일정 및 알림 내역은 모두 삭제됩니다.</h4>
                <p>
                  향후 동일한 이메일로 재가입하셔도 기존 알림 설정 및 내역은
                  복구되지 않습니다.
                </p>
              </li>
              <li>
                <h4>관련 법령에 따라 일정 기간 정보가 보존될 수 있습니다.</h4>
                <p>(예: 이용자 민원 대응, 법적 분쟁 대비 목적 등)</p>
              </li>
              <li>
                <h4>
                  탈퇴 후 일정 기간 동일 계정으로 재가입이 제한될 수 있습니다.
                </h4>
              </li>
            </ol>

            <div className="agree-box">
              <div className="agree-checkbox-wrapper">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <label htmlFor="agree">위 내용에 동의합니다</label>
              </div>
            </div>
          </div>

          <div className="confirm-box">
            <h4>본인확인</h4>
            <h5>
              {member?.socialId
                ? '* "탈퇴하겠습니다."를 입력해야 회원 탈퇴가 가능합니다.'
                : "*비밀번호를 확인 후 회원 탈퇴가 가능합니다."}
            </h5>
            <div className="mypage-input-group">
              {!member?.socialId ? (
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              ) : (
                <input
                  type="text"
                  placeholder="탈퇴하겠습니다."
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              )}
              <button onClick={handleWithdrawal}>탈퇴하기</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MyPageWithdrawal;
