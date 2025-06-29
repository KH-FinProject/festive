import { useEffect } from 'react';
import { BrowserRouter, useNavigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import AppRoutes from "./AppRoutes.jsx";
import Footer from "./components/Footer.jsx";
import useAuthStore from './store/useAuthStore';
import axiosApi from './api/axiosAPI';

function AppContent() {
  const { login, member, isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // 로그아웃 상태일 때 로그인 페이지로 이동
    if (!isLoggedIn && !member) {
      navigate('/signin');
    }
  }, [isLoggedIn, member, navigate]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 이미 로그인된 상태라면 초기화하지 않음
        if (isLoggedIn && member) {
          return;
        }

        // 사용자 정보 요청 시도
        // axiosAPI.js에서 /auth/userInfo 요청에 대해서는 토큰 갱신을 시도하지 않음
        // 따라서 401 오류는 정상적인 상황 (로그인되지 않은 상태)
        const response = await axiosApi.get('/auth/userInfo');
        if (response.status === 200) {
          login(response.data);
        }
      } catch (error) {
        // 401 오류는 정상적인 상황 (로그인되지 않은 상태)
        if (error.response?.status === 401) {
          console.log('인증되지 않은 상태입니다.');
        } else {
          console.error('앱 초기화 중 인증 확인 오류:', error);
        }
      }
    };
    initializeAuth();
  }, [isLoggedIn, member, login]);

  return (
    <>
      <Header />
      <AppRoutes />
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
