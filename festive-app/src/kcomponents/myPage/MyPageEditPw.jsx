import React, { useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageEditPw.css';
import MyPageSideBar from './MyPageSideBar';

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
                <MyPageSideBar />

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