import React, { useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageEditInfo.css';

const MyPageEditInfo = () => {
    const [showEmailModal, setShowEmailModal] = useState(false);
    // const [selectedMenu, setSelectedMenu] = useState('개인정보 수정');

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
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="profile">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23f0f0f0'/%3E%3Ccircle cx='40' cy='35' r='12' fill='%23999'/%3E%3Cpath d='M20 65 Q40 55 60 65' fill='%23999'/%3E%3C/svg%3E" alt="프로필" />
                        <p>김성환</p>
                    </div>
                    <div className="menu-buttons">
                        <button>프로필 수정</button>
                        <button className="active">개인정보 수정</button>
                        <button>비밀번호 수정</button>
                        <button>내가 찜한 축제</button>
                        <button>내가 쓴 게시글 및 댓글</button>
                        <button>회원 탈퇴</button>
                    </div>
                </aside>


                <section className="withdrawal-section">

                    <div className="profile-header">
                        <h1>개인정보 수정</h1>
                        <p>현재 비밀번호가 일치하는 경우, 원하시는 개인정보를 수정할 수 있습니다.<br /><br /></p>
                    </div>

                    {/* Content Area */}

                    <div className="password-content">
                        <div className="form-group">
                            <label className="form-label">전화번호</label>
                            <input type="text" className="form-input full-width" placeholder="010-0000-0000" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">이메일</label>
                            <div className="form-row">
                                <input type="text" className="form-input" placeholder="이메일" />
                                <button
                                    className="form-button secondary"
                                    onClick={() => setShowEmailModal(true)}
                                >
                                    이메일 수정
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">우편번호</label>
                            <div className="form-row">
                                <input type="text" className="form-input" placeholder="우편번호" />
                                <button className="form-button secondary">주소 검색</button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">주소</label>
                            <input type="text" className="form-input full-width" placeholder="주소" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">상세주소</label>
                            <input type="text" className="form-input full-width" placeholder="상세주소" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">보안 확인</label>
                            <p className="form-note">*비밀번호 확인 후 정보 수정이 가능합니다.</p>
                            <input type="password" className="form-input full-width" placeholder="비밀번호" />
                        </div>

                        <div className="password-form-buttons">
                            <button className="submit-btn">수정하기</button>
                            <button className="cancel-btn">취소하기</button>
                        </div>
                    </div>

                    {/* Email Modal */}
                    {showEmailModal && (
                        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>이메일 변경안내</h3>
                                    <button
                                        className="modal-close"
                                        onClick={() => setShowEmailModal(false)}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <p>회원님의 이메일 수정을 위해</p>
                                    <p>새로운 이메일 인증을 받으셔야 합니다.</p>
                                    <br />
                                    <div className="current-email-section">
                                        <div className="email-input-group">
                                            <label>현재 이메일</label>
                                            <input type="email" className="email-input" />
                                        </div>
                                        <div className="email-input-group">
                                            <label>변경할 이메일</label>
                                            <input type="email" className="email-input" />
                                            <button className="verify-btn">인증</button>
                                        </div>
                                        <div className="email-input-group">
                                            <label>이메일 인증키</label>
                                            <input type="text" className="email-input" />
                                            <button className="confirm-btn">확인</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button className="modal-button primary">수정하기</button>
                                    <button
                                        className="modal-button secondary"
                                        onClick={() => setShowEmailModal(false)}
                                    >
                                        취소하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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

export default MyPageEditInfo;