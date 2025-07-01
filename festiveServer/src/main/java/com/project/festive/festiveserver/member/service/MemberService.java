package com.project.festive.festiveserver.member.service;

import com.project.festive.festiveserver.member.entity.Member;

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
    
    int signup(Member member);

    Member findByMemberNo(Long memberNo);

    /**
     * 이름과 이메일로 회원 조회
     * @param name 회원 이름
     * @param email 회원 이메일
     * @return 회원 정보
     */
	Member findMemberByNameAndEmail(String name, String email);
	
    /**
     * 이름과 전화번호로 회원 조회
     * @param name 회원 이름
     * @param tel 회원 전화번호
     * @return 회원 정보
     */
	Member findMemberByNameAndTel(String name, String tel);

	/**
	 * 아이디와 이메일로 회원 조회
	 */
	Member findMemberByIdAndEmail(String id, String email);
}  