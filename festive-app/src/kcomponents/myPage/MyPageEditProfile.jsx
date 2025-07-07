import React, { useEffect, useState, useRef, useCallback } from "react";
import "./MyPageEditProfile.css";
import "./MyPageWithdrawal.css"; // 공통 스타일 유지
import MyPageSideBar from "./MyPageSideBar.jsx";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import axiosApi from "../../api/axiosAPI";

// 닉네임 유효성 검사 함수 (공백 허용X, 2~15자)
const isValidNickname = (nickname) => {
  if (!nickname) return false;
  if (/\s/.test(nickname)) return false; // 공백 포함시 false
  return nickname.length >= 2 && nickname.length <= 15;
};

const MyPageEditProfile = () => {
  const { updateNickname, updateProfileImage } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    nickname: "",
    profileImageUrl: "",
  });
  const [newProfileImageFile, setNewProfileImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const [isNicknameAvailable, setIsNicknameAvailable] = useState(null); // null: 검사 안함, true: 사용가능, false: 중복
  const [nicknameCheckLoading, setNicknameCheckLoading] = useState(false);

  const originalNicknameRef = useRef("");
  const nicknameCheckTimeout = useRef(null);

  const navigate = useNavigate();

  // --- 초기 프로필 정보 로드 ---
  const fetchProfileInfo = useCallback(async () => {
    try {
      const response = await axiosApi.get(`/mypage/profile`);
      const data = response.data;
      setProfileData({
        name: data.name,
        nickname: data.nickname,
        profileImageUrl: data.profileImage,
      });
      updateProfileImage(data.profileImage); // store도 즉시 갱신!
      originalNicknameRef.current = data.nickname;
      setIsNicknameAvailable(null);
      setNewProfileImageFile(null);
      setPreviewImageUrl(null);
    } catch (err) {
      console.error("회원 프로필 정보 조회 실패", err);
      alert("프로필 정보를 불러오는데 실패했습니다.");
    }
  }, [updateProfileImage]);

  // 컴포넌트 마운트 시에만 프로필 정보 로드
  useEffect(() => {
    fetchProfileInfo();
  }, []);

  // --- 닉네임 중복체크 (입력 시 debounce로 자동) ---
  useEffect(() => {
    const nickname = profileData.nickname?.trim() || "";

    // 자기 닉네임 그대로면 항상 통과
    if (nickname === originalNicknameRef.current) {
      setIsNicknameAvailable(true);
      setNicknameCheckLoading(false);
      return;
    }
    // 닉네임이 유효성 조건(2~15자) 미달이면 미체크
    if (!isValidNickname(nickname)) {
      setIsNicknameAvailable(null);
      setNicknameCheckLoading(false);
      return;
    }
    // debounce
    if (nicknameCheckTimeout.current)
      clearTimeout(nicknameCheckTimeout.current);
    setNicknameCheckLoading(true);
    nicknameCheckTimeout.current = setTimeout(async () => {
      try {
        const response = await axiosApi.get(
          `/mypage/profile/checkNickname?nickname=${nickname}`
        );
        const data = response.data;
        setIsNicknameAvailable(!data.isDuplicate);
      } catch {
        setIsNicknameAvailable(null);
      } finally {
        setNicknameCheckLoading(false);
      }
    }, 400);

    return () => {
      if (nicknameCheckTimeout.current)
        clearTimeout(nicknameCheckTimeout.current);
    };
  }, [profileData.nickname]);

  // --- 입력 값 변경 핸들러 (닉네임 입력 시 공백 자동 제거) ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "nickname") {
      // 모든 공백(스페이스, 탭 등) 자동 제거
      setProfileData((prev) => ({
        ...prev,
        [name]: value.replace(/\s/g, ""),
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // --- 기본 이미지로 변경 핸들러 ---
  const handleResetProfileImage = async () => {
    if (!window.confirm("정말 기본 이미지로 변경하시겠습니까?")) return;

    try {
      const res = await axiosApi.post('/mypage/profile/reset-image');
      if (res.data && res.data.success) {
        alert('기본 이미지로 변경되었습니다.');
        fetchProfileInfo(); // 최신 정보 갱신
        setNewProfileImageFile(null);
        setPreviewImageUrl(null);
      } else {
        alert('기본 이미지 변경에 실패했습니다.');
      }
    } catch (err) {
      alert('기본 이미지 변경 중 오류가 발생했습니다.');
    }
  };

  // --- 프로필 이미지 파일 선택 핸들러 (모달 내부) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImageUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setNewProfileImageFile(null);
      setPreviewImageUrl(null);
    }
  };

  // --- 프로필 사진 업로드 모달 내 '사진 선택 완료' 버튼 클릭 핸들러 ---
  const handleImageSelectComplete = () => {
    setShowModal(false);
    if (newProfileImageFile) {
      alert('"수정하기" 버튼을 눌러 변경사항을 저장하세요.');
    }
  };

  // --- 최종 프로필 정보 수정 (닉네임 + 사진) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 닉네임 유효성 체크
    const nickname = profileData.nickname?.trim() || "";
    if (!isValidNickname(nickname)) {
      alert("닉네임은 2~15자로 입력해주세요.");
      return;
    }
    // 자기 닉네임 아니고 사용 불가(중복) 상태
    if (
      nickname !== originalNicknameRef.current &&
      (!isNicknameAvailable || nicknameCheckLoading)
    ) {
      alert("닉네임 중복 확인 중이거나, 이미 사용 중인 닉네임입니다.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nickname", profileData.nickname);
      if (newProfileImageFile) {
        formData.append("profileImage", newProfileImageFile);
      }
      const response = await fetch(
        "http://localhost:8080/mypage/edit-profile",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      const data = await response.json();

      if (response.ok) {
        // 닉네임이 변경되었으면 스토어 업데이트
        if (profileData.nickname !== originalNicknameRef.current) {
          updateNickname(profileData.nickname);
        }

        alert(data.message);

        // 프로필 이미지가 변경되었으면 최신 정보를 가져와서 스토어 업데이트
        if (newProfileImageFile) {
          // 프로필 이미지 업데이트 후 최신 정보 조회
          setTimeout(() => {
            fetchProfileInfo();
          }, 100);
        }

        setProfileData((prev) => ({ ...prev }));
        setNewProfileImageFile(null);
        setPreviewImageUrl(null);
        originalNicknameRef.current = profileData.nickname;
        setIsNicknameAvailable(null);
      } else {
        alert(`프로필 수정 실패: ${data.message}`);
      }
    } catch {
      console.error("프로필 수정 실패");
      alert("프로필 수정 중 오류가 발생했습니다.");
    }
  };

  // 기본 프로필 이미지 SVG
  const defaultProfileSvg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E";

  // 프로필 이미지 경로 보정 함수
  const getProfileImageSrc = (url) => {
    if (!url) return defaultProfileSvg;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/profile-images/")) return url;
    return `/profile-images/${url}`;
  };

  return (
    <div className="page-container">
      <main className="main-content">
        <MyPageSideBar
          name={profileData.name}
          profileImageUrl={profileData.profileImageUrl}
        />
        <section className="profile-main">
          <div className="profile-header">
            <h1>프로필 수정</h1>
            <p>프로필 사진 또는 닉네임을 수정할 수 있습니다.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="profile-content">
              <div className="profile-avatar-large">
                <img
                  src={
                    previewImageUrl ||
                    getProfileImageSrc(profileData.profileImageUrl)
                  }
                  alt="프로필"
                />
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="edit-btn"
                  onClick={() => setShowModal(true)}
                >
                  사진 변경
                </button>
                <button
                  type="button"
                  className="edit-btn"
                  style={{ marginLeft: "8px", background: "#f0f0f0", color: "#666" }}
                  onClick={handleResetProfileImage}
                >
                  기본 이미지로 변경
                </button>
              </div>


              <div className="form-section">
                <div className="mypage-form-row">
                  <label>닉네임</label>
                  <div className="mypage-input-group">
                    <input
                      type="text"
                      name="nickname"
                      value={profileData.nickname}
                      onChange={handleInputChange}
                      placeholder="닉네임을 입력하세요"
                      minLength={2}
                      maxLength={15}
                      autoComplete="off"
                      pattern="^[^\s]+$"
                      inputMode="text"
                    />
                  </div>
                  {/* 닉네임 안내/검사 메시지 */}
                  {profileData.nickname?.trim() === "" && (
                    <p className="nickname-message info">
                      닉네임을 입력하세요.
                    </p>
                  )}
                  {profileData.nickname?.trim() &&
                    !isValidNickname(profileData.nickname.trim()) && (
                      <p className="nickname-message error">
                        닉네임은 2~15자여야 합니다.
                      </p>
                    )}
                  {isValidNickname(profileData.nickname?.trim() || "") &&
                    profileData.nickname?.trim() !==
                    originalNicknameRef.current &&
                    (nicknameCheckLoading ? (
                      <p className="nickname-message info">중복 확인 중...</p>
                    ) : isNicknameAvailable === false ? (
                      <p className="nickname-message error">
                        이미 사용 중인 닉네임입니다.
                      </p>
                    ) : isNicknameAvailable === true ? (
                      <p className="nickname-message success">
                        사용 가능한 닉네임입니다.
                      </p>
                    ) : null)}
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="submit-btn">
                  수정하기
                </button>
              </div>
            </div>
          </form>
        </section>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "400px" }}
          >
            <div className="modal-header">
              <h3>프로필 사진 변경</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>새로운 프로필 사진을 업로드하세요.</p>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {/* 모달 내 미리보기 */}
              {previewImageUrl && (
                <div style={{ marginTop: "15px", textAlign: "center" }}>
                  <img
                    src={previewImageUrl}
                    alt="미리보기"
                    style={{
                      maxWidth: "100px",
                      maxHeight: "100px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "0.8em",
                      color: "#555",
                      marginTop: "5px",
                    }}
                  >
                    선택된 이미지 미리보기
                  </p>
                </div>
              )}
              {newProfileImageFile && (
                <p style={{ marginTop: "10px", fontSize: "0.9em" }}>
                  선택된 파일: {newProfileImageFile.name}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn primary"
                onClick={handleImageSelectComplete}
              >
                사진 선택 완료
              </button>
              <button
                type="button"
                className="modal-btn"
                onClick={() => {
                  setShowModal(false);
                  setNewProfileImageFile(null);
                  setPreviewImageUrl(null);
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPageEditProfile;
