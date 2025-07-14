import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // '/profile-images'로 시작하는 모든 요청을 프록시
      "/profile-images": {
        target: "https://api.festivekorea.site", // 백엔드 Spring Boot 서버 주소 (443 포트 - 표준 HTTPS)
        changeOrigin: true, // 대상 서버의 호스트 이름을 변경 (CORS 문제 해결에 유용)
        secure: true, // HTTPS 백엔드 사용
        // rewrite: (path) => path.replace(/^\/api/, ''), // 필요하다면 경로 재작성 (예: /api/users -> /users)
        // 이 경우엔 /profile-images 자체가 백엔드 경로이므로 필요 없음
      },
      "/board-images": {
        target: "https://api.festivekorea.site", // 백엔드 Spring Boot 서버 주소 (443 포트 - 표준 HTTPS)
        changeOrigin: true, // 대상 서버의 호스트 이름을 변경 (CORS 문제 해결에 유용)
        secure: true, // HTTPS 백엔드 사용
        // rewrite: (path) => path.replace(/^\/api/, ''), // 필요하다면 경로 재작성 (예: /api/users -> /users)
        // 이 경우엔 /profile-images 자체가 백엔드 경로이므로 필요 없음
      },
      "/upload/festive/booth": {
        target: "https://api.festivekorea.site", // 백엔드 Spring Boot 서버 주소 (443 포트 - 표준 HTTPS)
        changeOrigin: true, // 대상 서버의 호스트 이름을 변경 (CORS 문제 해결에 유용)
        secure: true, // HTTPS 백엔드 사용
        // rewrite: (path) => path.replace(/^\/api/, ''), // 필요하다면 경로 재작성 (예: /api/users -> /users)
        // 이 경우엔 /profile-images 자체가 백엔드 경로이므로 필요 없음
      },
      // 백엔드 API 경로 - 우선순위 높음
      "/api": {
        target: "https://api.festivekorea.site", // 443 포트 - 표준 HTTPS
        changeOrigin: true,
        secure: true,
      },

      // TourAPI 경로 - 별도 경로로 분리
      "/tour-api": {
        target: "https://apis.data.go.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tour-api/, ""),
        secure: true,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("🚨 TourAPI 프록시 오류:", err.message);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("📡 TourAPI 프록시 요청:", req.method, req.url);
            // CORS 헤더 추가
            proxyReq.setHeader("Accept", "application/json");
            proxyReq.setHeader(
              "User-Agent",
              "Mozilla/5.0 (compatible; Festive-App/1.0)"
            );
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log(proxyRes.statusCode, req.url);
            // CORS 헤더 설정
            proxyRes.headers["Access-Control-Allow-Origin"] = "*";
            proxyRes.headers["Access-Control-Allow-Methods"] =
              "GET, POST, PUT, DELETE, OPTIONS";
            proxyRes.headers["Access-Control-Allow-Headers"] =
              "Content-Type, Authorization";
          });
        },
      },

      /* 공영주차장 API 사용시 CORS policy 에러로 추가 : 미애 */
      "/carpark-api": {
        target: "https://api.odcloud.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/carpark-api/, ""),
        secure: true,
      },

      /* 웹소켓 연결을 위한 설정 : 성원*/
      "/ws": {
        target: "https://api.festivekorea.site", // 443 포트 - 표준 HTTPS
        ws: true,
        changeOrigin: true,
      },
    },
  },
  define: {},
});
