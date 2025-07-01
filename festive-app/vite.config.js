import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "https://apis.data.go.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: true,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("🚨 프록시 오류:", err.message);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("📡 프록시 요청:", req.method, req.url);
            // CORS 헤더 추가
            proxyReq.setHeader("Accept", "application/json");
            proxyReq.setHeader(
              "User-Agent",
              "Mozilla/5.0 (compatible; Festive-App/1.0)"
            );
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("📊 프록시 응답:", proxyRes.statusCode, req.url);
            // CORS 헤더 설정
            proxyRes.headers["Access-Control-Allow-Origin"] = "*";
            proxyRes.headers["Access-Control-Allow-Methods"] =
              "GET, POST, PUT, DELETE, OPTIONS";
            proxyRes.headers["Access-Control-Allow-Headers"] =
              "Content-Type, Authorization";
          });
        },
      },

      /* 전기차충전소 API 사용시 CORS policy 에러로 추가 : 미애 */
      "/kepco-api": {
        target: "https://bigdata.kepco.co.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kepco-api/, ""),
        secure: true,
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
        target: "http://localhost:8080",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  define: {},
});
