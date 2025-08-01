import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const axiosApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  // headers : {"Content-Type" : "application/json"}
  // withCredentials : true // 쿠키 포함 설정
  // 서버에서도 클라이언트가 보낸 쿠키를 받아줄 준비해야함!
  // credential 허용 설정
});

// 토큰 갱신 중인지 확인하는 플래그
let isRefreshing = false;
// 토큰 갱신 대기 중인 요청들을 저장하는 배열
let failedQueue = [];

// 대기 중인 요청들을 처리하는 함수
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// 서버 내 Refresh Token 삭제 및 Client 강제 로그아웃
const forceLogout = async () => {
  useAuthStore.getState().logout();
  await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`);
  
  alert("토큰 갱신에 실패했습니다. 다시 로그인해주세요.");
  
  return Promise.reject(new Error("토큰 갱신에 실패했습니다. 다시 로그인해주세요."));
}

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
      
      originalRequest._retry = true; // 재시도임을 표시

      // /auth/userInfo 요청에서 401이 발생한 경우 (최우선 분기)
      if (originalRequest.url?.includes("/auth/userInfo")) {
        useAuthStore.getState().logout(); // alert 없이 조용히 상태만 초기화
        return Promise.reject(error);
      }
      
      // Refresh Token 만료 여부 확인
      const errorCode = error.response.data?.code;
      
      if (errorCode === "INVALID_AUTHENTICATION" || errorCode === "INVALID_REFRESH_TOKEN" || errorCode === "REFRESH_TOKEN_MISSING") {
        // Refresh Token이 없거나, 만료/유효하지 않을 경우 강제 로그아웃
        return forceLogout();
      }
      
      // 토큰 갱신 요청 자체인 경우는 재시도하지 않고 바로 로그아웃
      if (originalRequest.url?.includes("/auth/refresh")) {
        // 로그아웃 처리
        return forceLogout();
      }

      // /auth/ 경로의 요청인지 확인 (/auth/refresh, /auth/userInfo는 제외)
      const isAuthRequest =
        originalRequest.url?.includes("/auth/") &&
        !originalRequest.url?.includes("/auth/refresh") &&
        !originalRequest.url?.includes("/auth/userInfo");

      if (isAuthRequest) {
        console.log("인증 관련 요청이므로 토큰 갱신 시도하지 않음");
        // /auth/ 경로의 요청은 토큰 갱신을 시도하지 않음
        return Promise.reject(error);
      }

      // Refresh Token을 활용한 Access Token 갱신 시도
      if (!isRefreshing) {
        isRefreshing = true;
        console.log("401 오류 발생 - 토큰 갱신 시도");
        
        try {
          // 토큰 갱신 요청
          const refreshResponse = await axios.post(
              `${import.meta.env.VITE_API_URL}/auth/refresh`, {},
              {withCredentials: true}
          );
          
          console.log("토큰 갱신 성공:", refreshResponse.data);
          
          if (refreshResponse.status === 200) {
            // 대기 중인 요청들 처리
            processQueue(null, refreshResponse.data.accessToken);
            
            // 토큰 갱신 성공 시 원래 요청 재시도
            console.log("원래 요청 재시도");
            return axiosApi(originalRequest);
          }
          
        } catch (refreshError) {
          // 토큰 갱신 실패 시 대기 중인 요청들도 모두 실패 처리
          processQueue(refreshError, null);
          
          console.error("토큰 갱신 실패:", refreshError);
          console.error("토큰 갱신 응답:", refreshError.response?.data);
          
          return forceLogout();
        } finally {
          isRefreshing = false;
        }
      }
      
      // 이미 토큰 갱신 중인 경우, 대기열에 추가
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
      .then(() => {
        return axiosApi(originalRequest);
      })
      .catch((err) => {
        return Promise.reject(err);
      });
    }

    // 401이 아닌 오류이거나 이미 재시도한 요청인 경우
    return Promise.reject(error);
  }
);

export default axiosApi;
