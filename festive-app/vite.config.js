import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    define: {
      "process.env.VITE_KAKAO_MAP_API_KEY": JSON.stringify(
        env.VITE_KAKAO_MAP_API_KEY
      ),
      VITE_KAKAO_MAP_API_KEY: JSON.stringify(env.VITE_KAKAO_MAP_API_KEY),
    },
  };
});
