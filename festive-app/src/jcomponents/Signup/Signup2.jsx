import React, { useState } from 'react';
import './SignUp2.css';

export default function SignUp2() {
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
  
  const handlePrevious = () => {
    console.log('이전 단계로 이동');
  };
  
  const handleNext = () => {
    console.log('다음 단계로 이동');
  };
  
  return (
      <div className="signup-container">
        <div className="signup-wrapper">
          {/* Progress Steps */}
          <div className="progress-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-label">약관 동의</div>
            </div>
            <div className="step-line"></div>
            <div className="step active">
              <div className="step-number">2</div>
              <div className="step-label">정보입력</div>
            </div>
            <div className="step-line"></div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-label">가입완료</div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="signup-content">
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
                      className="form-input full-width"
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
                    className="form-input full-width"
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
                    className="form-input full-width"
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
            
            {/* Navigation Buttons */}
            <div className="nav-buttons">
              <button className="prev-btn" onClick={handlePrevious}>
                이전
              </button>
              <button className="next-btn" onClick={handleNext}>
                다음
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}