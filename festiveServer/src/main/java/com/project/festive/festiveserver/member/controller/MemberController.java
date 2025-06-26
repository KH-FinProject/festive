package com.project.festive.festiveserver.member.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.member.entity.Member;
import com.project.festive.festiveserver.member.converter.MemberConverter;
import com.project.festive.festiveserver.member.service.MemberService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/member")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    
    // 단일 쿼리스트링 엔드포인트: /member/exists?type=id&value=xxx
    @GetMapping("/exists")
    public ResponseEntity<Map<String, Object>> checkExists(@RequestParam("type") String type, @RequestParam("value") String value) {
        Map<String, Object> response = new HashMap<>();
        boolean isAvailable = false;
        String code = null;
        
        try {
            switch (type) {
                case "id":
                    if (value == null || value.trim().isEmpty()) {
                        code = "TOO_SHORT";
                        break;
                    }
                    if (value.length() < 4 || value.length() > 20) {
                        code = "TOO_SHORT";
                        break;
                    }
                    if (!value.matches("^[a-zA-Z0-9]+$")) {
                        code = "INVALID_FORMAT";
                        break;
                    }
                    isAvailable = memberService.isIdAvailable(value);
                    if (!isAvailable) code = "DUPLICATE";
                    break;
                    
                case "nickname":
                    if (value == null || value.trim().isEmpty()) {
                        code = "TOO_SHORT";
                        break;
                    }
                    if (value.length() < 2 || value.length() > 15) {
                        code = "TOO_SHORT";
                        break;
                    }
                    if (!value.matches("^[ㄱ-힣a-zA-Z0-9]+$")) {
                        code = "INVALID_FORMAT";
                        break;
                    }
                    isAvailable = memberService.isNicknameAvailable(value);
                    if (!isAvailable) code = "DUPLICATE";
                    break;
                    
                case "email":
                    if (value == null || value.trim().isEmpty()) {
                        code = "INVALID_FORMAT";
                        break;
                    }
                    String emailRegex = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
                    if (!value.matches(emailRegex)) {
                        code = "INVALID_FORMAT";
                        break;
                    }
                    isAvailable = memberService.isEmailAvailable(value);
                    if (!isAvailable) code = "DUPLICATE";
                    break;
                    
                default:
                    response.put("available", false);
                    response.put("code", "UNSUPPORTED_TYPE");
                    return ResponseEntity.badRequest().body(response);
            }
            response.put("available", isAvailable);
            response.put("code", code);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("available", false);
            response.put("code", "SERVER_ERROR");
            
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("signup")
    public int signup(@RequestBody Member member) {
        try {
            memberService.signup(member);
            return 1;

        } catch (Exception e) {
            log.error("회원가입 중 오류 발생: {}", e.getMessage(), e);
            return 0;
        }
    }
} 