import { useState, useEffect, useRef } from 'react';
import './Find.css';
import {useSearchParams, useNavigate} from "react-router-dom";
import axiosApi from '../../api/axiosAPI';
import ResetPw from './ResetPw';
import SearchIdResult from './SearchIdResult';

const Find = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || 'id'); // 'id' or 'pw', 기본값은 'id'
  const [showResult, setShowResult] = useState(false);
  const [formData, setFormData] = useState({
    username: '', // 아이디 찾기용 이름
    id: '', // 비밀번호 찾기용 아이디
    email: '',
    tel: '',
    authKey: '',
    authMethod: 'email'
  });
  const [isSending, setIsSending] = useState(false); // 발송 중
  const [isVerifying, setIsVerifying] = useState(false); // 인증 확인 중
  const [isAuthKeyVerified, setIsAuthKeyVerified] = useState(false); // 인증 성공 여부
  const [foundId, setFoundId] = useState(''); // 찾은 아이디 상태
  const [newPassword, setNewPassword] = useState(''); // 비밀번호 변경용
  const [isPwChanging, setIsPwChanging] = useState(false); // 비밀번호 변경 중
  const [currentView, setCurrentView] = useState('find'); // 'find' | 'resetPw'
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState(''); // 기존 비밀번호
  
  // useRef로 입력 필드 참조
  const usernameRef = useRef(null);
  const idRef = useRef(null);
  const authKeyRef = useRef(null);
  
  // URL 파라미터 변경 감지하여 activeTab 동기화
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");

    if (tabFromUrl && (tabFromUrl === 'id' || tabFromUrl === 'pw')) {
      setActiveTab(tabFromUrl);

    } else if (!tabFromUrl) {
      // URL에 tab 파라미터가 없으면 기본값으로 설정하고 URL 업데이트
      setSearchParams({ tab: 'id' });
    }
  }, [searchParams, setSearchParams]);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 이메일이 변경되면 인증번호 입력값과 인증 성공 상태 초기화
    if (field === 'email') {
      setFormData(prev => ({ ...prev, authKey: '' }));
      setIsAuthKeyVerified(false);
    }
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }); // URL에 tab 파라미터 추가
    setCurrentView('find'); // 뷰를 찾기 화면으로 초기화
    setShowResult(false);
    setIsAuthKeyVerified(false); // 인증 상태 초기화
    setFoundId(''); // 찾은 아이디 초기화
    
    // 탭 변경 시 모든 입력값 초기화
    setFormData({
      username: '', // 아이디 찾기용 이름
      id: '', // 비밀번호 찾기용 아이디
      email: '',
      tel: '',
      authKey: '',
      authMethod: 'email'
    });
    
    // 탭 변경 후 (DOM 업데이트 후) 해당 입력 필드에 포커스
    setTimeout(() => {
      if (tab === 'id' && usernameRef.current) {
        usernameRef.current.focus();
      } else if (tab === 'pw' && idRef.current) {
        idRef.current.focus();
      }
    }, 0);
  };
  
  // 공통 인증 요청 API 호출 메서드
  const callAuthRequestApi = async (endpoint, payload) => {
    try {
      setIsSending(true);
      const response = await axiosApi.post(endpoint, payload);
      const { success, message } = response.data;
      
      if (success) {
        alert(message);
        setIsAuthKeyVerified(false);
        setFormData(prev => ({ ...prev, authKey: '' }));
        
        // 인증번호 발송 성공 후 인증번호 입력 필드에 포커스
        setTimeout(() => {
          if (authKeyRef.current) {
            authKeyRef.current.focus();
          }
        }, 100);
        
        return true;

      } else {
        alert(message);
        return false;
      }

    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);

      } else {
        alert('알 수 없는 오류가 발생했습니다.');
      }
      return false;

    } finally {
      setIsSending(false);
    }
  };

  // 공통 입력값 유효성 검사 메서드
  const validateAuthRequestInputs = () => {
    if (formData.authMethod === 'email' && !formData.email) {
      alert('이메일을 입력해주세요.');
      return false;

    } else if (formData.authMethod === 'tel' && !formData.tel) {
      alert('전화번호를 입력해주세요.');
      return false;
    }

    return true;
  };

  const handleIdAuthRequest = async () => {
    if (!validateAuthRequestInputs()) {
      return;
    }

    let payload;
    if (formData.authMethod === 'email') {
      payload = {
        name: formData.username,
        authMethod: formData.authMethod,
        email: formData.email
      };

    } else if (formData.authMethod === 'tel') {
      payload = {
        name: formData.username,
        authMethod: formData.authMethod,
        tel: formData.tel
      };
    }

    await callAuthRequestApi('/auth/findId', payload);
  };

  const handlePwAuthRequest = async () => {
    if (!validateAuthRequestInputs()) {
      return;
    }

    let payload;
    if (formData.authMethod === 'email') {
      payload = {
        id: formData.id,
        email: formData.email
      };

    } else if (formData.authMethod === 'tel') {
      // 전화번호 인증은 기존대로 /auth/findId 사용 (추후 별도 구현 가능)
      payload = {
        userId: formData.id,
        authMethod: formData.authMethod,
        tel: formData.tel
      };
    }

    const endpoint = formData.authMethod === 'email' ? '/auth/findPw' : '/auth/findId';
    await callAuthRequestApi(endpoint, payload);
  };

  // 공통 API 호출 메서드
  const callFindApi = async (endpoint, payload) => {
    try {
      const response = await axiosApi.post(endpoint, payload);
      if (response.data.success && response.data.userId) {
        setFoundId(response.data.userId);
        return true;

      } else {
        setFoundId('');
        alert(response.data.message || '일치하는 회원이 없습니다.');
        return false;
      }

    } catch (error) {
      setFoundId('');
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);

      } else {
        alert('조회 중 오류가 발생했습니다.');
      }
      return false;
    }
  };

  // 공통 유효성 검사 메서드
  const validateAuthInputs = () => {
    if (formData.authMethod === 'email' && (!formData.email || !formData.authKey)) {
      alert('이메일과 인증번호를 모두 입력해주세요.');
      return false;

    } else if (formData.authMethod === 'tel' && (!formData.tel || !formData.authKey)) {
      alert('전화번호와 인증번호를 모두 입력해주세요.');
      return false;
    }
    
    return true;
  };
  
  const handleIdSubmit = async (e) => {
    e.preventDefault();
    
    // 아이디 찾기 유효성 검사
    if (!formData.username) {
      alert('이름을 입력해주세요.');
      return;
    }
    
    if (!validateAuthInputs()) {
      return;
    }
    
    // API 호출
    let payload;
    if (formData.authMethod === 'email') {
      payload = {
        name: formData.username,
        email: formData.email
      };
    } else if (formData.authMethod === 'tel') {
      payload = {
        name: formData.username,
        tel: formData.tel
      };
    }
    
    const success = await callFindApi('/auth/findId/result', payload);
    if (success) {
      setShowResult(true);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    
    // 비밀번호 찾기 유효성 검사
    if (!formData.id || !formData.authKey) {
      alert('아이디와 인증번호를 모두 입력해주세요.');
      return;
    }

    if (!validateAuthInputs()) {
      return;
    }

    // ResetPw 화면으로 전환
    setCurrentView('resetPw');
  };
  
  const handleCancel = () => {
    setFormData({
      username: '', // 아이디 찾기용 이름
      id: '', // 비밀번호 찾기용 아이디
      email: '',
      tel: '',
      authKey: '',
      authMethod: 'email'
    });
    setShowResult(false);
  };
  
  const handleResultClick = () => {
    alert('아이디 찾기 결과 처리');
  };
  
  // 인증번호 확인
  const handleCheckAuthKey = async () => {
    if (!formData.email || !formData.tel && !formData.authKey) {
      alert('이메일 혹은 전화번호, 인증번호를 모두 입력해주세요.');
      return;
    }
    try {
      setIsVerifying(true);
      const response = await axiosApi.post('/auth/checkAuthKey', {
        email: formData.email || null,
        tel: formData.tel || null,
        authKey: formData.authKey
      });

      if (response.data.success) {
        alert('인증번호가 확인되었습니다.');
        setIsAuthKeyVerified(true);

      } else {
        alert(response.data.message || '인증번호가 일치하지 않습니다.');
        setIsAuthKeyVerified(false);
      }

    } catch (error) {
      setIsAuthKeyVerified(false);

      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);

      } else {
        alert('인증번호 확인 중 오류가 발생했습니다.');
      }
      
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword) {
      alert('기존 비밀번호, 새 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    try {
      setIsPwChanging(true);
      // 실제 비밀번호 변경 API 호출 (엔드포인트는 /auth/findPw/reset 등으로 가정)
      const response = await axiosApi.post('/auth/findPw/reset', {
        oldPassword: oldPassword,
        newPassword: newPassword
      });
      if (response.data.success) {
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setShowResult(false);
        setFormData({ 
          username: '', // 아이디 찾기용 이름
          id: '', // 비밀번호 찾기용 아이디
          email: '', 
          tel: '', 
          authKey: '', 
          authMethod: 'email' 
        });
        setNewPassword('');
        setOldPassword('');
        setIsAuthKeyVerified(false);
        // 로그인 페이지로 이동
        navigate('/signin');
      } else {
        alert(response.data.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('비밀번호 변경 중 오류가 발생했습니다.');
      }
    } finally {
      setIsPwChanging(false);
    }
  };
  
  return (
    <div className="find-container">
      <div className="find-wrapper">
        <div className="find-card">
          {/* 탭 헤더 */}
          <div className="tab-header">
            <button type="button"
                className={`find-tab-button ${activeTab === 'id' ? 'active' : ''}`}
                onClick={() => handleTabChange('id')}
            >
              아이디 찾기
            </button>
            <button
                type="button"
                className={`find-tab-button ${activeTab === 'pw' ? 'active' : ''}`}
                onClick={() => handleTabChange('pw')}
            >
              비밀번호 찾기
            </button>
          </div>
          
          {/* 뷰에 따른 렌더링 */}
          {currentView === 'find' && (
            <form 
              className="find-form" 
            >
              {/* id/pw에 따라 입력 필드 변경 */}
              <div className="find-input-group">
                <label htmlFor={activeTab === 'id' ? 'username' : 'id'} className="find-input-label">
                  {activeTab === 'id' ? 'UserName' : 'ID'}
                </label>
                {activeTab === 'id' ? (
                  <input
                      ref={usernameRef}
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="이름"
                      className="find-input-field"
                  />
                ) : (
                  <input
                      ref={idRef}
                      id="id"
                      name="id"
                      type="text"
                      required
                      value={formData.id}
                      onChange={(e) => handleInputChange('id', e.target.value)}
                      placeholder="아이디"
                      className="find-input-field"
                  />
                )}
              </div>
              {/* 인증 방식 선택 및 입력 필드 (id/pw 동일 구조) */}
              <div className="find-input-group">
                <label className="find-input-label">인증 방식 선택</label>
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
              {/* 이메일/전화번호 입력 필드 */}
              {formData.authMethod === 'email' ? (
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
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isSending && !isAuthKeyVerified) {
                              e.preventDefault();
                              activeTab === 'id' ? handleIdAuthRequest() : handlePwAuthRequest();
                            }
                          }}
                          placeholder="이메일"
                          className="find-input-field"
                      />
                    </div>
                    <button
                        type="button"
                        onClick={() => activeTab === 'id' ? handleIdAuthRequest() : handlePwAuthRequest()}
                        className="auth-button"
                        disabled={isSending}
                    >
                      {isSending ? '발송 중...' : '발송'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="find-input-group">
                  <label htmlFor="tel" className="find-input-label">
                    Phone
                  </label>
                  <div className="auth-input-group">
                    <div className="auth-input-wrapper">
                      <input
                          id="tel"
                          name="tel"
                          type="tel"
                          required
                          value={formData.tel}
                          onChange={(e) => handleInputChange('tel', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isSending && !isAuthKeyVerified) {
                              e.preventDefault();
                              activeTab === 'id' ? handleIdAuthRequest() : handlePwAuthRequest();
                            }
                          }}
                          placeholder="전화번호"
                          className="find-input-field"
                      />
                    </div>
                    <button
                        type="button"
                        onClick={() => activeTab === 'id' ? handleIdAuthRequest() : handlePwAuthRequest()}
                        className="auth-button"
                        disabled={isSending}
                    >
                      {isSending ? '인증 중...' : '인증'}
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
                        ref={authKeyRef}
                        id="authKey"
                        name="authKey"
                        type="text"
                        required
                        value={formData.authKey}
                        onChange={(e) => handleInputChange('authKey', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isVerifying && !isAuthKeyVerified && formData.authKey.trim()) {
                            e.preventDefault();
                            handleCheckAuthKey();
                          }
                        }}
                        placeholder="인증번호"
                        className="find-input-field"
                        disabled={isAuthKeyVerified}
                    />
                  </div>
                  <button
                      type="button"
                      className="auth-button"
                      onClick={handleCheckAuthKey}
                      disabled={isVerifying || isAuthKeyVerified}
                  >
                    {isVerifying ? '확인 중...' : '인증 확인'}
                  </button>
                </div>
              </div>
              {/* 버튼 그룹 (id, pw 탭 모두) */}
              {(activeTab === 'id' || activeTab === 'pw') && (
                <div className="find-button-group">
                  <button
                      type="button"
                      className={`find-btn find-btn-submit${(!isAuthKeyVerified && (activeTab === 'id' || activeTab === 'pw')) ? ' disabled' : ''}`}
                      disabled={(activeTab === 'id' || activeTab === 'pw') && !isAuthKeyVerified}
                      onClick={(e) => {
                        e.preventDefault();
                        activeTab === 'id' ? handleIdSubmit(e) : handlePwSubmit(e);
                      }}
                  >
                    {activeTab === 'id' ? '아이디 조회하기' : '비밀번호 변경하기'}
                  </button>
                </div>
              )}
              {/* 인증 미완료 안내 */}
              {((activeTab === 'id' && !isAuthKeyVerified) || (activeTab === 'pw' && !isAuthKeyVerified)) && (
                <div className="additional-text" style={{ color: '#ef4444', marginTop: '0.5rem' }}>
                  인증 확인이 완료되어야 {activeTab === 'id' ? '아이디 조회가' : '비밀번호 변경이'} 가능합니다.
                </div>
              )}
            </form>
          )}
          
          {/* ResetPw 컴포넌트 */}
          {currentView === 'resetPw' && (
            <ResetPw
              userId={formData.id}
              authMethod={formData.authMethod}
              email={formData.email}
              tel={formData.tel}
              navigate={navigate}
            />
          )}
          
          {/* 결과 섹션 - 모달 형태로 표시 */}
          <SearchIdResult
            foundId={foundId}
            show={showResult && activeTab === 'id'}
            onClose={() => setShowResult(false)}
            onLogin={() => {
              setShowResult(false);
              navigate('/signin');
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Find;