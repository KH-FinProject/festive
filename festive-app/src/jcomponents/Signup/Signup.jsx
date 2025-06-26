import React, { useEffect, useRef, useState } from 'react';
import axiosAPI from "../../api/axiosAPI";
import { useDebounce } from '../../hooks/useDebounce';
import './Signup.css';
import { Link } from 'react-router-dom';

const Signup = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
    location: false
  });
  
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleNext = () => {
    // 필수 약관 동의 확인
    if (currentStep === 1) {
      const requiredAgreements = ['terms', 'privacy'];
      const allRequiredChecked = requiredAgreements.every(key => agreements[key]);
      
      if (!allRequiredChecked) {
        alert('필수 약관에 동의해주세요.');
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Agreements agreements={agreements} setAgreements={setAgreements} />;
      case 2:
        return <Inform handlePrev={handlePrev} currentStep={currentStep} setCurrentStep={setCurrentStep} />;
      case 3:
        return <Completion />;
      default:
        return <Agreements agreements={agreements} setAgreements={setAgreements} />;
    }
  };
  
  return (
      <div className="signup-container">
        <div className="signup-wrapper">
          <ProgressSteps currentStep={currentStep} />
          
          {/* Main Content */}
          <div className="signup-content">
            {renderCurrentStep()}
            
            {currentStep === 1 && (
                <div className="nav-buttons">
                  <button className="prev-btn" onClick={handlePrev}>
                    이전
                  </button>
                  <button className="next-btn" onClick={handleNext}>
                    다음
                  </button>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

const ProgressSteps = ({ currentStep }) => {
  const steps = [
    { number: 1, label: '약관동의' },
    { number: 2, label: '정보입력' },
    { number: 3, label: '가입완료' }
  ];
  
  return (
      <div className="progress-steps">
        {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className={`step ${currentStep >= step.number ? 'active' : ''}`}>
                <div className="step-number">{step.number}</div>
                <div className="step-label">{step.label}</div>
              </div>
              {index < steps.length - 1 && (
                  <div className={`step-line ${currentStep === 3 ? 'zigzag-line' : ''}`}></div>
              )}
            </React.Fragment>
        ))}
      </div>
  );
};

const Agreements = ({ agreements, setAgreements }) => {
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
  
  // FIXME: 약관 내용 하드코딩 수정 필요
  const sections = [
    {
      id: 'terms',
      label: '이용약관',
      required: true,
      content: `제1조 (목적)
본 약관은 축제 알림 및 소통 게시판 웹사이트(이하 "사이트")가 제공하는 서비스의 이용과 관련하여
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
      required: true,
      content: `사이트는 회원가입 및 서비스 이용을 위해 다음과 같은 개인정보를 수집합니다:
- 필수 수집항목: 이름(닉네임), 이메일 주소, 비밀번호
- 선택 수집항목: 프로필 이미지, 관심 축제 지역/카테고리
- 자동 수집 항목: 접속 로그, 쿠키, 이용 기록, IP 주소 등`
    },
    {
      id: 'marketing',
      label: '개인정보의 수집 및 이용 목적',
      required: false,
      content: `수집한 개인정보는 다음의 목적을 위해 사용됩니다:
1. 회원 관리: 가입의사 확인, 이용자 식별, 탈퇴 의사 확인 등
2. 서비스 제공: 축제 알림, 게시판 글 작성 및 댓글 기능 제공 등
3. 알림 서비스: 사용자가 선택한 관심 축제 정보 제공 및 푸시 알림
4. 분석 및 개선: 이용 패턴 분석을 통한 서비스 개선`
    },
    {
      id: 'location',
      label: '개인정보의 보유기간 및 이용기간',
      required: false,
      content: `회원 탈퇴 시: 즉시 삭제 (단, 관련 법령에 따라 일정 기간 보존되는 정보 제외)
전자상거래 기록 보존 (해당 시):
계약/청약철회/결제 기록: 5년
소비자 불만 또는 분쟁처리 기록: 3년
접속에 관한 기록(IP 등): 3개월`
    }
  ];
  
  const TermsSection = ({ label, content, checked, onChange, expanded, onToggle, required }) => {
    return (
        <div className="terms-section">
          <div className="terms-header">
            <label className="checkbox-label">
              <input
                  type="checkbox"
                  checked={checked}
                  onChange={onChange}
                  required={required}
              />
              <span className="checkmark"></span>
              {label} {required && <span className="required">*</span>}
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
        <hr/>
        {sections.map((section) => (
            <TermsSection
                key={section.id}
                label={section.label}
                content={section.content}
                checked={agreements[section.id] || false}
                onChange={() => handleAgreementChange(section.id)}
                expanded={expandedSections[section.id] || false}
                onToggle={() => handleToggleExpand(section.id)}
                required={section.required}
            />
        ))}
        
        <div className="bottom-notice">
          <p>이용약관, 개인정보의 수집범위, 개인정보의 수집 및 이용 목적, 개인정보의 보유기간 및 이용기간 동의를 포함합니다.</p>
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
  );
};

// validation 규칙과 메시지 분리
const validationRules = {
  id: {
    required: true,
    minLength: 4,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9]+$/,
    message: {
      required: '아이디를 입력해주세요',
      minLength: '아이디는 4~20자 사이로 입력해주세요',
      maxLength: '아이디는 4~20자 사이로 입력해주세요',
      pattern: '아이디는 영문자와 숫자만 사용 가능합니다'
    }
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 20,
    message: {
      required: '이름을 입력해주세요',
      minLength: '이름은 2~20자 사이로 입력해주세요',
      maxLength: '이름은 2~20자 사이로 입력해주세요'
    }
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: {
      required: '이메일을 입력해주세요',
      pattern: '올바른 이메일 형식으로 입력해주세요'
    }
  },
  nickname: {
    required: true,
    minLength: 2,
    maxLength: 15,
    pattern: /^[ㄱ-힣a-zA-Z0-9]+$/,
    message: {
      required: '닉네임을 입력해주세요',
      minLength: '닉네임은 2~15자 사이로 입력해주세요',
      maxLength: '닉네임은 2~15자 사이로 입력해주세요',
      pattern: '닉네임은 한글, 영문자, 숫자만 사용 가능합니다'
    }
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 20,
    pattern: /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/,
    message: {
      required: '비밀번호를 입력해주세요',
      minLength: '비밀번호는 6~20자 사이로 입력해주세요',
      maxLength: '비밀번호는 6~20자 사이로 입력해주세요',
      pattern: '비밀번호는 영문자와 숫자를 포함해야 합니다'
    }
  },
  passwordConfirm: {
    required: true,
    message: {
      required: '비밀번호 확인을 입력해주세요',
      match: '비밀번호가 일치하지 않습니다'
    }
  },
  authKey: {
    required: true,
    length: 6,
    message: {
      required: '인증번호를 입력해주세요',
      length: '인증번호는 6자리로 입력해주세요'
    }
  }
};

const duplicateErrorMessages = {
  id: {
    TOO_SHORT: '아이디는 4~20자 사이로 입력해주세요.',
    INVALID_FORMAT: '아이디는 영문자와 숫자만 사용 가능합니다.',
    DUPLICATE: '이미 사용 중인 아이디입니다.',
    SERVER_ERROR: '확인 중 오류가 발생했습니다.',
    UNSUPPORTED_TYPE: '지원하지 않는 타입입니다.'
  },
  nickname: {
    TOO_SHORT: '닉네임은 2~15자여야 합니다.',
    INVALID_FORMAT: '닉네임은 한글, 영문자, 숫자만 사용 가능합니다.',
    DUPLICATE: '이미 사용 중인 닉네임입니다.',
    SERVER_ERROR: '확인 중 오류가 발생했습니다.',
    UNSUPPORTED_TYPE: '지원하지 않는 타입입니다.'
  },
  email: {
    INVALID_FORMAT: '올바른 이메일 형식으로 입력해주세요.',
    DUPLICATE: '이미 사용 중인 이메일입니다.',
    SERVER_ERROR: '확인 중 오류가 발생했습니다.',
    UNSUPPORTED_TYPE: '지원하지 않는 타입입니다.'
  }
};

const getDuplicateMessage = (field, code) => {
  if (!code) return '';
  return duplicateErrorMessages[field]?.[code] || '확인 중 오류가 발생했습니다.';
};

const Inform = ({ handlePrev, currentStep, setCurrentStep }) => {

  // 1. 상태 선언
  // [formData] : 회원가입 입력값 전체를 관리
  // [duplicateStatus] : id, nickname, email, authKey의 중복확인/인증 상태(checked, available, message)
  // [validationErrors] : 각 입력값의 validation 에러 메시지
  const [formData, setFormData] = useState({
    name: '', nickname: '', email: '', tel: '', authKey: '', id: '', password: '', passwordConfirm: '', address: '', detailAddress: '', authMethod: 'email'
  });

  const [duplicateStatus, setDuplicateStatus] = useState({
    id: { checked: false, available: false, message: '' },
    nickname: { checked: false, available: false, message: '' },
    email: { checked: false, available: false, message: '' },
    authKey: { checked: false, available: false, message: '' } // 인증번호 상태 추가
  });

  const [validationErrors, setValidationErrors] = useState({});

  // 2. useRef (race condition 방지)
  // [lastRequestedValue] : 중복확인 요청의 마지막 값을 기억하여 응답 순서 꼬임(race condition) 방지
  // [authKeyInputRef] : 인증번호 입력 필드 참조
  const lastRequestedValue = useRef({});
  const authKeyInputRef = useRef(null);

  // 3. useDebounce
  // [debounced] : 입력값이 일정 시간(500ms) 동안 변경 없을 때만 값이 반영됨(불필요한 API 호출 방지)
  const debounced = {
    id: useDebounce(formData.id, 500),
    nickname: useDebounce(formData.nickname, 500),
    email: useDebounce(formData.email, 500),
    authKey: useDebounce(formData.authKey, 500)
  };

  // 4. 헬퍼: validation
  // [validateField] : 각 입력값에 대해 validation 규칙(길이, 정규식 등) 체크 후 에러 메시지 반환
  const validateField = (field, value, compareValue) => {
    const rules = validationRules[field];

    if (!rules) return '';
    if (rules.required && !value) return rules.message.required;
    if (rules.minLength && value.length < rules.minLength) return rules.message.minLength;
    if (rules.maxLength && value.length > rules.maxLength) return rules.message.maxLength;
    if (rules.pattern && !rules.pattern.test(value)) return rules.message.pattern;
    if (field === 'passwordConfirm' && value !== compareValue) return rules.message.match;
    if (field === 'authKey' && value.length !== 6) return rules.message.length;

    return '';
  };

  // 5. 헬퍼: 중복확인
  // [checkDuplicate] : 중복확인 API 호출, 응답이 마지막 요청값과 일치할 때만 상태 업데이트 (race condition 방지)
  const checkDuplicate = async (field, value) => {
    lastRequestedValue.current[field] = value;

    try {
      setDuplicateStatus(prev => ({ ...prev, [field]: { checked: false, available: false, message: '' } }));
      if (!['id', 'nickname', 'email'].includes(field)) return;
      const response = await axiosAPI.get(`/member/exists?type=${field}&value=${value}`);
      if (lastRequestedValue.current[field] !== value) return;
      setDuplicateStatus(prev => ({
        ...prev,
        [field]: {
          checked: true,
          available: response.data.available,
          message: getDuplicateMessage(field, response.data.code)
        }
      }));
    } catch {
      if (lastRequestedValue.current[field] !== value) return;
      setDuplicateStatus(prev => ({
        ...prev,
        [field]: {
          checked: true,
          available: false,
          message: getDuplicateMessage(field, 'SERVER_ERROR')
        }
      }));
    }
  };

  // 6. useEffect: 중복확인 (id, nickname, email)
  useEffect(() => {
    ['id', 'nickname', 'email'].forEach(field => {
      const value = debounced[field];
      let shouldCheck = false;

      switch(field) {
        case 'id':
          shouldCheck = value && value.length >= 4;
          break;
        case 'nickname':
          shouldCheck = value && value.length >= 2;
          break;
        case 'email':
          shouldCheck = value && value.includes('@');
          break;
        default:
          shouldCheck = false;
      }

      if (shouldCheck) {
        setDuplicateStatus(prev => ({ ...prev, [field]: { checked: false, available: false, message: '' } }));
        checkDuplicate(field, value);
      }
    });
    // eslint-disable-next-line
  }, [debounced.id, debounced.nickname, debounced.email]);

  // 7. useEffect: 인증번호 실시간 체크
  useEffect(() => {
    const checkAuthKey = async () => {
      if (!debounced.email || !debounced.authKey) {
        setDuplicateStatus(prev => ({ ...prev, authKey: { checked: false, available: false, message: '' } }));
        return;
      }
      try {
        const res = await axiosAPI.post('/auth/checkAuthKey', {
          email: debounced.email,
          authKey: debounced.authKey
        });

        if (res.data === 1) {
          setDuplicateStatus(prev => ({ ...prev, authKey: { checked: true, available: true, message: '인증 성공!' } }));
          
        } else if (res.data === 2) {
          setDuplicateStatus(prev => ({ ...prev, authKey: { checked: true, available: false, message: '인증번호가 일치하지 않습니다.' } }));
        
        } else {
          setDuplicateStatus(prev => ({ ...prev, authKey: { checked: false, available: false, message: '' } }));
        }

      } catch {
        setDuplicateStatus(prev => ({ ...prev, authKey: { checked: true, available: false, message: '서버 오류' } }));
      }
    };

    if (debounced.authKey.length === 6) {
      checkAuthKey();
    
    } else {
      setDuplicateStatus(prev => ({ ...prev, authKey: { checked: false, available: false, message: '' } }));
    }
  }, [debounced.authKey, debounced.email]);

  // 8. 입력 핸들러 (validation, 중복확인 상태 초기화)
  // [handleInputChange] : 입력값 변경 시 formData, validationErrors, duplicateStatus를 업데이트
  // - 아이디/닉네임/이메일 입력 시 중복확인 상태 초기화
  // - 비밀번호 입력 시 비밀번호 확인도 재검증
  // - 인증번호 입력 시 인증 상태 초기화
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (['id', 'nickname', 'email', 'authKey'].includes(field)) {
      setDuplicateStatus(prev => ({ ...prev, [field]: { checked: false, available: false, message: '' } }));
    }

    setValidationErrors(prev => ({
      ...prev,
      [field]: validateField(field, value, field === 'passwordConfirm' ? formData.password : undefined)
    }));

    if (field === 'password') {
      setValidationErrors(prev => ({
        ...prev,
        passwordConfirm: validateField('passwordConfirm', formData.passwordConfirm, value)
      }));
    }
  };

  // 9. 기타 핸들러
  // [handleSmsVerification] : SMS 인증 요청(추후 구현)
  // [handleAuthKeyVerification] : 인증번호 확인(추후 구현)
  // [handleAddressSearch] : 주소 검색(추후 구현)
  const handleSmsVerification = async () => {
    const { authMethod, email, tel } = formData;
    
    if (authMethod === 'email') {
      if (!email) {
        alert('이메일을 입력해주세요.');
        return;
      }

      if(!duplicateStatus.email.available) {
        alert(duplicateStatus.email.message);
        return;
      }

      if(validationErrors.email) {
        alert(validationErrors.email);
        return;
      }

      // 이메일 인증
      const response = await axiosAPI.post(`/auth/email`, { email });
      if(response.data === 1) {
        alert('이메일로 인증번호가 전송되었습니다.');
        setFormData(prev => ({ ...prev, authMethod: 'email', authKey: '' }));
        if (authKeyInputRef.current) {
          authKeyInputRef.current.focus();
        }
      } else {
        alert('이메일로 인증번호 전송에 실패했습니다.');
      }

    } else {
      if (!tel) {
        alert('전화번호를 입력해주세요.');
        return;
      }
      // SMS 인증
      alert('전화번호로 인증번호가 전송되었습니다.');
    }
  };

  const handleAddressSearch = () => {
    // 다음 주소 API 다루기
    function execDaumPostcode() {
      new daum.Postcode({
        oncomplete: function(data) {
          // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

          // 각 주소의 노출 규칙에 따라 주소를 조합한다.
          // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
          var addr = ''; // 주소 변수

          //사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
          if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
            addr = data.roadAddress;
          } else { // 사용자가 지번 주소를 선택했을 경우(J)
            addr = data.jibunAddress;
          }

          // 우편번호와 주소 정보를 해당 필드에 넣는다.
          document.getElementById('postcode').value = data.zonecode;
          document.getElementById("address").value = addr;
          // 커서를 상세주소 필드로 이동한다.
          document.getElementById("detailAddress").focus();
        }
      }).open();
    };

    execDaumPostcode();
  };

  // 모든 중복/유효성 검사 통과 여부 확인 함수
  const isAllValid = () => {
    // 필수 유효성 검사
    const requiredFields = ['name', 'nickname', 'email', 'id', 'password', 'passwordConfirm', 'authKey'];
    for (const field of requiredFields) {
      if (validationErrors[field] || !formData[field]) return false;
    }
    // 중복/인증 체크
    if (!duplicateStatus.id.available) return false;
    if (!duplicateStatus.nickname.available) return false;
    if (!duplicateStatus.email.available) return false;
    if (!duplicateStatus.authKey.available) return false;
    return true;
  };

  // 회원가입 제출 함수
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAllValid()) {
      alert('모든 입력값을 올바르게 입력해주세요.');
      return;
    }
    try {
      // 회원가입 API 호출
      const { name, nickname, email, tel, id, password, address, detailAddress } = formData;
      const response = await axiosAPI.post('/member/signup', {
        name, nickname, email, tel, id, password, address, detailAddress
      });

      if(response.data === 1) {
        alert('회원가입이 완료되었습니다!');
        setCurrentStep(3); // 직접 3으로 이동
        return; // 여기서 함수 종료!
      } else {
        alert('회원가입 중 오류가 발생했습니다.');
      }

    } catch (err) {
      alert('회원가입 중 오류가 발생했습니다.');
    }
  };

  // 10. 렌더링
  const getInputClass = field => {
    const base = 'form-input';
    const status = duplicateStatus[field];
    if (validationErrors[field]) return `${base} unavailable`;
    if (!['id', 'nickname', 'email', 'authKey'].includes(field)) return base;
    if (status && status.checked && status.available) return `${base} available`;
    if (status && status.checked && !status.available) return `${base} unavailable`;
    return base;
  };

  const getStatusMessage = field => {
    const status = duplicateStatus[field];
    if (!status || !status.checked || !status.message) return null;
    return <span className={`status-message ${status.available ? 'success' : 'error'}`}>{status.message}</span>;
  };

  const getValidationError = field => {
    const error = validationErrors[field];
    return error ? <span className="validation-error">{error}</span> : null;
  };

  return (
    <>
      <h2 className="signup-title">정보입력</h2>
      <p className="signup-subtitle">회원 가입을 위해 *표시는 필수로 입력해주세요</p>
      <hr/>
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="user-form-row">
          <div className="user-form-group">
            <label className="form-label">이름 <span className="required">*</span></label>
            <input type="text" className={getInputClass('name')} placeholder="이름을 입력해주세요" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} />
            {getValidationError('name')}
          </div>
          <div className="user-form-group">
            <label className="form-label">닉네임 <span className="required">*</span></label>
            <div className="form-input-group">
              <input type="text" className={getInputClass('nickname')} placeholder="닉네임을 입력해주세요" value={formData.nickname} onChange={e => handleInputChange('nickname', e.target.value)} />
            </div>
            {getStatusMessage('nickname')}
            {getValidationError('nickname')}
          </div>
        </div>
        <div className="user-form-row">
          <div className="user-form-group">
            <label className="form-label">이메일 <span className="required">*</span></label>
            <input type="email" className={getInputClass('email')} placeholder="이메일을 입력해주세요" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
            {getStatusMessage('email')}
            {getValidationError('email')}
          </div>
          <div className="user-form-group">
            <label className="form-label">전화번호 <span className="required">*</span></label>
            <input type="tel" className="form-input" placeholder="전화번호를 입력해주세요" value={formData.tel} onChange={e => handleInputChange('tel', e.target.value)} />
          </div>
        </div>
        <div className="user-form-group">
          <label className="form-label">인증 방식 선택 <span className="required">*</span></label>
          <div className="auth-method-selector">
            <label className="auth-method-option">
              <input
                type="radio"
                name="authMethod"
                value="email"
                checked={formData.authMethod === 'email'}
                onChange={(e) => handleInputChange('authMethod', e.target.value)}
              />
              <span className="auth-method-label">이메일 인증</span>
            </label>
            <label className="auth-method-option">
              <input
                type="radio"
                name="authMethod"
                value="tel"
                checked={formData.authMethod === 'tel'}
                onChange={(e) => handleInputChange('authMethod', e.target.value)}
              />
              <span className="auth-method-label">전화번호 인증</span>
            </label>
          </div>
        </div>
        <div className="user-form-group">
          <label className="form-label">인증번호 <span className="required">*</span></label>
          <div className="form-input-group">
            <input
              type="text"
              className={getInputClass('authKey')}
              placeholder="인증번호를 입력해주세요"
              value={formData.authKey}
              onChange={e => handleInputChange('authKey', e.target.value)}
              ref={authKeyInputRef}
              maxLength={6}
            />
            <button type="button" className="action-btn" onClick={handleSmsVerification}>
              {formData.authMethod === 'email' ? '이메일 인증' : '전화번호 인증'}
            </button>
          </div>
          {getStatusMessage('authKey')}
        </div>
        <div className="user-form-group">
          <label className="form-label">아이디 <span className="required">*</span></label>
          <div className="form-input-group">
            <input type="text" className={getInputClass('id')} placeholder="아이디를 입력해주세요 (4~20자, 영문자/숫자)" value={formData.id} onChange={e => handleInputChange('id', e.target.value)} />
          </div>
          {getStatusMessage('id')}
          {getValidationError('id')}
        </div>
        <div className="user-form-group">
          <label className="form-label">비밀번호 <span className="required">*</span></label>
          <input type="password" className={getInputClass('password')} placeholder="비밀번호를 입력해주세요 (6~20자, 영문자+숫자)" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} />
          {getValidationError('password')}
        </div>
        <div className="user-form-group">
          <label className="form-label">비밀번호 확인 <span className="required">*</span></label>
          <input type="password" className={getInputClass('passwordConfirm')} placeholder="비밀번호를 다시 입력해주세요" value={formData.passwordConfirm} onChange={e => handleInputChange('passwordConfirm', e.target.value)} />
          {getValidationError('passwordConfirm')}
        </div>
        <div className="user-form-group">
          <label className="form-label">주소</label>
          <div className="address-group">
            <div className="form-input-group">
              <input type="text" className="form-input" placeholder="우편번호" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} readOnly />
              <button type="button" className="action-btn" onClick={handleAddressSearch}>우편번호 찾기</button>
            </div>
            <input type="text" className="form-input full-width" placeholder="상세 주소" value={formData.detailAddress} onChange={e => handleInputChange('detailAddress', e.target.value)} />
          </div>
        </div>
        {currentStep === 2 && (
          <div className="nav-buttons">
            {currentStep > 1 && (
              <button className="prev-btn" onClick={handlePrev} type="button">
                이전
              </button>
            )}
            <button
              className="next-btn"
              disabled={!isAllValid()}
              type="submit"
            >
              회원가입
            </button>
          </div>
        )}
      </form>
    </>
  );
};

const Completion = () => {
  
  const path = '/src/assets/signup/';
  const cards = [
    {
      img: 'ai.png',
      title: 'AI 맞춤 여행정보 추천',
      content: '당신의 취향과 일정에 맞는 축제 여행 코스를 AI가 똑똑하게 추천해드립니다. 개인별 선호도를 분석하여 최적의 루트를 제안합니다.'
    },
    {
      img: 'local.png',
      title: '지역별 상세 축제 정보',
      content: '전국 각 지역의 크고 작은 축제들을 한눈에! 지역 특색이 담긴 다양한 축제 정보를 상세히 제공합니다.'
    },
    {
      img: 'calendar.png',
      title: '월별 축제 캘린더 & 검색',
      content: '월별로 열리는 축제들을 캘린더로 확인하고, 원하는 타입이나 지역으로 쉽게 검색할 수 있습니다. 놓치고 싶지 않은 축제 일정을 확인 가능해요!'
    }
  ]
  
  return (
      <>
        <div className="completion-container">
          
          {/* Center Content */}
          <div className="completion-content">
            {/* Character Images */}
            <div className="character">
              <img src="/src/assets/signup/korean.png" alt="사물놀이 캐릭터" className="character-img" />
            </div>
            
            <h2 className="completion-title">가입을 진심으로 환영합니다!</h2>
            
            {/* Feature Cards */}
            <div className="feature-cards">
              
              {cards.map((card, index) => (
                <div className="feature-card" key={index}>
                  <div className="feature-icon-wrapper">
                    <img src={path + card.img} alt={card.img} className="feature-icon-img" />
                  </div>
                
                  <div className="feature-content">
                    <h3>{card.title}</h3>
                    <p>{card.content}</p>
                  </div>
                </div>
              ))}
              
            </div>
          </div>
        </div>
        
        {/* Login Button */}
        <Link to="/signin" className="login-btn" style={{ display: 'block', width: '100%' }}>
          로그인 하러 가기
        </Link>
      </>
  );
};

export default Signup;