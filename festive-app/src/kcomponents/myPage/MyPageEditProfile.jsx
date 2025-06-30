import React, { useEffect, useState, useRef, useCallback } from 'react';
import './MyPageEditProfile.css';
import './MyPageWithdrawal.css'; // 공통 스타일 유지
import MyPageSideBar from "./MyPageSideBar.jsx";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MyPageEditProfile = () => {
    const [showModal, setShowModal] = useState(false); // 프로필 사진 변경 모달
    const [profileData, setProfileData] = useState({
        name: '', // 이름 (display용)
        nickname: '', // 현재 닉네임 (input value)
        currentPassword: '', // 비밀번호 확인용
        profileImageUrl: '', // 현재 프로필 이미지 URL (서버에서 불러온 URL)
    });
    const [newProfileImageFile, setNewProfileImageFile] = useState(null); // 새로 선택한 이미지 파일 객체
    const [previewImageUrl, setPreviewImageUrl] = useState(null); // 선택된 파일의 미리보기 URL

    const [isNicknameChecked, setIsNicknameChecked] = useState(false); // 닉네임 중복 확인 여부
    const [isNicknameAvailable, setIsNicknameAvailable] = useState(false); // 닉네임 사용 가능 여부
    const originalNicknameRef = useRef(''); // 초기 닉네임을 저장할 ref

    const navigate = useNavigate();

    const getAccessToken = useCallback(() => {
        return JSON.parse(localStorage.getItem("auth-store"))?.state?.accessToken;
    }, []);

    // --- 초기 프로필 정보 로드 ---
    const fetchProfileInfo = useCallback(async () => {
        const accessToken = getAccessToken();
        if (!accessToken) {
            alert('로그인이 필요합니다.');
            navigate('/signin');
            return;
        }

        try {
            const response = await axios.get(`http://localhost:8080/mypage/profile`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setProfileData({
                name: response.data.name,
                nickname: response.data.nickname,
                profileImageUrl: response.data.profileImage, // 백엔드에서 profileImage로 받아옴
                currentPassword: '' // 초기 비밀번호는 비워둠
            });
            originalNicknameRef.current = response.data.nickname; // 초기 닉네임 저장
            setIsNicknameChecked(true); // 초기 닉네임은 중복 검사 필요 없음
            setIsNicknameAvailable(true);
            setNewProfileImageFile(null); // 새로운 파일 선택 상태 초기화
            setPreviewImageUrl(null); // 미리보기 URL 초기화
        } catch (err) {
            console.error("회원 프로필 정보 조회 실패", err);
            alert('프로필 정보를 불러오는데 실패했습니다.');
            if (err.response && err.response.status === 401) { // 토큰 만료 등
                navigate('/signin'); // 로그인 페이지로 리디렉션
            }
        }
    }, [getAccessToken, navigate]);

    useEffect(() => {
        fetchProfileInfo();
    }, [fetchProfileInfo]);

    // --- 입력 값 변경 핸들러 ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
        // 닉네임이 변경되면 중복 확인 상태 초기화
        if (name === 'nickname' && value.trim() !== originalNicknameRef.current) {
            setIsNicknameChecked(false);
            setIsNicknameAvailable(false);
        } else if (name === 'nickname' && value.trim() === originalNicknameRef.current) {
            // 닉네임이 원래 닉네임과 같아지면 중복 검사 완료 상태로
            setIsNicknameChecked(true);
            setIsNicknameAvailable(true);
        }
    };

    // --- 닉네임 중복 확인 ---
    const handleNicknameCheck = async () => {
        const nickname = profileData.nickname.trim();
        if (nickname === '') {
            alert('닉네임을 입력해주세요.');
            return;
        }
        if (nickname.length > 20) { // 닉네임 길이 제한 (DB기준 NVARCHAR2(20))
            alert('닉네임은 20자 이하로 입력해주세요.');
            return;
        }

        if (nickname === originalNicknameRef.current) {
            alert('현재 닉네임과 동일합니다. 변경 사항이 없으므로 중복 확인이 필요 없습니다.');
            setIsNicknameChecked(true);
            setIsNicknameAvailable(true);
            return;
        }

        const accessToken = getAccessToken();
        if (!accessToken) {
            alert('로그인이 필요합니다.');
            navigate('/signin');
            return;
        }

        try {
            const response = await axios.get(`http://localhost:8080/mypage/profile/checkNickname?nickname=${nickname}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (response.data.isDuplicate) {
                alert('이미 사용 중인 닉네임입니다.');
                setIsNicknameAvailable(false);
            } else {
                alert('사용 가능한 닉네임입니다.');
                setIsNicknameAvailable(true);
            }
            setIsNicknameChecked(true);
        } catch (error) {
            console.error("닉네임 중복 확인 실패", error);
            alert('닉네임 중복 확인 중 오류가 발생했습니다.');
            setIsNicknameAvailable(false);
            setIsNicknameChecked(false);
        }
    };

    // --- 프로필 이미지 파일 선택 핸들러 (모달 내부) ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewProfileImageFile(file); // 실제 파일 객체 저장

            // 파일 리더를 사용하여 이미지 미리보기 URL 생성
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImageUrl(reader.result); // 미리보기 URL 상태 업데이트
            };
            reader.readAsDataURL(file); // 파일을 Data URL로 읽기
        } else {
            setNewProfileImageFile(null);
            setPreviewImageUrl(null);
        }
    };

    // --- 프로필 사진 업로드 모달 내 '사진 선택 완료' 버튼 클릭 핸들러 ---
    const handleImageSelectComplete = () => {
        setShowModal(false); // 모달 닫기
        // 파일 선택 후 미리보기가 이미지에 반영된 상태이므로, 사용자에게 최종 수정 버튼을 누르도록 안내
        if (newProfileImageFile) {
            alert('사진이 선택되었습니다. "수정하기" 버튼을 눌러 변경사항을 저장하세요.');
        }
    };

    // --- 최종 프로필 정보 수정 (닉네임 + 사진) ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        const accessToken = getAccessToken();
        if (!accessToken) {
            alert('로그인이 필요합니다.');
            navigate('/signin');
            return;
        }

        // 닉네임이 변경되었고, 중복 확인이 완료되지 않았거나 사용 불가능한 경우
        if (profileData.nickname.trim() !== originalNicknameRef.current && (!isNicknameChecked || !isNicknameAvailable)) {
            alert('닉네임 중복 확인을 완료하거나 유효한 닉네임을 입력해주세요.');
            return;
        }

        if (!profileData.currentPassword) {
            alert('비밀번호를 입력해주세요.');
            return;
        }

        const formData = new FormData();
        formData.append('nickname', profileData.nickname); // 닉네임 항상 보냄
        formData.append('password', profileData.currentPassword); // 비밀번호

        if (newProfileImageFile) {
            formData.append('profileImage', newProfileImageFile); // 새 이미지가 있으면 추가
        }

        try {
            const response = await axios.post(`http://localhost:8080/mypage/profile`, formData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    // 'Content-Type': 'multipart/form-data' // axios가 알아서 설정
                },
            });

            if (response.status === 200) { // HTTP 200 OK
                alert(response.data.message);
                // 성공 시 프로필 정보 다시 로드 (업데이트된 이미지 URL 및 닉네임 반영)
                fetchProfileInfo(); // 업데이트된 프로필 정보를 서버에서 다시 가져옴
                setProfileData(prev => ({ ...prev, currentPassword: '' })); // 비밀번호 입력 필드 초기화
                setNewProfileImageFile(null); // 파일 선택 상태 초기화
                setPreviewImageUrl(null); // 미리보기 URL 초기화 (최종 이미지 URL은 profileData.profileImageUrl에 반영됨)

                // originalNicknameRef도 업데이트된 닉네임으로 갱신
                originalNicknameRef.current = profileData.nickname;
                setIsNicknameChecked(true);
                setIsNicknameAvailable(true);

            } else {
                alert(`프로필 수정 실패: ${response.data.message}`);
            }
        } catch (error) {
            console.error("프로필 수정 실패", error);
            if (error.response && error.response.data && error.response.data.message) {
                alert(`프로필 수정 실패: ${error.response.data.message}`);
            } else {
                alert('프로필 수정 중 오류가 발생했습니다.');
            }
        }
    };

    // 기본 프로필 이미지 SVG
    const defaultProfileSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E";

    return (
        <div className="page-container">
            <main className="main-content">
                <MyPageSideBar name={profileData.name} profileImageUrl={profileData.profileImageUrl} />
                <section className="profile-main">
                    <div className="profile-header">
                        <h1>프로필 수정</h1>
                        <p>프로필 사진 또는 닉네임을 수정할 수 있습니다.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="profile-content">
                            <div className="profile-avatar-large">
                                <img
                                    // 미리보기가 있으면 미리보기 사용, 없으면 서버에서 가져온 URL 사용, 둘 다 없으면 기본 SVG
                                    src={previewImageUrl || profileData.profileImageUrl || defaultProfileSvg}
                                    alt="프로필"
                                />
                            </div>

                            <button type="button" className="edit-btn" onClick={() => setShowModal(true)}>
                                사진 변경
                            </button>

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
                                            required
                                            maxLength="20"
                                        />
                                        <button type="button" className="check-btn" onClick={handleNicknameCheck}>중복 확인</button>
                                    </div>
                                    {profileData.nickname.trim() !== originalNicknameRef.current && isNicknameChecked && (
                                        isNicknameAvailable ? (
                                            <p className="nickname-message success">사용 가능한 닉네임입니다.</p>
                                        ) : (
                                            <p className="nickname-message error">이미 사용 중이거나 유효하지 않은 닉네임입니다.</p>
                                        )
                                    )}
                                    {profileData.nickname.trim() !== originalNicknameRef.current && !isNicknameChecked && (
                                        <p className="nickname-message info">닉네임 변경 시 중복 확인이 필요합니다.</p>
                                    )}
                                </div>
                            </div>

                            {/* 비밀번호 확인 필드 추가 */}
                            <div className="form-section">
                                <div className="mypage-form-row">
                                    <label>본인 확인</label>
                                    <p className="form-note">*비밀번호 확인 후 정보 수정이 가능합니다.</p>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        className="form-input full-width"
                                        value={profileData.currentPassword}
                                        onChange={handleInputChange}
                                        placeholder="비밀번호를 입력하세요"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-buttons">
                                <button type="submit" className="submit-btn">수정하기</button>
                                <button type="button" className="cancel-btn" onClick={() => navigate('/mypage/profile')}>취소하기</button>
                            </div>
                        </div>
                    </form>
                </section>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: '400px' }}>
                        <div className="modal-header">
                            <h3>프로필 사진 변경</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>새로운 프로필 사진을 업로드하세요.</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            {/* 모달 내 미리보기 */}
                            {previewImageUrl && (
                                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                    <img src={previewImageUrl} alt="미리보기" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '50%', objectFit: 'cover' }} />
                                    <p style={{ fontSize: '0.8em', color: '#555', marginTop: '5px' }}>선택된 이미지 미리보기</p>
                                </div>
                            )}
                            {newProfileImageFile && (
                                <p style={{ marginTop: '10px', fontSize: '0.9em' }}>선택된 파일: {newProfileImageFile.name}</p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="modal-btn primary" onClick={handleImageSelectComplete}>
                                사진 선택 완료
                            </button>
                            <button type="button" className="modal-btn" onClick={() => {
                                setShowModal(false);
                                setNewProfileImageFile(null); // 모달 닫을 때 선택된 파일 초기화
                                setPreviewImageUrl(null); // 미리보기 초기화
                            }}>취소</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPageEditProfile;