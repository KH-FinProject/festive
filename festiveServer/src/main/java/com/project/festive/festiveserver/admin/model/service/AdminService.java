package com.project.festive.festiveserver.admin.model.service;

import com.project.festive.festiveserver.member.entity.Member;

public interface AdminService {

	// 관리자 이메일 중복 여부 검사
	int checkEmail(String memberEmail);

	// 관리자 계정 발급
	String createAdminAccount(Member member);

}
