import React from 'react';
import './SignUp3.css';

export default function SignUp3() {
  const handleLoginRedirect = () => {
    console.log('로그인 하러 가기');
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
            <div className="step-line zigzag-line"></div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-label">정보입력</div>
            </div>
            <div className="step-line zigzag-line"></div>
            <div className="step active">
              <div className="step-number">3</div>
              <div className="step-label">가입완료</div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="signup-content">
            <div className="completion-container">
              
              {/* Center Content */}
              <div className="completion-content">
                {/* Character Images - 실제 이미지로 교체 */}
                <div className="character-group">
                  <img src="/api/placeholder/80/80" alt="캐릭터1" className="character-img" />
                  <img src="/api/placeholder/80/80" alt="캐릭터2" className="character-img" />
                  <img src="/api/placeholder/80/80" alt="캐릭터3" className="character-img" />
                  <img src="/api/placeholder/80/80" alt="캐릭터4" className="character-img" />
                </div>
                
                <h2 className="completion-title">가입을 진심으로 환영합니다!</h2>
                
                {/* Feature Cards */}
                <div className="feature-cards">
                  <div className="feature-card">
                    <div className="feature-icon-wrapper">
                      <img src="/api/placeholder/60/60" alt="AI 아이콘" className="feature-icon-img" />
                    </div>
                    <div className="feature-content">
                      <h3>AI 맞춤 여행정보 추천</h3>
                      <p>당신의 취향과 일정에 맞는 축제 여행 코스를 AI가 똑똑하게 추천해드립니다. 개인별 선호도를 분석하여 최적의 루트를 제안합니다.</p>
                    </div>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-content">
                      <h3>지역별 상세 축제 정보</h3>
                      <p>전국 각 지역의 크고 작은 축제들을 한눈에! 지역 특색이 담긴 다양한 축제 정보를 상세히 제공합니다.</p>
                    </div>
                    <div className="regional-icons-wrapper">
                      <img src="/api/placeholder/60/60" alt="지역 아이콘" className="regional-icons-img" />
                    </div>
                  </div>
                  
                  <div className="feature-card">
                    <div className="feature-icon-wrapper">
                      <img src="/api/placeholder/60/60" alt="캘린더 아이콘" className="feature-icon-img" />
                    </div>
                    <div className="feature-content">
                      <h3>월별 축제 캘린더 & 검색</h3>
                      <p>월별로 열리는 축제들을 캘린더로 확인하고, 원하는 타입이나 지역으로 쉽게 검색할 수 있습니다. 놓치고 싶지 않은 축제 일정을 확인 가능해요!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Login Button */}
            <button className="login-btn" onClick={handleLoginRedirect}>
              로그인 하러 가기
            </button>
          </div>
        </div>
      </div>
  );
}