import React, { useState } from 'react';
import './MyPageWithdrawal.css';
import MyPageSideBar from './MyPageSideBar';

const MyPageWithdrawal = () => {
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState('');

  // const memberNo = localStorage.getItem("memberNo"); // 실제 상황에 맞게 수정
  // const memberNo = 6;// 실제 상황에 맞게 수정

  const handleWithdrawal = async (e) => {
    e.preventDefault();

    if (!password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    if (!agreed) {
      alert('탈퇴 약관에 동의해주세요.');
      return;
    }

    const confirmed = window.confirm("탈퇴하시겠습니까?");
    if (!confirmed) {
      alert("회원 탈퇴가 취소되었습니다.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/mypage/withdrawal", {

        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          memberNo: 6,
          password: "pass6"
        })
      });

      const text = await response.text();

      if (response.ok) {
        alert("회원 탈퇴가 완료되었습니다.");
        window.location.href = "/";
      } else {
        setMessage(text);
        alert(text);
      }
    } catch (error) {
      setMessage("서버 통신 오류");
      alert("서버 통신 오류");
      console.error("Error:", error);
    }
  };

  return (
    <div className="page-container">
      <main className="main-content">
        <MyPageSideBar />

        <section className="withdrawal-section">
          <div className="profile-header">
            <h1>회원 탈퇴</h1>
            <p>동의하신 후, 비밀번호를 입력하시면 회원이 탈퇴됩니다.<br /><br /></p>
          </div>

          <div className="notice-box">
            <ol>
              <li><h4>회원 탈퇴 시 계정 정보는 즉시 삭제되며 복구가 불가능합니다.</h4>
                <p>탈퇴 시에는 로그인, 축제 찜 목록, 구독, 개인정보 등 모든 서비스 이용이 중지됩니다.</p>
              </li>
              <li><h4>작성하신 게시글 및 댓글은 모두 유지됩니다.</h4>
                <p> 탈퇴 이후에도 다른 이용자들과의 소통 기록(글, 댓글 등)은 커뮤니티의 연속성을 위해 유지됩니다.</p>
              </li>
              <li><h4>구독한 축제 일정 및 알림 내역은 모두 삭제됩니다.</h4>
                <p>향후 동일한 이메일로 재가입하셔도 기존 알림 설정 및 내역은 복구되지 않습니다.</p>
              </li>
              <li><h4>관련 법령에 따라 일정 기간 정보가 보존될 수 있습니다.</h4>
                <p>(예: 이용자 민원 대응, 법적 분쟁 대비 목적 등)</p>
              </li>
              <li><h4>탈퇴 후 일정 기간 동일 계정으로 재가입이 제한될 수 있습니다.</h4></li>
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
            <h5>*비밀번호를 확인 후 회원 탈퇴가 가능합니다.</h5>
            <div className="mypage-input-group">
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={handleWithdrawal}>탈퇴하기</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MyPageWithdrawal;
