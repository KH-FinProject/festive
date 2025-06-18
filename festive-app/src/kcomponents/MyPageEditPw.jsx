import React, { useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageEditPw.css';

const MyPageEditPw = () => {
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
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
                        <button>프로필 수정</button>
                        <button>개인정보 수정</button>
                        <button className="active">비밀번호 수정</button>
                        <button>내가 찜한 축제</button>
                        <button>내가 쓴 게시글 및 댓글</button>
                        <button>회원 탈퇴</button>
                    </div>
                </aside>

                {/* Main Profile Section */}
                <section className="profile-main">
                    <>
                        <div className="profile-header">
                            <h1>비밀번호 수정</h1>
                            <p>현재 비밀번호가 일치하는 경우 새 비밀번호로 변경할 수 있습니다.</p>
                        </div>

                        <div className="password-content">
                            <div className="password-form">
                                <div className="password-form-row">
                                    <label>현재 비밀번호</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="현재 비밀번호를 입력하세요"
                                    />
                                    <div className="error-message">비밀번호가 올바르지 않습니다.</div>
                                </div>

                                <div className="password-form-row">
                                    <label>새 비밀번호</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="새 비밀번호를 입력하세요"
                                    />
                                </div>

                                <div className="password-form-row">
                                    <label>새 비밀번호 확인</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="새 비밀번호를 다시 입력하세요"
                                    />
                                    <div className="error-message">비밀번호가 일치하지 않습니다.</div>
                                </div>

                                <div className="password-form-buttons">
                                    <button className="submit-btn">수정하기</button>
                                    <button className="cancel-btn">취소하기</button>
                                </div>
                            </div>
                        </div>
                    </>
                </section>
            </main>
        </div>
    );
};

export default MyPageEditPw;