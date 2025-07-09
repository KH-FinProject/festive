import { useEffect } from "react";
import useAuthStore from "../store/useAuthStore";
import axiosApi from "../api/axiosAPI";

const useAuth = () => {
  const { login, logout, member, isLoggedIn } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // authStore에 로그인 상태가 없을 때만 서버에 요청
        if (!isLoggedIn || !member) {
          const response = await axiosApi.get("/auth/userInfo");
          if (response.status === 200) {
            login(response.data);
          }
        }
      } catch (error) {
        // 401 오류는 정상적인 상황 (로그인되지 않은 상태)
        if (error.response?.status === 401) {
          // 서버에서 인증되지 않았다고 응답하면 로컬 상태도 초기화
          logout();
        } else {
          // 네트워크 오류 등으로 인해 서버에 접근할 수 없는 경우에는 
          // 기존 상태를 유지 (로그아웃하지 않음)
        }
      }
    };
    initializeAuth();
  }, []);
};

export default useAuth;
