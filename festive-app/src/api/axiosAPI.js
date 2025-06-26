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

axiosApi.interceptors.request.use(
    (config) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)   

export default axiosApi;