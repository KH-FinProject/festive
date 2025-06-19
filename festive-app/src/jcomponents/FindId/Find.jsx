import { useState } from 'react';
import './Find.css';
import {useSearchParams} from "react-router-dom";

const Find = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab")); // 'id' or 'pw'
  const [showResult, setShowResult] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    authKey: ''
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowResult(false);
    // 탭 변경 시 해당 탭과 관련없는 필드 초기화
    if (tab === 'email') {
      setFormData(prev => ({
        ...prev,
        phone: '',
        authKey: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        email: '',
        authKey: ''
      }));
    }
  };
  
  const handleAuthRequest = () => {
    if (activeTab === 'id' && formData.email) {
      console.log('이메일 인증 요청:', formData.email);
      alert('인증번호가 이메일로 발송되었습니다.');
    } else if (activeTab === 'pw' && formData.phone) {
      console.log('휴대폰 인증 요청:', formData.phone);
      alert('인증번호가 SMS로 발송되었습니다.');
    } else {
      alert(activeTab === 'email' ? '이메일을 입력해주세요.' : '전화번호를 입력해주세요.');
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('아이디 찾기 시도:', formData);
    
    // 간단한 유효성 검사
    if (!formData.username) {
      alert('이름을 입력해주세요.');
      return;
    }
    
    if (activeTab === 'id' && (!formData.email || !formData.authKey)) {
      alert('이메일과 인증번호를 모두 입력해주세요.');
      return;
    }
    
    if (activeTab === 'pw' && (!formData.phone || !formData.authKey)) {
      alert('전화번호와 인증번호를 모두 입력해주세요.');
      return;
    }
    
    setShowResult(true);
  };
  
  const handleCancel = () => {
    setFormData({
      username: '',
      email: '',
      phone: '',
      authKey: ''
    });
    setShowResult(false);
  };
  
  const handleResultClick = () => {
    alert('아이디 찾기 결과 처리');
  };
  
  return (
      <div className="find-container">
        <div className="find-wrapper">
          <div className="find-card">
            {/* 탭 헤더 */}
            <div className="tab-header">
              <button type="button"
                  className={`tab-button ${activeTab === 'id' ? 'active' : ''}`}
                  onClick={() => handleTabChange('id')}
              >
                아이디 찾기
              </button>
              <button
                  type="button"
                  className={`tab-button ${activeTab === 'pw' ? 'active' : ''}`}
                  onClick={() => handleTabChange('pw')}
              >
                비밀번호 찾기
              </button>
            </div>
            
            {/* 아이디 찾기 폼 */}
            <form className="find-form" onSubmit={handleSubmit}>
              {/* 사용자명 입력 필드 */}
              <div className="find-input-group">
                <label htmlFor="username" className="find-input-label">
                  UserName
                </label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="이름"
                    className="find-input-field"
                />
              </div>
              
              {/* 이메일/전화번호 입력 필드 */}
              {activeTab === 'email' ? (
                  <div className="find-input-group">
                    <label htmlFor="email" className="find-input-label">
                      Email address
                    </label>
                    <div className="auth-input-group">
                      <div className="auth-input-wrapper">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="이메일"
                            className="find-input-field"
                        />
                      </div>
                      <button
                          type="button"
                          onClick={handleAuthRequest}
                          className="auth-button"
                      >
                        발송
                      </button>
                    </div>
                  </div>
              ) : (
                  <div className="find-input-group">
                    <label htmlFor="phone" className="find-input-label">
                      Phone
                    </label>
                    <div className="auth-input-group">
                      <div className="auth-input-wrapper">
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="전화번호"
                            className="find-input-field"
                        />
                      </div>
                      <button
                          type="button"
                          onClick={handleAuthRequest}
                          className="auth-button"
                      >
                        인증
                      </button>
                    </div>
                  </div>
              )}
              
              {/* 인증번호 입력 필드 */}
              <div className="find-input-group">
                <label htmlFor="authKey" className="find-input-label">
                  Auth key
                </label>
                <div className="auth-input-group">
                  <div className="auth-input-wrapper">
                    <input
                        id="authKey"
                        name="authKey"
                        type="text"
                        required
                        value={formData.authKey}
                        onChange={handleInputChange}
                        placeholder="인증번호"
                        className="find-input-field"
                    />
                  </div>
                  <button
                      type="button"
                      className="auth-button"
                  >
                    인증 확인
                  </button>
                </div>
              </div>
              
              {/* 추가 텍스트 */}
              {activeTab === 'phone' && (
                  <div className="additional-text">
                    이미입력된 인증번호가
                  </div>
              )}
              {activeTab === 'email' && (
                  <div className="additional-text">
                    전화번호로 인증번호가
                  </div>
              )}
              
              {/* 버튼 그룹 */}
              <div className="find-button-group">
                <button
                    type="submit"
                    className="find-btn find-btn-submit"
                >
                  로그인하러 가기
                </button>
              </div>
            </form>
          </div>
          
          {/* 결과 섹션 */}
          {showResult && (
              <div className="find-result">
                <button
                    type="button"
                    onClick={handleResultClick}
                    className="result-button"
                >
                  아이디 찾기 결과
                </button>
              </div>
          )}
        </div>
      </div>
  );
};

export default Find;