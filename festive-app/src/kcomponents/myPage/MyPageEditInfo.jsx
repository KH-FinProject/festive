import React, { useState, useRef, useEffect, useCallback } from "react";
import "./MyPageWithdrawal.css";
import "./MyPageEditInfo.css";
import MyPageSideBar from "./MyPageSideBar";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import axiosApi from "../../api/axiosAPI";
import { useDebounce } from "../../hooks/useDebounce";

const MyPageEditInfo = () => {
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);

    const [memberInfo, setMemberInfo] = useState({
        tel: { carrier: "", middle: "", last: "" },
        email: { local: "", domain: "" },
        address: { zipcode: "", detail: "", extra: "" },
        password: "",
    });

    // 이메일 인증 관련 state
    const [newEmailLocal, setNewEmailLocal] = useState("");
    const [newEmailDomain, setNewEmailDomain] = useState("");
    const [customDomain, setCustomDomain] = useState("");
    const [inputCode, setInputCode] = useState("");
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [emailAuthStatus, setEmailAuthStatus] = useState({ checked: false, available: false, message: "" });

    // 전화번호 인증 관련 state
    const [newPhoneCarrier, setNewPhoneCarrier] = useState("");
    const [newPhoneMiddle, setNewPhoneMiddle] = useState("");
    const [newPhoneLast, setNewPhoneLast] = useState("");
    const [phoneInputCode, setPhoneInputCode] = useState("");
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [phoneTimeLeft, setPhoneTimeLeft] = useState(0);
    const phoneTimerRef = useRef(null);
    const [isPhoneLoading, setIsPhoneLoading] = useState(false);
    const [phoneAuthStatus, setPhoneAuthStatus] = useState({ checked: false, available: false, message: "" });

    const location = useLocation();
    const { name, profileImageUrl } = location.state || {};
    const navigate = useNavigate();
    const { member } = useAuthStore();

    // 셀렉트박스 옵션
    const emailDomains = [
        { value: "", label: "선택하세요" },
        { value: "gmail.com", label: "gmail.com" },
        { value: "naver.com", label: "naver.com" },
        { value: "hanmail.net", label: "hanmail.net" },
        { value: "daum.net", label: "daum.net" },
        { value: "yahoo.com", label: "yahoo.com" },
        { value: "hotmail.com", label: "hotmail.com" },
        { value: "outlook.com", label: "outlook.com" },
        { value: "custom", label: "직접입력" },
    ];
    const phoneCarriers = [
        { value: "", label: "선택" },
        { value: "010", label: "010" }, { value: "011", label: "011" },
        { value: "016", label: "016" }, { value: "017", label: "017" },
        { value: "018", label: "018" }, { value: "019", label: "019" },
    ];

    // 회원정보 불러오기
    const fetchMyInfo = useCallback(async () => {
        if (!member) {
            alert("로그인이 필요합니다."); navigate("/signin"); return;
        }
        try {
            const { data } = await axiosApi.get("/mypage/info", { withCredentials: true });

            let parsedTel = { carrier: "", middle: "", last: "" };
            if (data.tel && data.tel.length === 11) {
                parsedTel = {
                    carrier: data.tel.substring(0, 3),
                    middle: data.tel.substring(3, 7),
                    last: data.tel.substring(7, 11),
                };
            }
            let parsedEmail = { local: "", domain: "" };
            if (data.email && data.email.includes("@")) {
                const [local, domain] = data.email.split("@");
                parsedEmail = { local, domain };
            }
            let parsedAddress = { zipcode: "", detail: "", extra: "" };
            if (data.address) {
                const fullAddress = data.address;
                const match = fullAddress.match(/^(\d{5})\s(.*?)(\s\(.*\))?$/);
                if (match) {
                    parsedAddress.zipcode = match[1];
                    parsedAddress.detail = match[2].trim();
                    parsedAddress.extra = match[3] ? match[3].replace(/^\s*\(|\)\s*$/g, "") : "";
                } else {
                    const firstSpaceIndex = fullAddress.indexOf(" ");
                    if (firstSpaceIndex !== -1) {
                        parsedAddress.zipcode = fullAddress.substring(0, firstSpaceIndex);
                        parsedAddress.detail = fullAddress.substring(firstSpaceIndex + 1).trim();
                    } else {
                        parsedAddress.detail = fullAddress;
                    }
                    parsedAddress.extra = "";
                }
            }
            setMemberInfo({
                tel: parsedTel, email: parsedEmail, address: parsedAddress, password: "",
            });
            setNewEmailLocal(parsedEmail.local); setNewEmailDomain(parsedEmail.domain); setCustomDomain("");
            setNewPhoneCarrier(parsedTel.carrier); setNewPhoneMiddle(parsedTel.middle); setNewPhoneLast(parsedTel.last);
        } catch (error) {
            console.error("회원 정보 불러오기 실패:", error);
            alert("회원 정보를 불러오는데 실패했습니다.");
        }
    }, [member, navigate]);
    useEffect(() => { fetchMyInfo(); }, [fetchMyInfo]);

    // 이메일 도메인 조합 및 핸들러
    const handleNewEmailDomainChange = (e) => {
        setNewEmailDomain(e.target.value);
        if (e.target.value !== "custom") setCustomDomain("");
    };
    const handleCustomDomainChange = (e) => setCustomDomain(e.target.value);
    const getEmailDomain = () => (newEmailDomain === "custom" ? customDomain : newEmailDomain);

    // 이메일 인증번호 발송
    const handleGenerateVerificationCode = async () => {
        const emailDomain = getEmailDomain();
        let newFullEmail = `${newEmailLocal}@${emailDomain}`;
        if (!newEmailLocal || !emailDomain || !/\S+@\S+\.\S+/.test(newFullEmail)) {
            alert("유효한 이메일 주소를 입력해주세요."); return;
        }
        try {
            setIsEmailLoading(true);
            const { data } = await axiosApi.post("/auth/email/send", { email: newFullEmail }, { withCredentials: true });
            alert("이메일로 인증번호가 전송되었습니다.");
            setTimeLeft(300); setIsEmailVerified(false); setInputCode(""); setEmailAuthStatus({ checked: false, available: false, message: "" });
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) { clearInterval(timerRef.current); return 0; }
                    return prev - 1;
                });
            }, 1000);
        } catch (error) {
            alert(error.response?.data?.message || "인증번호 발송 중 오류가 발생했습니다.");
        } finally {
            setIsEmailLoading(false);
        }
    };

    // 이메일 변경 적용
    const handleApplyEmailChange = async () => {
        if (isEmailVerified) return;
        const emailDomain = getEmailDomain();
        const newFullEmail = `${newEmailLocal}@${emailDomain}`;
        try {
            const updatedData = {
                ...memberInfo,
                email: { local: newEmailLocal, domain: emailDomain },
            };
            const fullPhoneNumber = `${updatedData.tel.carrier}${updatedData.tel.middle}${updatedData.tel.last}`;
            let fullAddressForDB = `${updatedData.address.zipcode} ${updatedData.address.detail}`;
            if (updatedData.address.extra) { fullAddressForDB += ` (${updatedData.address.extra})`; }
            const { data } = await axiosApi.post("/mypage/edit-info", {
                tel: fullPhoneNumber,
                email: newFullEmail,
                address: fullAddressForDB,
                password: member?.socialId ? undefined : updatedData.password,
            }, { withCredentials: true });
            alert(data.message);
            setShowEmailModal(false);
            fetchMyInfo();
        } catch (error) {
            alert(error.response?.data?.message || "이메일 변경 실패");
        }
    };

    // 전화번호 인증번호 발송
    const handlePhoneCarrierChange = (e) => setNewPhoneCarrier(e.target.value);
    const handlePhoneMiddleChange = (e) => setNewPhoneMiddle(e.target.value.replace(/[^0-9]/g, ""));
    const handlePhoneLastChange = (e) => setNewPhoneLast(e.target.value.replace(/[^0-9]/g, ""));

    const handleGeneratePhoneVerificationCode = async () => {
        const fullPhone = `${newPhoneCarrier}${newPhoneMiddle}${newPhoneLast}`;
        if (!/^\d{10,11}$/.test(fullPhone)) {
            alert("유효한 전화번호를 입력해주세요."); return;
        }
        try {
            setIsPhoneLoading(true);
            const { data } = await axiosApi.post("/auth/sms", { tel: fullPhone }, { withCredentials: true });
            alert("전화번호로 인증번호가 전송되었습니다.");
            setPhoneTimeLeft(300); setIsPhoneVerified(false); setPhoneInputCode(""); setPhoneAuthStatus({ checked: false, available: false, message: "" });
            if (phoneTimerRef.current) clearInterval(phoneTimerRef.current);
            phoneTimerRef.current = setInterval(() => {
                setPhoneTimeLeft((prev) => {
                    if (prev <= 1) { clearInterval(phoneTimerRef.current); return 0; }
                    return prev - 1;
                });
            }, 1000);
        } catch (error) {
            alert(error.response?.data?.message || "인증번호 발송 중 오류가 발생했습니다.");
        } finally {
            setIsPhoneLoading(false);
        }
    };

    // 전화번호 변경 적용
    const handleApplyPhoneChange = async () => {
        if (!isPhoneVerified) return;
        const fullPhoneNumber = `${newPhoneCarrier}${newPhoneMiddle}${newPhoneLast}`;
        const fullEmail = `${memberInfo.email.local}@${memberInfo.email.domain}`;
        let fullAddressForDB = `${memberInfo.address.zipcode} ${memberInfo.address.detail}`;
        if (memberInfo.address.extra) { fullAddressForDB += ` (${memberInfo.address.extra})`; }
        try {
            const { data } = await axiosApi.post("/mypage/edit-info", {
                tel: fullPhoneNumber,
                email: fullEmail,
                address: fullAddressForDB,
                password: member?.socialId ? undefined : memberInfo.password,
            }, { withCredentials: true });
            alert("전화번호가 변경되었습니다.");
            setShowPhoneModal(false);
            fetchMyInfo();
        } catch (error) {
            alert(error.response?.data?.message || "전화번호 변경 실패");
        }
    };

    const [formData, setFormData] = useState({
        name: '', nickname: '', email: '', tel: '', authKey: '', id: '', password: '', passwordConfirm: '',
        address: { zipcode: '', detail: '', extra: '' },
        authMethod: 'email'
    });

    const [duplicateStatus, setDuplicateStatus] = useState({
        email: { checked: false, available: false, message: '' },
        authKey: { checked: false, available: false, message: '' } // 인증번호 상태 추가
    });

    const debounced = {
        email: useDebounce(formData.email, 500),
        authKey: useDebounce(formData.authKey, 500)
    };

    // 7. useEffect: 인증번호 실시간 체크
    useEffect(() => {
        const checkAuthKey = async () => {
            if ((!debounced.email && !formData.tel) || !debounced.authKey) {
                setDuplicateStatus(prev => ({ ...prev, authKey: { checked: false, available: false, message: '' } }));
                return;
            }
            try {
                const res = await axiosApi.post('/auth/checkAuthKey', {
                    email: debounced.email,
                    tel: formData.tel,
                    authKey: debounced.authKey,
                    authMethod: formData.authMethod
                });

                if (res.data.success) {
                    setDuplicateStatus(prev => ({ ...prev, authKey: { checked: true, available: true, message: '인증 성공!' } }));
                } else {
                    setDuplicateStatus(prev => ({ ...prev, authKey: { checked: true, available: false, message: res.data.message || '인증번호가 일치하지 않습니다.' } }));
                }

            } catch (error) {
                // 서버에서 401, 400 등 에러 응답 시 메시지를 그대로 안내
                const msg = error.response?.data?.message || '서버 오류';
                setDuplicateStatus(prev => ({ ...prev, authKey: { checked: true, available: false, message: msg } }));
            }
        };

        if (debounced.authKey.length === 6) {
            checkAuthKey();
        } else {
            setDuplicateStatus(prev => ({ ...prev, authKey: { checked: false, available: false, message: '' } }));
        }
    }, [debounced.authKey, debounced.email, formData.tel, formData.authMethod]);

    // 주소 검색(카카오 우편번호 서비스)
    const handlePostCode = useCallback(() => {
        new window.daum.Postcode({
            oncomplete: function (data) {
                let fullAddress = data.address;
                let extraAddress = "";
                if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) extraAddress += data.bname;
                if (data.buildingName !== "" && data.apartment === "Y")
                    extraAddress += extraAddress !== "" ? ", " + data.buildingName : data.buildingName;
                setMemberInfo((prev) => ({
                    ...prev,
                    address: {
                        zipcode: data.zonecode,
                        detail: fullAddress,
                        extra: extraAddress,
                    },
                }));
            },
        }).open();
    }, []);

    // 개인정보 수정 폼 제출
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!member) { alert("로그인이 필요한 서비스입니다."); navigate("/signin"); return; }
        const fullPhoneNumber = `${memberInfo.tel.carrier}${memberInfo.tel.middle}${memberInfo.tel.last}`;
        const fullEmail = `${memberInfo.email.local}@${memberInfo.email.domain}`;
        let fullAddressForDB = `${memberInfo.address.zipcode} ${memberInfo.address.detail}`;
        if (memberInfo.address.extra) { fullAddressForDB += ` (${memberInfo.address.extra})`; }
        const updatedData = member?.socialId
            ? { tel: fullPhoneNumber, email: fullEmail, address: fullAddressForDB }
            : { tel: fullPhoneNumber, email: fullEmail, address: fullAddressForDB, password: memberInfo.password };
        try {
            const { data } = await axiosApi.post("/mypage/edit-info", updatedData, { withCredentials: true });
            alert(data.message);
            fetchMyInfo();
            setMemberInfo((prev) => ({ ...prev, password: "" }));
        } catch (error) {
            alert(error.response?.data?.message || "정보 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (phoneTimerRef.current) clearInterval(phoneTimerRef.current);
        };
    }, []);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
    };

    const getStatusMessage = (statusObj) => {
        if (!statusObj || !statusObj.checked || !statusObj.message) return null;
        return <span className={`status-message ${statusObj.available ? 'success' : 'error'}`}>{statusObj.message}</span>;
    };

    return (
        <div className="page-container">
            <main className="main-content">
                <MyPageSideBar name={name} profileImageUrl={profileImageUrl} />
                <section className="profile-main">
                    <div className="profile-header">
                        <h1>개인정보 수정</h1>
                        <p>
                            {member?.socialId
                                ? "전화번호, 이메일, 주소만 수정할 수 있습니다."
                                : "현재 비밀번호가 일치하는 경우, 원하시는 개인정보를 수정할 수 있습니다."}
                            <br /><br />
                        </p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="password-content">
                            {/* 전화번호 */}
                            <div className="password-form-row">
                                <label className="form-label">전화번호</label>
                                <div className="form-row">
                                    <select className="form-input phone-carrier" value={memberInfo.tel.carrier} disabled>
                                        {phoneCarriers.map((carrier) => (
                                            <option key={carrier.value} value={carrier.value}>{carrier.label}</option>
                                        ))}
                                    </select>
                                    <span className="phone-separator">-</span>
                                    <input type="text" className="form-input phone-middle" value={memberInfo.tel.middle} disabled />
                                    <span className="phone-separator">-</span>
                                    <input type="text" className="form-input phone-last" value={memberInfo.tel.last} disabled />
                                    <button
                                        type="button"
                                        className="form-button secondary"
                                        onClick={() => {
                                            setShowPhoneModal(true);
                                            setNewPhoneCarrier(memberInfo.tel.carrier);
                                            setNewPhoneMiddle(memberInfo.tel.middle);
                                            setNewPhoneLast(memberInfo.tel.last);
                                            setIsPhoneVerified(false);
                                            setPhoneTimeLeft(0);
                                            setPhoneInputCode("");
                                            setPhoneAuthStatus({ checked: false, available: false, message: "" });
                                            if (phoneTimerRef.current) clearInterval(phoneTimerRef.current);
                                        }}
                                    >
                                        전화번호 수정
                                    </button>
                                </div>
                            </div>
                            <br />

                            {/* 이메일 */}
                            <div className="password-form-row">
                                <label className="form-label">이메일</label>
                                <div className="form-row">
                                    <div className="email-input-container">
                                        <input type="text" className="form-input email-local" value={memberInfo.email.local} readOnly />
                                        <span className="email-separator">@</span>
                                        <input type="text" className="form-input email-domain-static" value={memberInfo.email.domain} readOnly />
                                    </div>
                                    {!member?.socialId && (
                                        <button
                                            type="button"
                                            className="form-button secondary"
                                            onClick={() => {
                                                setShowEmailModal(true);
                                                setNewEmailLocal(memberInfo.email.local);
                                                setNewEmailDomain(memberInfo.email.domain);
                                                setCustomDomain("");
                                                setIsEmailVerified(false);
                                                setTimeLeft(0);
                                                setInputCode("");
                                                setEmailAuthStatus({ checked: false, available: false, message: "" });
                                                if (timerRef.current) clearInterval(timerRef.current);
                                            }}
                                        >
                                            이메일 수정
                                        </button>
                                    )}
                                </div>
                            </div>
                            <br />

                            {/* 주소 */}
                            <div className="password-form-row">
                                <label className="form-label">주소</label>
                                <div className="form-row">
                                    <input type="text" className="form-input" value={memberInfo.address.zipcode} readOnly />
                                    <button type="button" className="form-button secondary" onClick={handlePostCode}>주소 검색</button>
                                </div>
                                <div className="form-row">
                                    <input type="text" className="form-input full-width" value={memberInfo.address.detail} readOnly />
                                </div>
                                <div className="form-row">
                                    <input type="text" className="form-input full-width" placeholder="상세주소" value={memberInfo.address.extra || ""} onChange={(e) =>
                                        setMemberInfo((prev) => ({
                                            ...prev,
                                            address: { ...prev.address, extra: e.target.value },
                                        }))
                                    } />
                                </div>
                            </div>
                            <br />

                            {/* 비밀번호 확인 */}
                            {!member?.socialId && (
                                <div className="password-form-row">
                                    <label className="form-label">본인 확인</label>
                                    <p className="form-note">*비밀번호 확인 후 정보 수정이 가능합니다.</p>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={memberInfo.password}
                                        onChange={(e) =>
                                            setMemberInfo((prev) => ({
                                                ...prev,
                                                password: e.target.value,
                                            }))
                                        }
                                        placeholder="비밀번호"
                                        className="form-input full-width"
                                    />
                                </div>
                            )}
                            {!member?.socialId && <br />}

                            <div className="password-form-buttons">
                                <button type="submit" className="submit-btn">
                                    수정하기
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => navigate("/mypage/info")}
                                >
                                    취소하기
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Email Modal */}
                    {showEmailModal && (
                        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
                            <div className="modal-content" style={{ width: "600px" }} onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>이메일 변경안내</h3>
                                    <button className="modal-close" onClick={() => setShowEmailModal(false)}>×</button>
                                </div>
                                <div className="modal-body">
                                    <p>회원님의 이메일 수정을 위해</p>
                                    <p>새로운 이메일 인증을 받으셔야 합니다.</p>
                                    <br />
                                    <div className="current-email-section">
                                        <div className="email-input-group">
                                            <label>수정할 이메일</label>
                                            <div className="email-input-container modal-email">
                                                <input type="text" className="email-input email-local" placeholder="아이디" value={newEmailLocal} onChange={(e) => setNewEmailLocal(e.target.value)} style={{ width: "130px" }} disabled={isEmailVerified} />
                                                <span className="email-separator">@</span>
                                                <select className="email-input email-domain-select" value={newEmailDomain} onChange={handleNewEmailDomainChange} disabled={isEmailVerified} style={{ width: "130px" }}>
                                                    {emailDomains.map((domain) => (
                                                        <option key={domain.value} value={domain.value}>{domain.label}</option>
                                                    ))}
                                                </select>
                                                {newEmailDomain === "custom" && (
                                                    <input type="text" className="email-input email-custom-domain"
                                                        placeholder="도메인 입력"
                                                        value={customDomain}
                                                        onChange={handleCustomDomainChange}
                                                        disabled={isEmailVerified}
                                                        style={{ width: "130px", marginLeft: "5px" }}
                                                    />
                                                )}
                                            </div>
                                            <button type="button" className="verify-btn" onClick={handleGenerateVerificationCode}
                                                disabled={
                                                    isEmailVerified ||
                                                    (timeLeft > 0 && timeLeft < 300) ||
                                                    !newEmailLocal ||
                                                    !getEmailDomain() ||
                                                    (newEmailDomain === "custom" && (!customDomain || !customDomain.includes("."))) ||
                                                    isEmailLoading
                                                }
                                            >
                                                {isEmailLoading ? "인증중..." : (timeLeft > 0 && !isEmailVerified ? "재전송" : "인증")}
                                            </button>
                                        </div>
                                        <div className="email-input-group">
                                            <label>이메일 인증키</label>
                                            <input type="text" className="email-input" placeholder="인증번호를 입력하세요" value={inputCode} onChange={(e) => {
                                                setInputCode(e.target.value);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    authKey: e.target.value,
                                                }));
                                            }} maxLength={6} disabled={isEmailVerified} />
                                            {getStatusMessage(emailAuthStatus)}
                                        </div>
                                        {timeLeft > 0 && !isEmailVerified && (
                                            <p style={{ color: "red", fontSize: "13px" }}>
                                                <span style={{ marginLeft: "115px" }}>
                                                    남은 시간: {formatTime(timeLeft)}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="modal-button primary" onClick={handleApplyEmailChange} disabled={!isEmailVerified}>이메일 변경 적용</button>
                                    <button type="button" className="modal-button secondary" onClick={() => setShowEmailModal(false)}>취소하기</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phone Modal */}
                    {showPhoneModal && (
                        <div className="modal-overlay" onClick={() => setShowPhoneModal(false)}>
                            <div className="modal-content" style={{ width: "600px" }} onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>전화번호 변경 안내</h3>
                                    <button className="modal-close" onClick={() => setShowPhoneModal(false)}>×</button>
                                </div>
                                <div className="modal-body">
                                    <p>회원님의 전화번호 수정을 위해</p>
                                    <p>새로운 전화번호 인증을 받으셔야 합니다.</p>
                                    <br />
                                    <div className="current-email-section">
                                        <div className="email-input-group">
                                            <label>수정할 전화번호</label>
                                            <div className="form-row" style={{ gap: "8px" }}>
                                                <select className="form-input phone-carrier" value={newPhoneCarrier} onChange={handlePhoneCarrierChange} disabled={isPhoneVerified} style={{ width: "90px" }}>
                                                    {phoneCarriers.map((carrier) => (
                                                        <option key={carrier.value} value={carrier.value}>{carrier.label}</option>
                                                    ))}
                                                </select>
                                                <span className="phone-separator">-</span>
                                                <input type="text" className="form-input phone-middle" placeholder="0000" maxLength="4" style={{ width: "100px" }} value={newPhoneMiddle} onChange={handlePhoneMiddleChange} disabled={isPhoneVerified} />
                                                <span className="phone-separator">-</span>
                                                <input type="text" className="form-input phone-last" placeholder="0000" maxLength="4" style={{ width: "100px" }} value={newPhoneLast} onChange={handlePhoneLastChange} disabled={isPhoneVerified} />
                                            </div>
                                            <button type="button" className="verify-btn" onClick={handleGeneratePhoneVerificationCode} disabled={isPhoneVerified || (phoneTimeLeft > 0 && phoneTimeLeft < 300) || !newPhoneCarrier || !newPhoneMiddle || !newPhoneLast || isPhoneLoading}>
                                                {isPhoneLoading ? "인증중..." : (phoneTimeLeft > 0 && !isPhoneVerified ? "재전송" : "인증")}
                                            </button>
                                        </div>
                                        <div className="email-input-group">
                                            <label>전화번호 인증키</label>
                                            <input type="text" className="email-input" placeholder="인증번호를 입력하세요" value={phoneInputCode} onChange={(e) => {
                                                setPhoneInputCode(e.target.value);
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    authKey: e.target.value,
                                                }));
                                            }} maxLength={6} disabled={isPhoneVerified} />
                                            {getStatusMessage(phoneAuthStatus)}
                                        </div>
                                        {phoneTimeLeft > 0 && !isPhoneVerified && (
                                            <p style={{ color: "red", fontSize: "13px" }}>
                                                <span style={{ marginLeft: "115px" }}>
                                                    남은 시간: {formatTime(phoneTimeLeft)}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="modal-button primary" onClick={handleApplyPhoneChange} disabled={!isPhoneVerified}>전화번호 변경 적용</button>
                                    <button type="button" className="modal-button secondary" onClick={() => setShowPhoneModal(false)}>취소하기</button>
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
