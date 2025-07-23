import { NavLink, useLocation } from "react-router-dom";
import "./MyPageSideBar.css";
import useAuthStore from "../../store/useAuthStore";

const MyPageSideBar = () => {
  const { member } = useAuthStore();
  const name = member?.name;
  let profileImageUrl = member?.profileImage;
  if (profileImageUrl) {
    const baseUrl = (
      import.meta.env.VITE_API_URL || "https://api.festivekorea.site"
    ).replace(/\/+$/, "");
    const imagePath = profileImageUrl.startsWith("/")
      ? profileImageUrl
      : `/${profileImageUrl}`;
    profileImageUrl = `${baseUrl}${imagePath}`;
  }
  const location = useLocation();

  const handleNavClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <aside className="mypage-sidebar">
      <br />
      <br />
      <div className="profile">
        <img
          src={
            profileImageUrl ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E"
          }
          alt="프로필"
        />
        <p>{name}</p>
        <br />
      </div>
      <div className="mypage-sidebar-section">
        <NavLink
          to="/mypage/profile"
          className={({ isActive }) =>
            `mypage-sidebar-item ${isActive ? "active" : "inactive"}`
          }
          onClick={handleNavClick}
        >
          <span>프로필 수정</span>
        </NavLink>
        <NavLink
          to="/mypage/info"
          state={{ name, profileImageUrl }}
          className={({ isActive }) =>
            `mypage-sidebar-item ${isActive ? "active" : "inactive"}`
          }
          onClick={handleNavClick}
        >
          <span>개인정보 수정</span>
        </NavLink>
        {/* socialId가 없을 때만 비밀번호 수정 메뉴 노출 */}
        {!member?.socialId && (
          <NavLink
            to="/mypage/pw"
            state={{ name, profileImageUrl }}
            className={({ isActive }) =>
              `mypage-sidebar-item ${isActive ? "active" : "inactive"}`
            }
            onClick={handleNavClick}
          >
            <span>비밀번호 수정</span>
          </NavLink>
        )}
        <NavLink
          to="/mypage/mycalendar"
          state={{ name, profileImageUrl }}
          className={({ isActive }) =>
            `mypage-sidebar-item ${isActive ? "active" : "inactive"}`
          }
          onClick={handleNavClick}
        >
          <span>내가 찜한 축제</span>
        </NavLink>
        <NavLink
          to="/mypage/mypost"
          state={{ name, profileImageUrl }}
          className={() =>
            location.pathname === "/mypage/mypost" ||
            location.pathname === "/mypage/mycomment"
              ? "mypage-sidebar-item active"
              : "mypage-sidebar-item inactive"
          }
          onClick={handleNavClick}
        >
          <span>내가 쓴 게시글 및 댓글</span>
        </NavLink>
        <NavLink
          to="/mypage/withdrawal"
          state={{ name, profileImageUrl }}
          className={({ isActive }) =>
            `mypage-sidebar-item ${isActive ? "active" : "inactive"}`
          }
          onClick={handleNavClick}
        >
          <span>회원 탈퇴</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default MyPageSideBar;
