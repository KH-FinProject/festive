import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import useAuthStore from '../store/useAuthStore';
import axiosApi from '../api/axiosAPI';

const useAuth = () => {
  const { login, member, isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 이미 로그인된 상태라면 초기화하지 않음
        if (isLoggedIn && member) {
          return;
        }

        // 사용자 정보 요청 시도 (OAuth2 로그인 후에도 자동으로 작동)
        const response = await axiosApi.get('/auth/userInfo');
        if (response.status === 200) {
          login(response.data);
        }
      } catch (error) {
        // 401 오류는 정상적인 상황 (로그인되지 않은 상태)
        if (error.response?.status === 401) {
          console.log('인증되지 않은 상태입니다.');
          // 로그인되지 않은 상태에서 로그인 페이지로 이동
          navigate('/signin');
        } else {
          console.error('앱 초기화 중 인증 확인 오류:', error);
        }
      }
    };
    initializeAuth();
  }, [isLoggedIn, member, login, navigate]);
}; 

export default useAuth;