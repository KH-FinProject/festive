import React, { useState } from 'react';
import './MyPageWithdrawal.css';
import './MyPageEditInfo.css';
import MyPageSideBar from './MyPageSideBar';

const MyPageEditInfo = () => {
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [currentEmail, setCurrentEmail] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [currentEmailDomain, setCurrentEmailDomain] = useState('');
    const [newEmailDomain, setNewEmailDomain] = useState('');
    const [phoneNumber, setPhoneNumber] = useState({ carrier: '', middle: '', last: '' });
    const [address, setAddress] = useState({ city: '', district: '', detail: '', zipcode: '' });

    // 이메일 도메인 옵션
    const emailDomains = [
        { value: '', label: '선택하세요' },
        { value: 'gmail.com', label: 'gmail.com' },
        { value: 'naver.com', label: 'naver.com' },
        { value: 'hanmail.net', label: 'hanmail.net' },
        { value: 'daum.net', label: 'daum.net' },
        { value: 'yahoo.com', label: 'yahoo.com' },
        { value: 'hotmail.com', label: 'hotmail.com' },
        { value: 'outlook.com', label: 'outlook.com' },
        { value: 'custom', label: '직접입력' }
    ];

    // 통신사 옵션
    const phoneCarriers = [
        { value: '', label: '선택' },
        { value: '010', label: '010' },
        { value: '011', label: '011' },
        { value: '016', label: '016' },
        { value: '017', label: '017' },
        { value: '018', label: '018' },
        { value: '019', label: '019' }
    ];

    const handleCurrentEmailDomainChange = (e) => {
        const value = e.target.value;
        setCurrentEmailDomain(value);
        if (value !== 'custom') {
            setCurrentEmail(currentEmail.split('@')[0] + (value ? '@' + value : ''));
        }
    };

    const handleNewEmailDomainChange = (e) => {
        const value = e.target.value;
        setNewEmailDomain(value);
        if (value !== 'custom') {
            setNewEmail(newEmail.split('@')[0] + (value ? '@' + value : ''));
        }
    };

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
                            <div className="phone-input-container">
                                <select
                                    className="form-input phone-carrier"
                                    value={phoneNumber.carrier}
                                    onChange={(e) => setPhoneNumber({ ...phoneNumber, carrier: e.target.value })}
                                >
                                    {phoneCarriers.map(carrier => (
                                        <option key={carrier.value} value={carrier.value}>
                                            {carrier.label}
                                        </option>
                                    ))}
                                </select>
                                <span className="phone-separator">-</span>
                                <input
                                    type="text"
                                    className="form-input phone-middle"
                                    placeholder="0000"
                                    maxLength="4"
                                    style={{ width: '100px' }}
                                    value={phoneNumber.middle}
                                    onChange={(e) => setPhoneNumber({ ...phoneNumber, middle: e.target.value })}
                                />
                                <span className="phone-separator">-</span>
                                <input
                                    type="text"
                                    className="form-input phone-last"
                                    placeholder="0000"
                                    maxLength="4"
                                    style={{ width: '100px' }}
                                    value={phoneNumber.last}
                                    onChange={(e) => setPhoneNumber({ ...phoneNumber, last: e.target.value })}
                                />
                            </div>
                        </div>
                        <br />
                        <div className="password-form-row">
                            <label className="form-label">이메일</label>
                            <div className="form-row">
                                <div className="email-input-container">
                                    <input
                                        type="text"
                                        className="form-input email-local"
                                        placeholder="이메일 아이디"
                                        onChange={(e) => {
                                            const localPart = e.target.value;
                                            const domain = currentEmailDomain === 'custom' ? currentEmail.split('@')[1] || '' : currentEmailDomain;
                                            setCurrentEmail(localPart + (domain ? '@' + domain : ''));
                                        }}
                                    />
                                    <span className="email-separator">@</span>
                                    <select
                                        className="form-input email-domain-select"
                                        value={currentEmailDomain}
                                        onChange={handleCurrentEmailDomainChange}
                                    >
                                        {emailDomains.map(domain => (
                                            <option key={domain.value} value={domain.value}>
                                                {domain.label}
                                            </option>
                                        ))}
                                    </select>
                                    {currentEmailDomain === 'custom' && (
                                        <input
                                            type="text"
                                            className="form-input email-custom-domain"
                                            placeholder="도메인 입력"
                                            onChange={(e) => {
                                                const localPart = currentEmail.split('@')[0] || '';
                                                setCurrentEmail(localPart + '@' + e.target.value);
                                            }}
                                        />
                                    )}
                                </div>
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
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="우편번호"
                                    value={address.zipcode}
                                    onChange={(e) => setAddress({ ...address, zipcode: e.target.value })}
                                />
                                <button className="form-button secondary">주소 검색</button>
                            </div>
                            <div className="form-row">
                                <input
                                    type="text"
                                    className="form-input full-width"
                                    placeholder="주소"
                                    value={address.detail}
                                    onChange={(e) => setAddress({ ...address, detail: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <input
                                    type="text"
                                    className="form-input full-width"
                                    placeholder="상세주소"
                                    value={address.detail}
                                    onChange={(e) => setAddress({ ...address, detail: e.target.value })}
                                />
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
                                            <label>수정할 이메일</label>
                                            <div className="email-input-container modal-email">
                                                <input
                                                    type="text"
                                                    className="email-input email-local"
                                                    placeholder="아이디"
                                                    style={{ width: '104.5px' }}
                                                    onChange={(e) => {
                                                        const localPart = e.target.value;
                                                        const domain = newEmailDomain === 'custom' ? newEmail.split('@')[1] || '' : newEmailDomain;
                                                        setNewEmail(localPart + (domain ? '@' + domain : ''));
                                                    }}
                                                />
                                                <span className="email-separator">@</span>
                                                <select
                                                    className="email-input email-domain-select"
                                                    value={newEmailDomain}
                                                    onChange={handleNewEmailDomainChange}
                                                >
                                                    {emailDomains.map(domain => (
                                                        <option key={domain.value} value={domain.value}>
                                                            {domain.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {newEmailDomain === 'custom' && (
                                                    <input
                                                        type="text"
                                                        className="email-input email-custom-domain"
                                                        placeholder="도메인 입력"
                                                        onChange={(e) => {
                                                            const localPart = newEmail.split('@')[0] || '';
                                                            setNewEmail(localPart + '@' + e.target.value);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <button className="verify-btn">인증</button>
                                        </div>
                                        <div className="email-input-group">
                                            <label>이메일 인증키</label>
                                            <input type="text" className="email-input" placeholder="인증번호를 입력하세요" />
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