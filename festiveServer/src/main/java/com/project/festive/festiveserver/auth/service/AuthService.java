package com.project.festive.festiveserver.auth.service;

import java.time.LocalDateTime;
import java.util.Map;

import com.project.festive.festiveserver.auth.dto.LoginRequest;
import com.project.festive.festiveserver.member.entity.Member;

public interface AuthService {
	Map<String, Object> login(LoginRequest request);

	Member findMemberByEmail(String userEmail);

	String findRefreshToken(Long memberNo);

	LocalDateTime findRefreshTokenExpiration(Long memberNo);

	void logout(Long memberNo);

	int updatePasswordByMemberNo(Long memberNo, String string);
}
