import { useState } from 'react';
import axiosApi from '../../api/axiosAPI';
import './ResetPw.css';

const ResetPw = ({ userId, navigate }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPwChanging, setIsPwChanging] = useState(false);

  const handlePasswordChange = async () => {
    if (!userId || !oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      alert('아이디, 기존 비밀번호, 새 비밀번호, 새 비밀번호 확인을 모두 입력해주세요.');
      return;
    }
    
    if (newPassword.trim() !== confirmPassword.trim()) {
      alert('새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    
    try {
      setIsPwChanging(true);
      const payload = {
        userId: userId.trim(),
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim()
      };

      const response = await axiosApi.post('/auth/findPw/reset', payload);
      if (response.data.success) {
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
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
      <div className="reset-pw-input-group">
        <label htmlFor="oldPassword" className="find-input-label">
          기존 비밀번호
        </label>
        <input
          id="oldPassword"
          name="oldPassword"
          type="password"
          required
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value.trim())}
          placeholder="기존 비밀번호 입력"
          className="reset-pw-input-field"
          autoFocus
        />
      </div>
      
      <div className="reset-pw-input-group">
        <label htmlFor="newPassword" className="find-input-label">
          새 비밀번호
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          value={newPassword}
          onChange={e => setNewPassword(e.target.value.trim())}
          placeholder="새 비밀번호 입력"
          className="reset-pw-input-field"
        />
      </div>
      
      <div className="reset-pw-input-group">
        <label htmlFor="confirmPassword" className="find-input-label">
          새 비밀번호 확인
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value.trim())}
          placeholder="새 비밀번호 확인"
          className="reset-pw-input-field"
        />
      </div>
      
      <button
        type="button"
        className="reset-pw-btn-submit"
        onClick={(e) => {
          if (isPwChanging || !oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            e.preventDefault();
            return;
          }
          handlePasswordChange();
        }}
        disabled={isPwChanging || !oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
      >
        {isPwChanging ? '변경 중...' : '비밀번호 변경'}
      </button>
    </div>
  );
};

export default ResetPw; 