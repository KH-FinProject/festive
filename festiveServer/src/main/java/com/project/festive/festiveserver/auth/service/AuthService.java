package com.project.festive.festiveserver.auth.service;

import java.time.LocalDateTime;
import java.util.Map;

import com.project.festive.festiveserver.auth.dto.AuthKeyRequest;
import com.project.festive.festiveserver.auth.dto.LoginRequest;
import com.project.festive.festiveserver.member.entity.Member;

public interface AuthService {
	Map<String, Object> login(LoginRequest request) throws RuntimeException;

	Member findMember(Long memberNo);

	String findRefreshToken(Long memberNo);

	Member findMemberByEmail(String email);

	LocalDateTime findRefreshTokenExpiration(Long memberNo);

	void logout(Long memberNo);

	int updatePasswordByMemberNo(Long memberNo, String string);
	
	/**
	 * 만료된 리프레시 토큰들을 삭제합니다.
	 * @return 삭제된 토큰의 개수
	 */
	int deleteExpiredRefreshTokens();
	
	/**
	 * 특정 회원의 리프레시 토큰이 유효한지 확인합니다.
	 * @param memberNo 회원 번호
	 * @return 토큰이 존재하고 만료되지 않았으면 true, 그렇지 않으면 false
	 */
	boolean isRefreshTokenValid(Long memberNo);
	
	String sendEmail(String signup, String email);

	int checkAuthKey(AuthKeyRequest authKeyRequest);
}
