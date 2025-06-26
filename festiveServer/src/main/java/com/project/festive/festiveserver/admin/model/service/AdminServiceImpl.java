package com.project.festive.festiveserver.admin.model.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.festive.festiveserver.admin.model.mapper.AdminMapper;
import com.project.festive.festiveserver.member.dto.MemberDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService{
	
	private final AdminMapper mapper;
	private final BCryptPasswordEncoder bcrypt;

	
	// 관리자 이메일 중복 검사
	@Override
	public int checkEmail(String email) {
		log.info("디질래? 서비스단 도착");
		return mapper.checkEmail(email);
	}

	// 관리자 이메일 발급
	@Override
	public String createAdminAccount(MemberDto member) {
	    // 1. 영어(대소문자) 6자리 난수로 만든 비밀번호를 암호화한 값 구하기
	    String rawPw = generateRandomPassword(4); // 평문 비번

	    // 2. 평문 비밀번호를 암호화하여 저장
	    String encPw = bcrypt.encode(rawPw);

	    // 3. member에 암호화된 비밀번호 세팅
	    member.setPassword(encPw);

	    // 4. DB에 암호화된 비밀번호가 세팅된 member를 전달하여 계정 발급
	    int result = mapper.createAdminAccount(member);

	    // 5. 계정 발급 정상처리 되었다면, 발급된(평문) 비밀번호 리턴
	    return result > 0 ? rawPw : null;
	}

	/**
	 * 대소문자 영어 6자리 난수 비밀번호 생성
	 */
	private String generateRandomPassword(int length) {
	    String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	    StringBuilder password = new StringBuilder(length);
	    for (int i = 0; i < length; i++) {
	        int index = (int) (Math.random() * characters.length());
	        password.append(characters.charAt(index));
	    }
	    return password.toString();
	}



}
