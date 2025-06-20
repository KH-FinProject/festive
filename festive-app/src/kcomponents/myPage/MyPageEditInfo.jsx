import React, { useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageEditInfo.css';
import MyPageSideBar from './MyPageSideBar';

const MyPageEditInfo = () => {
    const [showEmailModal, setShowEmailModal] = useState(false);
    // const [selectedMenu, setSelectedMenu] = useState('개인정보 수정');

    return (
        <div className="page-container">

            <main className="main-content">
                <MyPageSideBar />

                <section className="profile-main">

                    <div className="profile-header">
                        <h1>개인정보 수정</h1>
                        <p>현재 비밀번호가 일치하는 경우, 원하시는 개인정보를 수정할 수 있습니다.<br /><br /></p>
                    </div>

                    {/* Content Area */}

                    <div className="password-content">
                        <div className="password-form-row">
                            <label className="form-label">전화번호</label>
                            <input type="text" className="form-input full-width" placeholder="수정할 전화번호를 입력하세요." />
                        </div>
                        <br />
                        <div className="password-form-row">
                            <label className="form-label">이메일</label>
                            <div className="form-row">
                                <input type="text" className="form-input" placeholder="수정할 이메일을 입력하세요." />
                                <button
                                    className="form-button secondary"
                                    onClick={() => setShowEmailModal(true)}
                                >
                                    이메일 수정
                                </button>
                            </div>
                        </div>
                        <br />

                        <div className="password-form-row">
                            <label className="form-label">주소</label>
                            <div className="form-row">
                                <input type="text" className="form-input" placeholder="우편번호" />
                                <button className="form-button secondary">주소 검색</button>
                            </div>
                            <div className="form-row">
                                <input type="text" className="form-input full-width" placeholder="주소" />
                            </div>
                            <div className="form-row">
                                <input type="text" className="form-input full-width" placeholder="상세주소" />
                            </div>
                        </div>
                        <br />
                        <div className="password-form-row">
                            <label className="form-label">본인 확인</label>
                            <p className="form-note">*비밀번호 확인 후 정보 수정이 가능합니다.</p>
                            <input type="password" className="form-input full-width" placeholder="비밀번호" />
                        </div>
                        <br />
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
        </div>
    );
};

export default MyPageEditInfo;