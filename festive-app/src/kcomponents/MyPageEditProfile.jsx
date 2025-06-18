import React, { useState } from 'react';
import './MyPageEditProfile.css';
import './MyPageWithdrawal.css';

const MyPageEditProfile = () => {
    const [showModal, setShowModal] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        password: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="page-container">

            <main className="main-content">
                <aside className="sidebar">
                    <div className="profile">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E" alt="프로필" />
                        <p>김성환</p>
                    </div>
                    <div className="menu-buttons">
                        <button className="active">프로필 수정</button>
                        <button>개인정보 수정</button>
                        <button>비밀번호 수정</button>
                        <button>내가 찜한 축제</button>
                        <button>내가 쓴 게시글 및 댓글</button>
                        <button>회원 탈퇴</button>
                    </div>
                </aside>

                {/* Main Profile Section */}
                <section className="profile-main">
                    <div className="profile-header">
                        <h1>프로필 수정</h1>
                        <p>현재 비밀번호가 일치하는 경우 새 비밀번호로 변경할 수 있습니다.</p>
                    </div>

                    <div className="profile-content">
                        <div className="profile-avatar-large">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E" alt="프로필" />
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <button className="edit-btn" onClick={() => setShowModal(true)}>
                            사진 변경
                        </button>

                        <div className="form-section">
                            <div className="form-row">
                                <label>닉네임</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        name="name"
                                        value={profileData.name}
                                        onChange={handleInputChange}
                                        placeholder="닉네임을 입력하세요"
                                    />
                                    <button className="check-btn">중복 확인</button>
                                </div>
                            </div>
                        </div>

                        <div className="form-buttons">
                            <button className="submit-btn">수정하기</button>
                            <button className="cancel-btn">취소하기</button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>프로필 사진 변경</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>새로운 프로필 사진을 업로드하세요.</p>
                            <input type="file" accept="image/*" />
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn primary">업로드</button>
                            <button className="modal-btn" onClick={() => setShowModal(false)}>취소</button>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default MyPageEditProfile;