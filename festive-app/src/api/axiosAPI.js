import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const axiosApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}`,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true
    // headers : {"Content-Type" : "application/json"}
    // withCredentials : true // 쿠키 포함 설정
    // 서버에서도 클라이언트가 보낸 쿠키를 받아줄 준비해야함!
    // credential 허용 설정
})

// 응답 인터셉터 - 401 오류 시 토큰 갱신 처리
axiosApi.interceptors.response.use(
    (response) => {
        // 성공적인 응답은 그대로 반환
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // 401 오류이고 아직 재시도하지 않은 요청인 경우
        if (error.response?.status === 401 && !originalRequest._retry) {
            // 토큰 갱신 요청 자체인 경우는 재시도하지 않고 바로 로그아웃
            if (originalRequest.url?.includes('/auth/refresh')) {
                console.error('토큰 갱신 실패:', error);
                
                // useAuthStore 초기화 및 로그아웃
                const { logout } = useAuthStore.getState();
                logout();
                
                // 로그인 페이지로 리다이렉트
                window.location.href = '/signin';
                return Promise.reject(error);
            }

            // /auth/ 경로의 요청인지 확인 (/auth/refresh는 제외)
            const isAuthRequest = originalRequest.url?.includes('/auth/') &&
                                 !originalRequest.url?.includes('/auth/refresh');
            
            if (isAuthRequest) {
                // /auth/ 경로의 요청은 토큰 갱신을 시도하지 않음
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // 토큰 갱신 요청
                const refreshResponse = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/refresh`,
                    {},
                    {
                        withCredentials: true
                    }
                );

                if (refreshResponse.status === 200) {
                    // 토큰 갱신 성공 시 원래 요청 재시도
                    return axiosApi(originalRequest);
                }
            } catch (refreshError) {
                // 토큰 갱신 실패 시 로그아웃 처리
                console.error('토큰 갱신 실패:', refreshError);
                
                // useAuthStore 초기화 및 로그아웃
                const { logout } = useAuthStore.getState();
                logout();
                
                // 로그인 페이지로 리다이렉트
                window.location.href = '/signin';
                return Promise.reject(refreshError);
            }
        }

        // 401이 아닌 오류이거나 이미 재시도한 요청인 경우
        return Promise.reject(error);
    }
);

export default axiosApi;