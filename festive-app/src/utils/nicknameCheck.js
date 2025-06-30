import axiosApi from "../api/axiosAPI";

/**
 * 소셜 계정 사용자의 닉네임 체크 유틸리티
 */

/**
 * 닉네임 체크 API를 호출하여 소셜 계정 사용자의 닉네임 설정 여부를 확인합니다.
 * @param {Function} navigate - React Router의 navigate 함수
 * @returns {Promise<boolean>} - 닉네임이 설정되어 있거나 일반 계정 사용자인 경우 true, 그렇지 않으면 false
 */
export const checkNicknameForSocialUser = async (navigate) => {
  try {
    const response = await axiosApi.get("/member/check-nickname");

    if (response.status === 200) {
      const data = response.data;
      
      if (!data.success) {
        // 소셜 계정 사용자이고 닉네임이 없는 경우
        if (data.isSocialUser && !data.hasNickname) {
          alert("닉네임을 먼저 설정해주세요.");
          navigate("/mypage/profile");
          return false;
        }
      }
      return true;
    }
    return true; // API 호출 실패 시 기본적으로 통과
  } catch (error) {
    console.error("닉네임 체크 실패:", error);
    return true; // 에러 발생 시 기본적으로 통과
  }
}; 