import React, { useState } from 'react';
import './MyPageWithdrawal.css';

const MyPageWithdrawal = () => {
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleWithdrawal = () => {
    if (!password) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    if (!agreed) {
      alert('탈퇴 약관에 동의해주세요.');
      return;
    }
    alert('회원 탈퇴가 완료되었습니다.');
  };

  return (
    <div className="page-container">
      <header className="header">
        <div className="header-content">
          <div className="logo">festive</div>
          <nav className="nav-links">
            <a href="#">이달의 축제</a>
            <a href="#">축제달력</a>
            <a href="#">지역별 축제</a>
            <a href="#">AI 여행코스 추천</a>
            <a href="#">고객센터</a>
            <a href="#">부스참가신청</a>
          </nav>
          <div className="weather-auth">
            <span className="weather">-7°C</span>
            <button>Sign In</button>
            <button>Sign Up</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <div className="profile">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E" alt="프로필" />
            <p>김성환</p>
          </div>
          <div className="menu-buttons">
            <button>프로필 수정</button>
            <button>개인정보 수정</button>
            <button>비밀번호 수정</button>
            <button>내가 찜한 축제</button>
            <button>내가 쓴 게시글 및 댓글</button>
            <button className="active">회원 탈퇴</button>
          </div>
        </aside>

        <section className="withdrawal-section">

          <div className="profile-header">
            <h1>회원 탈퇴</h1>
            <p>동의하신 후, 비밀번호를 입력하시면 회원이 탈퇴됩니다.<br /><br /></p>
          </div>

          <div className="notice-box">
            <ol>
              <li><strong>회원 탈퇴 시 계정 정보는 즉시 삭제되며 복구가 불가능합니다.</strong>
                <p>탈퇴 시에는 로그인, 축제 찜 목록, 구독, 개인정보 등 모든 서비스 이용이 중지됩니다.</p>
              </li>
              <li><strong>작성하신 게시글 및 댓글은 모두 유지됩니다.</strong>
                <p> 탈퇴 이후에도 다른 이용자들과의 소통 기록(글, 댓글 등)은 커뮤니티의 연속성을 위해 유지됩니다.<br />※ 단, 원하실 경우 탈퇴 전에 직접 삭제하실 수 있습니다.</p>
              </li>
              <li><strong>구독한 축제 일정 및 알림 내역은 모두 삭제됩니다.</strong>
                <p>향후 동일한 이메일로 재가입하셔도 기존 알림 설정 및 내역은 복구되지 않습니다.</p></li>
              <li><strong>관련 법령에 따라 일정 기간 정보가 보존될 수 있습니다.</strong>
                <p>(예: 이용자 민원 대응, 법적 분쟁 대비 목적 등)</p></li>
              <li><strong>탈퇴 후 일정 기간 동일 계정으로 재가입이 제한될 수 있습니다.</strong></li>
            </ol>
            <div className="agree-box">
              <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <label htmlFor="agree">동의</label>
            </div>
          </div>

          <div className="confirm-box">
            <h2>본인확인</h2>
            <p>*비밀번호를 확인 후 회원 탈퇴가 가능합니다.</p>
            <div className="input-group">
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

      <footer className="footer">
        <div className="footer-content">
          <div>
            <h3>FESTIVE</h3>
            <p>서울특별시 강서구 상암산업로 99, 월드컵사북</p>
            <p>이메일 : rkdlsrh811@gmail.com</p>
          </div>
          <div>
            <p>회사소개 | 개인정보처리방침 | 이용약관</p>
          </div>
          <div>
            <p className="tel">1588-1234</p>
            <p>09:00 ~ 18:00 (토요일, 공휴일 휴무)</p>
            <p className="copyright">Copyright © MEDIA DESIGNER</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MyPageWithdrawal;
