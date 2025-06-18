import { useState } from 'react';
import './SignUp1.css';

export default function SignUp1() {
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
    location: false
  });
  
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
  
  const handleNext = () => {
    console.log('다음 단계로 이동');
  };
  
  return (
      <div className="signup-container">
        <div className="signup-wrapper">
          {/* Progress Steps */}
          <div className="progress-steps">
            <div className="step active">
              <div className="step-number">1</div>
              <div className="step-label">약관 동의</div>
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
          
          {/* Main Content */}
          <div className="signup-content">
            <h2 className="signup-title">이용약관</h2>
            
            {/* Terms Sections */}
            <div className="terms-section">
              <div className="terms-header">
                <label className="checkbox-label">
                  <input
                      type="checkbox"
                      checked={agreements.terms}
                      onChange={() => handleAgreementChange('terms')}
                  />
                  <span className="checkmark"></span>
                  제1조 (목적)
                </label>
                <button
                    className="toggle-btn"
                    onClick={() => handleToggleExpand('terms')}
                >
                  동의
                </button>
              </div>
              {expandedSections.terms && (
                  <div className="terms-content">
                    본 약관은 축제 정보 및 예매 서비스 할인이용에 '서비스'라고 제공하는 서비스의 이용과 관련하여 이용자의 권리 및의 의무과 책임 및 책임사항을 규정합니다.
                  </div>
              )}
            </div>
            
            <div className="terms-section">
              <div className="terms-header">
                <label className="checkbox-label">
                  <input
                      type="checkbox"
                      checked={agreements.privacy}
                      onChange={() => handleAgreementChange('privacy')}
                  />
                  <span className="checkmark"></span>
                  제2조 (서비스의 제공)
                </label>
                <button
                    className="toggle-btn"
                    onClick={() => handleToggleExpand('privacy')}
                >
                  동의
                </button>
              </div>
              {expandedSections.privacy && (
                  <div className="terms-content">
                    서비스는 이용자에게 축제 정보 및 할인, 예사용권 분양 서비스를 제공합니다.
                  </div>
              )}
            </div>
            
            <div className="terms-section">
              <div className="terms-header">
                <label className="checkbox-label">
                  <input
                      type="checkbox"
                      checked={agreements.marketing}
                      onChange={() => handleAgreementChange('marketing')}
                  />
                  <span className="checkmark"></span>
                  개인정보의 수집법위
                </label>
                <button
                    className="toggle-btn"
                    onClick={() => handleToggleExpand('marketing')}
                >
                  동의
                </button>
              </div>
              {expandedSections.marketing && (
                  <div className="terms-content">
                    서비스는 회원가입 시 서비스 이용을 위해 다음과 같은 개인정보를 수집합니다.
                  </div>
              )}
            </div>
            
            <div className="terms-section">
              <div className="terms-header">
                <label className="checkbox-label">
                  <input
                      type="checkbox"
                      checked={agreements.location}
                      onChange={() => handleAgreementChange('location')}
                  />
                  <span className="checkmark"></span>
                  개인정보의 수집 및 이용 목적
                </label>
                <button
                    className="toggle-btn"
                    onClick={() => handleToggleExpand('location')}
                >
                  동의
                </button>
              </div>
              {expandedSections.location && (
                  <div className="terms-content">
                    수집한 개인정보는 다음의 목적에 위해 사용됩니다.
                  </div>
              )}
            </div>
            
            <div className="terms-section">
              <div className="terms-header">
                <label className="checkbox-label">
                  <input
                      type="checkbox"
                      checked={agreements.location}
                      onChange={() => handleAgreementChange('location')}
                  />
                  <span className="checkmark"></span>
                  개인정보의 보유기간 및 이용기간
                </label>
                <button
                    className="toggle-btn"
                    onClick={() => handleToggleExpand('location')}
                >
                  동의
                </button>
              </div>
            </div>
            
            {/* Bottom Notice */}
            <div className="bottom-notice">
              <p>이용약관, 개인정보의 수집법위, 개인정보의 수집 및 이용 목적, 개인정보의 보유기간 및 이용기간 동의를 포함합니다.</p>
              <label className="select-all-label">
                <input
                    type="checkbox"
                    checked={Object.values(agreements).every(val => val)}
                    onChange={handleSelectAll}
                />
                <span className="checkmark"></span>
                전체동의
              </label>
            </div>
            
            {/* Next Button */}
            <button className="next-btn" onClick={handleNext}>
              다음
            </button>
          </div>
        </div>
      </div>
  );
}