import { useEffect } from 'react';
import { BrowserRouter } from "react-router-dom";
import Header from "./components/Header.jsx";
import AppRoutes from "./AppRoutes.jsx";
import Footer from "./components/Footer.jsx";
import useAuthStore from './store/useAuthStore';
import axiosApi from './api/axiosAPI';

function App() {
  const { login, member } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!member) {
          const response = await axiosApi.get('/auth/userInfo');
          if (response.status === 200) {
            login(response.data);
          }
        }
      } catch (error) {
        console.error('앱 초기화 중 인증 확인 오류:', error);
      }
    };
    initializeAuth();
  }, [login, member]);

  return (
    <BrowserRouter>
      <Header />
      <AppRoutes />
      <Footer />
    </BrowserRouter>
  );
}

export default App;
