package com.project.festive.festiveserver.admin.model.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.project.festive.festiveserver.member.entity.Member;

@Mapper
public interface AdminMapper {

	// 관리자 이메일 중복 검사
	int checkEmail(String memberEmail);

	// 관리자 계정 발급
	int createAdminAccount(Member member);

}
