import { useState } from 'react';

const ResetPw = ({ userId, authMethod, email, tel, navigate }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPwChanging, setIsPwChanging] = useState(false);

  const handlePasswordChange = async () => {
    if (!userId || !oldPassword || !newPassword) {
      alert('아이디, 기존 비밀번호, 새 비밀번호를 모두 입력해주세요.');
      return;
    }
    try {
      setIsPwChanging(true);
      const payload = {
        userId,
        oldPassword,
        newPassword,
      };
      // 필요시 인증방식/이메일/전화번호도 payload에 추가 가능
      const response = await import('../../api/axiosApi').then(api => api.default.post('/auth/findPw/reset', payload));
      if (response.data.success) {
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setOldPassword('');
        setNewPassword('');
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
    <div className="find-input-group">
      <label htmlFor="oldPassword" className="find-input-label">
        기존 비밀번호
      </label>
      <input
        id="oldPassword"
        name="oldPassword"
        type="password"
        required
        value={oldPassword}
        onChange={e => setOldPassword(e.target.value)}
        placeholder="기존 비밀번호 입력"
        className="find-input-field"
      />
      <label htmlFor="newPassword" className="find-input-label">
        새 비밀번호
      </label>
      <input
        id="newPassword"
        name="newPassword"
        type="password"
        required
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        placeholder="새 비밀번호 입력"
        className="find-input-field"
      />
      <button
        type="button"
        className="find-btn find-btn-submit"
        onClick={handlePasswordChange}
        disabled={isPwChanging || !oldPassword || !newPassword}
      >
        {isPwChanging ? '변경 중...' : '비밀번호 변경'}
      </button>
    </div>
  );
};

export default ResetPw; 