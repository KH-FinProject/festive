import React, { useState } from 'react';
import './Signup.css';

const Signup = () => {
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
    location: false
  });
  
  const handlePrev = () => {
  
  };
  
  const handleNext = () => {
  
  };
  
  return (
      <div className="signup-container">
        <div className="signup-wrapper">
          
          <ProgressSteps />
          
          {/* Main Content */}
          <div className="signup-content">
            <Agreements agreements={agreements} setAgreements={setAgreements}/>
            
            <Inform />
            
            <div className="button-group">
              {/* prev Button */}
              <button className="step-btn" onClick={handlePrev}>
                이전
              </button>
              
              {/* Next Button */}
              <button className="step-btn" onClick={handleNext}>
                다음
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

const ProgressSteps = () => {
  
  return (
    <div className="progress-steps">
      <div className="step active">
        <div className="step-number">1</div>
        <div className="step-label">약관동의</div>
      </div>
      <div className="step-line"></div>
      <div className="step">
        <div className="step-number">2</div>
        <div className="step-label">정보입력</div>
      </div>
      <div className="step-line"></div>
      <div className="step">
        <div className="step-number">3</div>
        <div className="step-label">가입완료</div>
      </div>
    </div>
  )
}

const Agreements = ({agreements, setAgreements}) => {
  
  const [expandedSections, setExpandedSections] = useState({
    terms: false,
    privacy: false,
    marketing: false,
    location: false
  });
  
  const handleAgreementChange = (key) => {
    setAgreements(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleToggleExpand = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleSelectAll = () => {
    const allChecked = Object.values(agreements).every(val => val);
    const newState = !allChecked;
    setAgreements({
      terms: newState,
      privacy: newState,
      marketing: newState,
      location: newState
    });
  };
  
  const sections = [
    {
      id: 'terms',
      label: '이용약관',
      content: `제1조 (목적)
본 약관은 축제 알림 및 소통 게시판 웹사이트(이하 “사이트”)가 제공하는 서비스의 이용과 관련하여
사이트와 회원 간의 권리·의무 및 책임사항을 규정합니다.

제2조 (서비스의 제공)
사이트는 이용자에게 축제 일정 알림, 게시판을 통한 커뮤니케이션, 콘텐츠 공유 등의 서비스를 제공합니다.

제3조 (회원가입)
회원은 약관에 동의하고 회원가입 양식을 작성하여 가입 신청을 합니다. 사이트는 이를 승인함으로써 회원 자격이 부여됩니다.

제4조 (회원의 의무)
- 타인의 정보를 도용하거나 허위 정보를 기재하지 않아야 합니다.
- 사이트 운영에 지장을 주는 행위를 해서는 안 됩니다.

제5조 (서비스 이용 제한)
사이트는 회원이 약관을 위반하거나 공공질서 및 미풍양속에 반하는 행위를 할 경우 서비스 이용을 제한할 수 있습니다.`
    },
    {
      id: 'privacy',
      label: '개인정보의 수집범위',
      content: `사이트는 회원가입 및 서비스 이용을 위해 다음과 같은 개인정보를 수집합니다:
- 필수 수집항목: 이름(닉네임), 이메일 주소, 비밀번호
- 선택 수집항목: 프로필 이미지, 관심 축제 지역/카테고리
- 자동 수집 항목: 접속 로그, 쿠키, 이용 기록, IP 주소 등`
    },
    {
      id: 'marketing',
      label: '개인정보의 수집 및 이용 목적',
      content: `수집한 개인정보는 다음의 목적을 위해 사용됩니다:
1. 회원 관리: 가입의사 확인, 이용자 식별, 탈퇴 의사 확인 등
2. 서비스 제공: 축제 알림, 게시판 글 작성 및 댓글 기능 제공 등
3. 알림 서비스: 사용자가 선택한 관심 축제 정보 제공 및 푸시 알림
4. 분석 및 개선: 이용 패턴 분석을 통한 서비스 개선`
    },
    {
      id: 'location',
      label: '개인정보의 보유기간 및 이용기간',
      content: `회원 탈퇴 시: 즉시 삭제 (단, 관련 법령에 따라 일정 기간 보존되는 정보 제외)
전자상거래 기록 보존 (해당 시):
계약/청약철회/결제 기록: 5년
소비자 불만 또는 분쟁처리 기록: 3년
접속에 관한 기록(IP 등): 3개월`
    }
  ];
  
  const TermsSection = ({ label, content, checked, onChange, expanded, onToggle }) => {
    return (
        <div className="terms-section">
          <div className="terms-header">
            <label className="checkbox-label">
              <input
                  type="checkbox"
                  checked={checked}
                  onChange={onChange}
              />
              <span className="checkmark"></span>
              {label}
            </label>
            <button className="toggle-btn" onClick={onToggle}>
              상세
            </button>
          </div>
          {expanded && (
              <div className="terms-content">
                {content}
              </div>
          )}
        </div>
    );
  };
  
  return (
      <>
        <h2 className="signup-title">약관동의</h2>
        {sections.map((section, index) => (
            <TermsSection
                key={section.id}
                label={section.label}
                content={section.content}
                checked={agreements[section.id] || false}
                onChange={() => handleAgreementChange(section.id)}
                expanded={expandedSections[section.id] || false}
                onToggle={() => handleToggleExpand(section.id)}
            />
        ))}
        
        <div className="bottom-notice">
          <p>이용약관, 개인정보의 수집법위, 개인정보의 수집 및 이용 목적, 개인정보의 보유기간 및 이용기간 동의를 포함합니다.</p>
          <label className="select-all-label">
            <input
                type="checkbox"
                checked={Object.values(agreements).every(Boolean)}
                onChange={handleSelectAll}
            />
            <span className="checkmark"></span>
            전체동의
          </label>
        </div>
      </>
  )
}

const Inform = () => {
  
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    email: '',
    phone: '',
    authKey: '',
    id: '',
    password: '',
    passwordConfirm: '',
    address: '',
    detailAddress: ''
  });
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleDuplicateCheck = (field) => {
    console.log(`${field} 중복확인`);
  };
  
  const handleSmsVerification = () => {
    console.log('SMS 인증');
  };
  
  const handleAuthKeyVerification = () => {
    console.log('인증 확인');
  };
  
  const handleAddressSearch = () => {
    console.log('우편번호 찾기');
  };
  
  return (
    <>
      <h2 className="signup-title">정보입력</h2>
      <p className="signup-subtitle">회원 가입을 위해 *표시는 필수로 입력해주세요</p>
      
      <form className="signup-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Username <span className="required">*</span>
            </label>
            <div className="input-group">
              <input
                  type="text"
                  className="form-input"
                  placeholder="이름"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
              />
              <button
                  type="button"
                  className="action-btn"
                  onClick={() => handleDuplicateCheck('username')}
              >
                중복 확인
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Nickname <span className="required">*</span>
            </label>
            <div className="input-group">
              <input
                  type="text"
                  className="form-input"
                  placeholder="닉네임"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
              />
              <button
                  type="button"
                  className="action-btn"
                  onClick={() => handleDuplicateCheck('nickname')}
              >
                중복 확인
              </button>
            </div>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Email address <span className="required">*</span>
            </label>
            <input
                type="email"
                className="form-input"
                placeholder="이메일 (비밀번호 찾기 등 본인 확인 용도)"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">
              Phone <span className="required">*</span>
            </label>
            <div className="input-group">
              <input
                  type="tel"
                  className="form-input"
                  placeholder="전화번호"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
              />
              <button
                  type="button"
                  className="action-btn"
                  onClick={handleSmsVerification}
              >
                SMS 인증
              </button>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Auth key <span className="required">*</span>
          </label>
          <div className="input-group">
            <input
                type="text"
                className="form-input"
                placeholder="인증번호"
                value={formData.authKey}
                onChange={(e) => handleInputChange('authKey', e.target.value)}
            />
            <button
                type="button"
                className="action-btn"
                onClick={handleAuthKeyVerification}
            >
              인증 확인
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            ID <span className="required">*</span>
          </label>
          <div className="input-group">
            <input
                type="text"
                className="form-input"
                placeholder="아이디"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
            />
            <button
                type="button"
                className="action-btn"
                onClick={() => handleDuplicateCheck('id')}
            >
              중복 확인
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Password <span className="required">*</span>
          </label>
          <input
              type="password"
              className="form-input"
              placeholder="비밀번호 (영어,숫자,특수문자(@,#,..) 6~20글자 사이로 입력해주세요.)"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            Password confirm <span className="required">*</span>
          </label>
          <input
              type="password"
              className="form-input"
              placeholder="비밀번호 확인"
              value={formData.passwordConfirm}
              onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Address</label>
          <div className="address-group">
            <div className="input-group">
              <input
                  type="text"
                  className="form-input"
                  placeholder="우편번호"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  readOnly
              />
              <button
                  type="button"
                  className="action-btn"
                  onClick={handleAddressSearch}
              >
                우편번호 찾기
              </button>
            </div>
            <input
                type="text"
                className="form-input full-width"
                placeholder="상세 주소"
                value={formData.detailAddress}
                onChange={(e) => handleInputChange('detailAddress', e.target.value)}
            />
          </div>
        </div>
      </form>
    </>
  )
}

export default Signup;