import { useState } from 'react';
import './Find.css';
import {useSearchParams, useNavigate} from "react-router-dom";
import axiosApi from '../../api/axiosApi';
import ResetPw from './ResetPw';
import SearchIdResult from './SearchIdResult';

const Find = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab")); // 'id' or 'pw'
  const [showResult, setShowResult] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
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
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState(''); // 기존 비밀번호
  
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
    setShowResult(false);
    // 탭 변경 시 해당 탭과 관련없는 필드 초기화
    if (tab === 'id') {
      setFormData(prev => ({
        ...prev,
        tel: '',
        authKey: '',
        authMethod: 'email'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        email: '',
        authKey: '',
        authMethod: 'email'
      }));
    }
  };
  
  const handleAuthRequest = async () => {
    if (activeTab === 'id') {
      if (formData.authMethod === 'email' && formData.email) {
        const payload = {
          name: formData.username,
          authMethod: formData.authMethod,
          email: formData.email
        };
        try {
          setIsSending(true);
          const response = await axiosApi.post('/auth/findId', payload);
          const { success, message } = response.data;
          if(success) {
            alert(message);
            setIsAuthKeyVerified(false);
            setFormData(prev => ({ ...prev, authKey: '' }));
          }
        } catch (error) {
          if (error.response && error.response.data && error.response.data.message) {
            alert(error.response.data.message);
          } else {
            alert('알 수 없는 오류가 발생했습니다.');
          }
        } finally {
          setIsSending(false);
        }
      } else if (formData.authMethod === 'tel' && formData.tel) {
        const payload = {
          name: formData.username,
          authMethod: formData.authMethod,
          tel: formData.tel
        };
        try {
          setIsSending(true);
          const response = await axiosApi.post('/auth/findId', payload);
          const { success, message } = response.data;
          if(success) {
            alert(message);
            setIsAuthKeyVerified(false);
            setFormData(prev => ({ ...prev, authKey: '' }));
          } else {
            alert(message);
          }
        } catch (error) {
          if (error.response && error.response.data && error.response.data.message) {
            alert(error.response.data.message);
          } else {
            alert('알 수 없는 오류가 발생했습니다.');
          }
        } finally {
          setIsSending(false);
        }
      } else {
        alert(formData.authMethod === 'email' ? '이메일을 입력해주세요.' : '전화번호를 입력해주세요.');
      }

    } else if (activeTab === 'pw') {
      if (formData.authMethod === 'email' && formData.email) {
        const payload = {
          id: formData.username,
          email: formData.email
        };

        try {
          setIsSending(true);
          const response = await axiosApi.post('/auth/findPw', payload);
          const { success, message } = response.data;

          if(success) {
            alert(message);
            setIsAuthKeyVerified(false);
            setFormData(prev => ({ ...prev, authKey: '' }));
          }

        } catch (error) {
          if (error.response && error.response.data && error.response.data.message) {
            alert(error.response.data.message);
          } else {
            alert('알 수 없는 오류가 발생했습니다.');
          }

        } finally {
          setIsSending(false);
        }
      } else if (formData.authMethod === 'tel' && formData.tel) {
        // 전화번호 인증은 기존대로 /auth/findId 사용 (추후 별도 구현 가능)
        const payload = {
          userId: formData.username,
          authMethod: formData.authMethod,
          tel: formData.tel
        };

        try {
          setIsSending(true);
          const response = await axiosApi.post('/auth/findId', payload);
          const { success, message } = response.data;

          if(success) {
            alert(message);
            setIsAuthKeyVerified(false);
            setFormData(prev => ({ ...prev, authKey: '' }));

          } else {
            alert(message);
          }

        } catch (error) {
          if (error.response && error.response.data && error.response.data.message) {
            alert(error.response.data.message);

          } else {
            alert('알 수 없는 오류가 발생했습니다.');
          }

        } finally {
          setIsSending(false);
        }

      } else {
        alert(formData.authMethod === 'email' ? '이메일을 입력해주세요.' : '전화번호를 입력해주세요.');
      }

    } else {
      alert('전화번호를 입력해주세요.');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('아이디 찾기 시도:', formData);
    
    // 간단한 유효성 검사
    if (!formData.username) {
      alert('이름을 입력해주세요.');
      return;
    }
    
    if (activeTab === 'id') {
      if (formData.authMethod === 'email' && (!formData.email || !formData.authKey)) {
        alert('이메일과 인증번호를 모두 입력해주세요.');
        return;
        
      } else if (formData.authMethod === 'tel' && (!formData.tel || !formData.authKey)) {
        alert('전화번호와 인증번호를 모두 입력해주세요.');
        return;
      }
    }
    
    if (activeTab === 'pw' && (!formData.username || !formData.authKey)) {
      alert('아이디와 인증번호를 모두 입력해주세요.');
      return;
    }
    // 실제 아이디 찾기 API 호출
    if (activeTab === 'id' && formData.authMethod === 'email') {
      try {
        const response = await axiosApi.post('/auth/findId/result', {
          name: formData.username,
          email: formData.email
        });
        if (response.data.success && response.data.userId) {
          setFoundId(response.data.userId);
        } else {
          setFoundId('');
          alert(response.data.message || '일치하는 회원이 없습니다.');
        }
      } catch (error) {
        setFoundId('');
        if (error.response && error.response.data && error.response.data.message) {
          alert(error.response.data.message);
        } else {
          alert('아이디 조회 중 오류가 발생했습니다.');
        }
      }
    }
    if (activeTab === 'pw') {
      setShowResult(true);
      return;
    }
    setShowResult(true);
  };
  
  const handleCancel = () => {
    setFormData({
      username: '',
      email: '',
      tel: '',
      authKey: ''
    });
    setShowResult(false);
  };
  
  const handleResultClick = () => {
    alert('아이디 찾기 결과 처리');
  };
  
  // 인증번호 확인
  const handleCheckAuthKey = async () => {
    if (!formData.email || !formData.authKey) {
      alert('이메일과 인증번호를 모두 입력해주세요.');
      return;
    }
    try {
      setIsVerifying(true);
      const response = await axiosApi.post('/auth/checkAuthKey', {
        email: formData.email,
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
        setFormData({ username: '', email: '', tel: '', authKey: '', authMethod: 'email' });
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
            
            {/* 아이디 찾기/비밀번호 찾기 폼 */}
            <form className="find-form" onSubmit={handleSubmit}>
              {/* id/pw에 따라 입력 필드 변경 */}
              <div className="find-input-group">
                <label htmlFor="username" className="find-input-label">
                  {activeTab === 'id' ? 'UserName' : 'ID'}
                </label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder={activeTab === 'id' ? '이름' : '아이디'}
                    className="find-input-field"
                />
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
                          placeholder="이메일"
                          className="find-input-field"
                      />
                    </div>
                    <button
                        type="button"
                        onClick={handleAuthRequest}
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
                          placeholder="전화번호"
                          className="find-input-field"
                      />
                    </div>
                    <button
                        type="button"
                        onClick={handleAuthRequest}
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
                        id="authKey"
                        name="authKey"
                        type="text"
                        required
                        value={formData.authKey}
                        onChange={(e) => handleInputChange('authKey', e.target.value)}
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
                      type="submit"
                      className={`find-btn find-btn-submit${(!isAuthKeyVerified && (activeTab === 'id' || activeTab === 'pw')) ? ' disabled' : ''}`}
                      disabled={(activeTab === 'id' || activeTab === 'pw') && !isAuthKeyVerified}
                  >
                    조회하기
                  </button>
                </div>
              )}
              {/* 인증 미완료 안내 */}
              {((activeTab === 'id' && !isAuthKeyVerified) || (activeTab === 'pw' && !isAuthKeyVerified)) && (
                <div className="additional-text" style={{ color: '#ef4444', marginTop: '0.5rem' }}>
                  인증 확인이 완료되어야 {activeTab === 'id' ? '조회가' : '비밀번호 변경이'} 가능합니다.
                </div>
              )}
              {/* 비밀번호 변경 입력 및 버튼 (pw 탭, 인증 완료 후 조회하기 버튼 클릭 시) */}
              {activeTab === 'pw' && isAuthKeyVerified && showResult && (
                <ResetPw
                  userId={formData.username}
                  authMethod={formData.authMethod}
                  email={formData.email}
                  tel={formData.tel}
                  navigate={navigate}
                />
              )}
            </form>
          </div>
          
          {/* 결과 섹션 */}
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
  );
};

export default Find;