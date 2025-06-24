import { useState, useRef, useEffect } from 'react';
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

    const [timeLeft, setTimeLeft] = useState(0); // 초 단위
    const timerRef = useRef(null);


    const [generatedCode, setGeneratedCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);


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

    const handlePostCode = () => {
        new window.daum.Postcode({
            oncomplete: function (data) {
                const { zonecode, address } = data;
                setAddress(prev => ({
                    ...prev,
                    zipcode: zonecode,
                    detail: address
                }));
            }
        }).open();
    };

    const generateVerificationCode = () => {
        if (!newEmail || !newEmail.includes('@')) {
            alert('이메일을 올바르게 입력해주세요.');
            return;
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        setIsVerified(false);
        setInputCode('');
        setTimeLeft(300); // 5분

        alert(`테스트용 인증번호: ${code}`);

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };


    const handleCodeVerify = () => {
        if (timeLeft === 0) {
            alert('인증 시간이 만료되었습니다.');
            return;
        }

        if (inputCode === generatedCode) {
            alert('인증 성공!');
            setIsVerified(true);
            clearInterval(timerRef.current); // 인증 성공 시 타이머 중지
        } else {
            alert('인증번호가 일치하지 않습니다.');
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);





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
                                    readOnly
                                />
                                <button
                                    className="form-button secondary"
                                    onClick={handlePostCode}
                                >
                                    주소 검색
                                </button>
                            </div>
                            <div className="form-row">
                                <input
                                    type="text"
                                    className="form-input full-width"
                                    placeholder="주소"
                                    value={address.detail}
                                    readOnly
                                />
                            </div>
                            <div className="form-row">
                                <input
                                    type="text"
                                    className="form-input full-width"
                                    placeholder="상세주소"
                                    value={address.extra || ''}
                                    onChange={(e) => setAddress({ ...address, extra: e.target.value })}
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
                                            <button className="verify-btn" onClick={generateVerificationCode}>인증</button>

                                        </div>
                                        <div className="email-input-group">
                                            <label>이메일 인증키</label>
                                            <input
                                                type="text"
                                                className="email-input"
                                                placeholder="인증번호를 입력하세요"
                                                value={inputCode}
                                                onChange={(e) => setInputCode(e.target.value)}
                                            />
                                            <button className="confirm-btn" onClick={handleCodeVerify}>확인</button>

                                        </div>
                                        {timeLeft > 0 && !isVerified && (
                                            <p style={{ color: 'red', fontSize: '13px' }}>
                                                <span style={{ marginLeft: '115px' }}>
                                                    남은 시간: {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                                                    {String(timeLeft % 60).padStart(2, '0')}
                                                </span>
                                            </p>

                                        )}

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