// Zustand 라이브러리를 사용하여 상태 관리 스토어 생성
import { create } from "zustand";
// Zustand의 persist 미들웨어를 사용하여 상태를 localStorage에 영구 저장
import { createJSONStorage, persist } from "zustand/middleware";

// 인증 관련 상태를 관리하는 스토어 생성
const useAuthStore = create(
  // persist 미들웨어로 감싸서 브라우저 새로고침 후에도 상태 유지
  // persist 미들웨어란?
  // - Zustand의 상태를 브라우저의 localStorage, sessionStorage 등에 자동으로 저장/복원해주는 미들웨어
  // - 사용자가 페이지를 새로고침하거나 브라우저를 닫았다가 다시 열어도 이전 상태가 그대로 유지됨
  //
  // 왜 사용해야 하는가?
  // 1. 사용자 경험(UX) 향상: 새로고침해도 로그인 상태가 유지되어 다시 로그인할 필요가 없음
  // 2. 데이터 지속성: accessToken 같은 중요한 인증 정보가 페이지 새로고침으로 인해 사라지지 않음
  // 3. 자동 동기화: 상태가 변경될 때마다 자동으로 localStorage에 저장되고, 앱 시작 시 자동으로 복원됨
  // 4. 개발 편의성: 별도의 localStorage 관리 코드를 작성할 필요가 없음
  persist(
    // 스토어의 상태와 액션을 정의하는 함수
    (set) => ({
      accessToken: null,
      member: null,

      login: (token, user) => set({ accessToken: token, member: user }),
      logout: () => set({ accessToken: null, member: null })
    }),
    {
      // localStorage에 저장될 때 사용할 키 이름
      // 브라우저 개발자도구 > Application > Local Storage에서 이 이름으로 저장된 것을 확인할 수 있음
      name: "auth-store",
      // JSON 형태로 localStorage에 저장하도록 설정
      // createJSONStorage는 객체를 JSON 문자열로 변환하여 저장하고, 읽을 때는 다시 객체로 변환해줌
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export default useAuthStore;
