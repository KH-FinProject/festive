import { Link, useLocation } from "react-router-dom";
import './MyPageSideBar.css';

const MyPageSideBar = () => {
  const location = useLocation();

  return (
    <aside className="mypage-sidebar">
      <br /><br />
      <div className="profile">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E" alt="프로필" />
        <p>김성원</p><br />
      </div>
      <div className="mypage-sidebar-section">
        <Link
          to="/myPage/profile"
          className={`mypage-sidebar-item ${location.pathname === "/myPage/profile" ? "active" : "inactive"
            }`}
        >
          <span>프로필 수정</span>
        </Link>
        <Link
          to="/myPage/info"
          className={`mypage-sidebar-item ${location.pathname === "/myPage/info" ? "active" : "inactive"
            }`}
        >
          <span>개인정보 수정</span>
        </Link>
        <Link
          to="/myPage/pw"
          className={`mypage-sidebar-item ${location.pathname === "/myPage/pw" ? "active" : "inactive"
            }`}
        >
          <span>비밀번호 수정</span>
        </Link>
        <Link
          to="/myPage/mycalendar"
          className={`mypage-sidebar-item ${location.pathname === "/myPage/mycalendar" ? "active" : "inactive"
            }`}
        >
          <span>내가 찜한 축제</span>
        </Link>
        <Link
          to="/myPage/mypost"
          className={`mypage-sidebar-item ${location.pathname === "/myPage/mypost" ? "active" : "inactive"
            }`}
        >
          <span>내가 쓴 게시글 및 댓글</span>
        </Link>
        <Link
          to="/myPage/withdrawal"
          className={`mypage-sidebar-item ${location.pathname === "/myPage/withdrawal" ? "active" : "inactive"
            }`}
        >
          <span>회원 탈퇴</span>
        </Link>
      </div>
    </aside>
  );
};

export default MyPageSideBar;
