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

  persist(
    // 스토어의 상태와 액션을 정의하는 함수
    (set) => ({
      // 로그인 상태 & 사용자 정보 저장
      isLoggedIn: false,
      member: null,

      // 상태 설정 함수
      login: (userInfo) => set({ isLoggedIn: true, member: userInfo }),
      logout: () => set({ isLoggedIn: false, member: null }),

      // 닉네임 업데이트 함수
      updateNickname: (newNickname) =>
        set((state) => ({
          member: state.member
            ? { ...state.member, nickname: newNickname }
            : null,
        })),

      // 프로필 이미지 업데이트 함수
      updateProfileImage: (newProfileImage) =>
        set((state) => ({
          member: state.member
            ? { ...state.member, profileImage: newProfileImage }
            : null,
        })),

      // 프로필 정보 전체 업데이트 함수
      updateProfile: (profileData) =>
        set((state) => ({
          member: state.member ? { ...state.member, ...profileData } : null,
        })),
    }),
    {
      // localStorage에 저장될 때 사용할 키 이름
      name: "auth-store",
      // JSON 형태로 localStorage에 저장하도록 설정
      // createJSONStorage는 객체를 JSON 문자열로 변환하여 저장하고, 읽을 때는 다시 객체로 변환해줌
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuthStore;
