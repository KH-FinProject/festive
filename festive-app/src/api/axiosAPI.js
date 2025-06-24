import axios from "axios";

export const axiosApi = axios.create({
    baseURL: "http://localhost:8080",
    headers: {
        "Content-Type": "application/json"
    }
    // headers : {"Content-Type" : "application/json"}
    // withCredentials : true // 쿠키 포함 설정
    // 서버에서도 클라이언트가 보낸 쿠키를 받아줄 준비해야함!
    // credential 허용 설정
})
