package com.project.festive.festiveserver.member.service;

public interface MemberService {
    
    /**
     * 아이디 사용 가능 여부 확인
     * @param id 확인할 아이디
     * @return 사용 가능하면 true, 중복이면 false
     */
    boolean isIdAvailable(String id);
    
    /**
     * 닉네임 사용 가능 여부 확인
     * @param nickname 확인할 닉네임
     * @return 사용 가능하면 true, 중복이면 false
     */
    boolean isNicknameAvailable(String nickname);
    
    /**
     * 이메일 사용 가능 여부 확인
     * @param email 확인할 이메일
     * @return 사용 가능하면 true, 중복이면 false
     */
    boolean isEmailAvailable(String email);
} 