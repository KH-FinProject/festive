import { useEffect } from 'react';
import { BrowserRouter } from "react-router-dom";
import Header from "./components/Header.jsx";
import AppRoutes from "./AppRoutes.jsx";
import Footer from "./components/Footer.jsx";
import useAuthStore from './store/useAuthStore';
import axiosApi from './api/axiosAPI';

function App() {
  const { login, member, isLoggedIn } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isLoggedIn && !member) {
          const response = await axiosApi.get('/auth/userInfo');
          if (response.status === 200) {
            login(response.data);
          }
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('앱 초기화 중 인증 확인 오류:', error);
        }
      }
    };
    initializeAuth();
  }, []);

  return (
    <BrowserRouter>
      <Header />
      <AppRoutes />
      <Footer />
    </BrowserRouter>
  );
}

export default App;
