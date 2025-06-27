import React, { useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageEditPw.css';
import MyPageSideBar from './MyPageSideBar';
import { useNavigate } from 'react-router-dom'; // 추가

const MyPageEditPw = () => {
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate(); // useNavigate 사용

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { currentPassword, newPassword, confirmPassword } = passwordData;
        const memberNo = localStorage.getItem('memberNo');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setErrorMessage('모든 필드를 입력해주세요.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/mypage/pw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPw: currentPassword,
                    newPw: newPassword,
                    memberNo
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('비밀번호가 성공적으로 변경되었습니다.\n다시 로그인해주세요.');

                // 로그인 정보 초기화
                localStorage.removeItem('memberNo');
                localStorage.removeItem('loginMember'); // 혹시 loginMember라는 객체 저장했을 경우도 제거

                // 리디렉션
                navigate('/signin');
            } else {
                setErrorMessage(data.message || '비밀번호 변경 실패');
                setSuccessMessage('');
            }
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage('서버와의 통신 중 오류가 발생했습니다.');
            }
        }

    };

    return (
        <div className="page-container">
            <main className="main-content">
                <MyPageSideBar />

                <section className="profile-main">
                    <div className="profile-header">
                        <h1>비밀번호 수정</h1>
                        <p>현재 비밀번호가 일치하는 경우 새 비밀번호로 변경할 수 있습니다.</p>
                    </div>

                    <div className="password-content">
                        <form className="password-form" onSubmit={handleSubmit}>
                            <div className="password-form-row">
                                <label>현재 비밀번호</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="현재 비밀번호를 입력하세요"
                                />
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
                            </div>

                            {errorMessage && <div className="error-message">{errorMessage}</div>}
                            {successMessage && <div className="success-message">{successMessage}</div>}

                            <div className="password-form-buttons">
                                <button type="submit" className="submit-btn">수정하기</button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() =>
                                        setPasswordData({
                                            currentPassword: '',
                                            newPassword: '',
                                            confirmPassword: ''
                                        })
                                    }
                                >
                                    취소하기
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default MyPageEditPw;
