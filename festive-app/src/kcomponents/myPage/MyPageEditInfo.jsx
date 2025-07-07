import React, { useState, useRef, useEffect, useCallback } from "react";
import "./MyPageWithdrawal.css";
import "./MyPageEditInfo.css";
import MyPageSideBar from "./MyPageSideBar";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

const MyPageEditInfo = () => {
    const [showEmailModal, setShowEmailModal] = useState(false);

    // 사용자 현재 정보 상태
    const [memberInfo, setMemberInfo] = useState({
        tel: { carrier: "", middle: "", last: "" },
        email: { local: "", domain: "" },
        address: { zipcode: "", detail: "", extra: "" },
        password: "", // 현재 비밀번호 확인용
    });

    // 이메일 변경 모달 관련 상태
    const [newEmailLocal, setNewEmailLocal] = useState("");
    const [newEmailDomain, setNewEmailDomain] = useState("");
    const [inputCode, setInputCode] = useState("");
    const [isEmailVerified, setIsEmailVerified] = useState(false); // 이메일 인증 여부
    const [timeLeft, setTimeLeft] = useState(0); // 초 단위
    const timerRef = useRef(null);

    const location = useLocation();
    const { name, profileImageUrl } = location.state || {};

    const navigate = useNavigate();
    const { member } = useAuthStore();

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    // 이메일 도메인 옵션
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

    // 통신사 옵션
    const phoneCarriers = [
        { value: "", label: "선택" },
        { value: "010", label: "010" },
        { value: "011", label: "011" },
        { value: "016", label: "016" },
        { value: "017", label: "017" },
        { value: "018", label: "018" },
        { value: "019", label: "019" },
    ];

    // --- 초기 정보 로드 ---
    const fetchMyInfo = useCallback(async () => {
        if (!member) {
            alert("로그인이 필요합니다.");
            navigate("/signin");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/mypage/info", {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Failed to fetch member info");
            }
            const data = await response.json();
            // console.log("Fetched Member Info:", data);

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
                const emailParts = data.email.split("@");
                parsedEmail = {
                    local: emailParts[0],
                    domain: emailParts[1],
                };
            }

            let parsedAddress = { zipcode: "", detail: "", extra: "" };
            if (data.address) {
                const fullAddress = data.address;
                const match = fullAddress.match(/^(\d{5})\s(.*?)(\s\(.*\))?$/); // "우편번호 전체주소 (상세주소)" 패턴
                if (match) {
                    parsedAddress.zipcode = match[1];
                    parsedAddress.detail = match[2].trim();
                    parsedAddress.extra = match[3]
                        ? match[3].replace(/^\s*\(|\)\s*$/g, "")
                        : "";
                } else {
                    const firstSpaceIndex = fullAddress.indexOf(" ");
                    if (firstSpaceIndex !== -1) {
                        parsedAddress.zipcode = fullAddress.substring(0, firstSpaceIndex);
                        parsedAddress.detail = fullAddress
                            .substring(firstSpaceIndex + 1)
                            .trim();
                    } else {
                        parsedAddress.detail = fullAddress;
                    }
                    parsedAddress.extra = "";
                }
            }

            setMemberInfo({
                tel: parsedTel,
                email: parsedEmail,
                address: parsedAddress,
                password: "",
            });

            setNewEmailLocal(parsedEmail.local);
            setNewEmailDomain(parsedEmail.domain);
        } catch (error) {
            console.error("회원 정보 불러오기 실패:", error);
            alert("회원 정보를 불러오는데 실패했습니다.");
        }
    }, [member, navigate]);

    useEffect(() => {
        fetchMyInfo();
    }, [fetchMyInfo]);

    // --- 이메일 변경 모달 관련 핸들러 ---
    const handleNewEmailDomainChange = (e) => {
        const value = e.target.value;
        setNewEmailDomain(value);
    };

    const handleGenerateVerificationCode = async () => {
        let newFullEmail;
        if (newEmailDomain === "custom") {
            newFullEmail = `${newEmailLocal}@${newEmailDomain}`;
        } else {
            newFullEmail = `${newEmailLocal}@${newEmailDomain}`;
        }

        if (!newFullEmail || !/\S+@\S+\.\S+/.test(newFullEmail)) {
            alert("유효한 이메일 주소를 입력해주세요.");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/auth/email/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email: newFullEmail }),
            });

            const duplicateData = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    alert(duplicateData.message);
                    return;
                } else {
                    throw new Error(duplicateData.message || "인증번호 발송 실패");
                }
            }

            alert(duplicateData.message);
            setTimeLeft(300);
            setIsEmailVerified(false);
            setInputCode("");

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error) {
            console.error("이메일 인증 코드 발송 오류:", error);
            alert(`인증번호 발송 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    const handleVerifyEmailCode = async () => {
        let newFullEmail;
        if (newEmailDomain === "custom") {
            newFullEmail = `${newEmailLocal}@${newEmailDomain}`;
        } else {
            newFullEmail = `${newEmailLocal}@${newEmailDomain}`;
        }

        if (timeLeft === 0) {
            alert("인증 시간이 만료되었습니다.");
            return;
        }

        if (!inputCode) {
            alert("인증번호를 입력해주세요.");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/auth/email/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email: newFullEmail, authKey: inputCode }),
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                setIsEmailVerified(true);
                clearInterval(timerRef.current);

                setMemberInfo((prev) => ({
                    ...prev,
                    email: {
                        local: newEmailLocal,
                        domain: newEmailDomain,
                    },
                }));
                setShowEmailModal(false);
            } else {
                alert(`인증 실패: ${data.message}`);
                setIsEmailVerified(false);
            }
        } catch (error) {
            console.error("이메일 인증 코드 확인 오류:", error);
            alert(`인증번호 확인 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    const handlePostCode = useCallback(() => {
        new window.daum.Postcode({
            oncomplete: function (data) {
                let fullAddress = data.address;
                let extraAddress = "";

                if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) {
                    extraAddress += data.bname;
                }
                if (data.buildingName !== "" && data.apartment === "Y") {
                    extraAddress +=
                        extraAddress !== "" ? ", " + data.buildingName : data.buildingName;
                }

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!member) {
            alert("로그인이 필요한 서비스입니다.");
            navigate("/signin");
            return;
        }

        const fullPhoneNumber = `${memberInfo.tel.carrier}${memberInfo.tel.middle}${memberInfo.tel.last}`;
        const fullEmail = `${memberInfo.email.local}@${memberInfo.email.domain}`;

        let fullAddressForDB = `${memberInfo.address.zipcode} ${memberInfo.address.detail}`;
        if (memberInfo.address.extra) {
            fullAddressForDB += ` (${memberInfo.address.extra})`;
        }

        // 소셜 로그인 사용자는 currentPassword 없이 업데이트
        const updatedData = member?.socialId
            ? {
                tel: fullPhoneNumber,
                email: fullEmail,
                address: fullAddressForDB,
            }
            : {
                tel: fullPhoneNumber,
                email: fullEmail,
                address: fullAddressForDB,
                currentPassword: memberInfo.password,
            };

        try {
            const response = await fetch("http://localhost:8080/mypage/edit-info", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(updatedData),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                fetchMyInfo();
                setMemberInfo((prev) => ({ ...prev, password: "" }));
            } else {
                alert(`정보 수정 실패: ${data.message}`);
            }
        } catch (error) {
            console.error("정보 수정 중 오류 발생:", error);
            alert("정보 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    return (
        <div className="page-container">
            <main className="main-content">
                <MyPageSideBar
                    name={name}
                    profileImageUrl={profileImageUrl}
                />

                <section className="profile-main">
                    <div className="profile-header">
                        <h1>개인정보 수정</h1>
                        <p>
                            {member?.socialId
                                ? "전화번호, 이메일, 주소만 수정할 수 있습니다."
                                : "현재 비밀번호가 일치하는 경우, 원하시는 개인정보를 수정할 수 있습니다."}
                            <br />
                            <br />
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="password-content">
                            {/* 전화번호 */}
                            <div className="password-form-row">
                                <label className="form-label">전화번호</label>
                                <div className="phone-input-container">
                                    <select
                                        className="form-input phone-carrier"
                                        value={memberInfo.tel.carrier}
                                        onChange={(e) =>
                                            setMemberInfo((prev) => ({
                                                ...prev,
                                                tel: { ...prev.tel, carrier: e.target.value },
                                            }))
                                        }
                                    >
                                        {phoneCarriers.map((carrier) => (
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
                                        style={{ width: "100px" }}
                                        value={memberInfo.tel.middle}
                                        onChange={(e) =>
                                            setMemberInfo((prev) => ({
                                                ...prev,
                                                tel: { ...prev.tel, middle: e.target.value },
                                            }))
                                        }
                                    />
                                    <span className="phone-separator">-</span>
                                    <input
                                        type="text"
                                        className="form-input phone-last"
                                        placeholder="0000"
                                        maxLength="4"
                                        style={{ width: "100px" }}
                                        value={memberInfo.tel.last}
                                        onChange={(e) =>
                                            setMemberInfo((prev) => ({
                                                ...prev,
                                                tel: { ...prev.tel, last: e.target.value },
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <br />

                            {/* 이메일 */}
                            <div className="password-form-row">
                                <label className="form-label">이메일</label>
                                <div className="form-row">
                                    <div className="email-input-container">
                                        <input
                                            type="text"
                                            className="form-input email-local"
                                            placeholder="이메일 아이디"
                                            value={memberInfo.email.local}
                                            style={{ width: "180px" }}
                                            readOnly
                                        />
                                        <span className="email-separator">@</span>
                                        <input
                                            type="text"
                                            className="form-input email-domain-static"
                                            value={memberInfo.email.domain}
                                            style={{ width: "180px" }}
                                            readOnly
                                        />
                                    </div>
                                    {/* socialId 없을 때만 이메일 수정 버튼 노출 */}
                                    {!member?.socialId && (
                                        <button
                                            type="button"
                                            className="form-button secondary"
                                            onClick={() => {
                                                setShowEmailModal(true);
                                                setNewEmailLocal(memberInfo.email.local);
                                                setNewEmailDomain(memberInfo.email.domain);
                                                setIsEmailVerified(false);
                                                setTimeLeft(0);
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
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="우편번호"
                                        value={memberInfo.address.zipcode}
                                        readOnly
                                    />
                                    <button
                                        type="button"
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
                                        value={memberInfo.address.detail}
                                        readOnly
                                    />
                                </div>
                                <div className="form-row">
                                    <input
                                        type="text"
                                        className="form-input full-width"
                                        placeholder="상세주소"
                                        value={memberInfo.address.extra || ""}
                                        onChange={(e) =>
                                            setMemberInfo((prev) => ({
                                                ...prev,
                                                address: { ...prev.address, extra: e.target.value },
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <br />

                            {/* 본인 확인 비밀번호: socialId 없을 때만 표시 */}
                            {!member?.socialId && (
                                <div className="password-form-row">
                                    <label className="form-label">본인 확인</label>
                                    <p className="form-note">
                                        *비밀번호 확인 후 정보 수정이 가능합니다.
                                    </p>
                                    {/* <input
                                        type="password"
                                        className="form-input full-width"
                                        placeholder="비밀번호"
                                        value={memberInfo.password}
                                        onChange={(e) =>
                                            setMemberInfo((prev) => ({
                                                ...prev,
                                                password: e.target.value,
                                            }))
                                        }
                                        required
                                    /> */}
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
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                            )}
                            {!member?.socialId && <br />}

                            {/* 폼 버튼 */}
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
                        <div
                            className="modal-overlay"
                            onClick={() => setShowEmailModal(false)}
                        >
                            <div
                                className="modal-content"
                                style={{ width: "600px" }}
                                onClick={(e) => e.stopPropagation()}
                            >
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
                                                    value={newEmailLocal}
                                                    onChange={(e) => setNewEmailLocal(e.target.value)}
                                                    style={{ width: "130px" }}
                                                    disabled={isEmailVerified}
                                                />
                                                <span className="email-separator">@</span>
                                                <select
                                                    className="email-input email-domain-select"
                                                    value={newEmailDomain}
                                                    onChange={handleNewEmailDomainChange}
                                                    disabled={isEmailVerified}
                                                    style={{ width: "130px" }}
                                                >
                                                    {emailDomains.map((domain) => (
                                                        <option key={domain.value} value={domain.value}>
                                                            {domain.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {newEmailDomain === "custom" && (
                                                    <input
                                                        type="text"
                                                        className="email-input email-custom-domain"
                                                        placeholder="도메인 입력"
                                                        value={
                                                            newEmailDomain === "custom" ? "" : newEmailDomain
                                                        }
                                                        onChange={(e) => setNewEmailDomain(e.target.value)}
                                                        disabled={isEmailVerified}
                                                    />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="verify-btn"
                                                onClick={handleGenerateVerificationCode}
                                                disabled={
                                                    isEmailVerified ||
                                                    (timeLeft > 0 && timeLeft < 300) ||
                                                    !newEmailLocal ||
                                                    !newEmailDomain ||
                                                    (newEmailDomain === "custom" &&
                                                        !newEmailDomain.includes("."))
                                                }
                                            >
                                                {timeLeft > 0 && !isEmailVerified
                                                    ? "재전송"
                                                    : "인증"}
                                            </button>
                                        </div>
                                        <div className="email-input-group">
                                            <label>이메일 인증키</label>
                                            <input
                                                type="text"
                                                className="email-input"
                                                placeholder="인증번호를 입력하세요"
                                                value={inputCode}
                                                onChange={(e) => setInputCode(e.target.value)}
                                                disabled={isEmailVerified}
                                            />
                                            <button
                                                type="button"
                                                className="confirm-btn"
                                                onClick={handleVerifyEmailCode}
                                                disabled={
                                                    isEmailVerified ||
                                                    timeLeft === 0 ||
                                                    !newEmailLocal ||
                                                    !newEmailDomain
                                                }
                                            >
                                                확인
                                            </button>
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
                                    <button
                                        type="button"
                                        className="modal-button primary"
                                        onClick={handleVerifyEmailCode}
                                        disabled={!isEmailVerified}
                                    >
                                        이메일 변경 적용
                                    </button>
                                    <button
                                        type="button"
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
