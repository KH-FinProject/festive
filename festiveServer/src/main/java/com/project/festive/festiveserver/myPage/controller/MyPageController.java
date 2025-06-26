package com.project.festive.festiveserver.myPage.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttributes;

import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.myPage.model.service.MyPageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController // 비동기 컨트롤러
@CrossOrigin(origins="http://localhost:5173" /*, allowCredentials = "true"*/ )
// , allowCredentials = "true" 클라이언트로부터 들어오는 쿠키 허용
@RequestMapping("mypage")
@Slf4j
//@RequiredArgsConstructor
@SessionAttributes({"loginMember"})
public class MyPageController {
	
//	private final MyPageService service;


}
