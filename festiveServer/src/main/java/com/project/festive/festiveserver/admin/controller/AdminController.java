package com.project.festive.festiveserver.admin.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;

import com.project.festive.festiveserver.admin.model.service.AdminService;
import com.project.festive.festiveserver.member.dto.MemberDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController // 비동기 컨트롤러
@RequestMapping("admin")
@Slf4j
@RequiredArgsConstructor
@SessionAttributes({"loginMember"})
public class AdminController {
	
	private final AdminService service;
	
	
	/** 관리자 계정 발급 메서드
	 * @param member
	 * @return
	 */
	@PostMapping("create")
	public ResponseEntity<String> createAdminAccount(@RequestBody MemberDto member) {
		try {
			// 1. 기존에 있는 이메일인지 검사
			int checkEmail = service.checkEmail(member.getEmail());
			// 2. 있으면 발급 안함
			if(checkEmail > 0) {
				
				// HttpStatus.CONFLICT (409) : 요청이 서버의 현재 상태와 충돌할 때 사용
				// == 이미 존재하는 리소스(email) 때문에 새로운 리소스를 만들 수 없다.
				return ResponseEntity.status(HttpStatus.CONFLICT)
						.body("이미 사용 중인 이메일입니다.");
			}
			
			// 3. 없으면 새로 발급
			String accountPw = service.createAdminAccount(member);
			// HttpStatus.OK (200) : 요청이 정상적으로 처리되었으나 기존 리소스에 대한 단순 처리
			// HttpStatus.CREATED (201) : 자원이 성공적으로 생성되었음을 나타냄
			return ResponseEntity.status(HttpStatus.CREATED).body(accountPw);
			
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR) // 500
					.body("관리자 계정 생성 중 문제 발생(서버 문의 바람)");
		}
		
	}
}
