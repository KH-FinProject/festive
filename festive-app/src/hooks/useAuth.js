import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import axiosApi from '../api/axiosAPI';

const useAuth = () => {
  const { login, member, isLoggedIn } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 사용자 정보 요청 시도 (OAuth2 로그인 후에도 자동으로 작동)
        const response = await axiosApi.get('/auth/userInfo');
        if (response.status === 200) {
          login(response.data);
        }
      } catch (error) {
        // 401 오류는 정상적인 상황 (로그인되지 않은 상태)
        if (error.response?.status === 401) {
          console.log('인증되지 않은 상태입니다.');
          // 로그인되지 않은 상태에서는 아무것도 하지 않음
          // 필요한 페이지에서 개별적으로 로그인 요청 처리
        } else {
          console.error('앱 초기화 중 인증 확인 오류:', error);
        }
      }
    };
    initializeAuth();
  }, []);
}; 

export default useAuth;