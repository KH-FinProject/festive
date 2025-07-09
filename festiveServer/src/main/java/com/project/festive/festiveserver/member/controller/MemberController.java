package com.project.festive.festiveserver.member.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.festive.festiveserver.auth.dto.CustomUserDetails;
import com.project.festive.festiveserver.member.entity.Member;
import com.project.festive.festiveserver.member.service.MemberService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/member")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    
    /**
     * 소셜 계정 사용자의 닉네임 체크 (DB에서 최신 정보 조회, memberNo만 사용)
     */
    @GetMapping("/check-nickname")
    public ResponseEntity<Map<String, Object>> checkNicknameForSocialUser(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authentication == null || authentication.getPrincipal() == null) {
                response.put("success", false);
                response.put("message", "인증 정보가 없습니다.");
                return ResponseEntity.status(401).body(response);
            }
            
            Object principal = authentication.getPrincipal();
            
            if (!(principal instanceof CustomUserDetails)) {
                response.put("success", false);
                response.put("message", "유효하지 않은 인증 정보입니다.");
                return ResponseEntity.status(401).body(response);
            }
            
            CustomUserDetails userDetails = (CustomUserDetails) principal;
            // DB에서 최신 Member 정보 조회 (memberNo만 사용)
            Member member = null;
            if (userDetails.getMemberNo() != null) {
                member = memberService.findByMemberNo(userDetails.getMemberNo());
            }
            if (member == null) {
                response.put("success", false);
                response.put("message", "회원 정보를 찾을 수 없습니다.");
                return ResponseEntity.status(404).body(response);
            }
            // 소셜 계정 사용자인지 확인 (socialId가 있으면 소셜 계정)
            if (member.getSocialId() != null && !member.getSocialId().isEmpty()) {
                String nickname = member.getNickname();

                if (nickname == null || nickname.trim().isEmpty()) {
                    response.put("success", false);
                    response.put("message", "닉네임을 먼저 설정해주세요.");
                    response.put("error", "NICKNAME_REQUIRED");
                    response.put("redirect", "/mypage/profile");
                    response.put("isSocialUser", true);
                    response.put("hasNickname", false);
                    
                    return ResponseEntity.ok(response);

                } else {
                    response.put("success", true);
                    response.put("message", "닉네임이 설정되어 있습니다.");
                    response.put("isSocialUser", true);
                    response.put("hasNickname", true);
                    response.put("nickname", nickname);
                    
                    return ResponseEntity.ok(response);
                }
            } else {
                // 일반 계정 사용자
                response.put("success", true);
                response.put("message", "일반 계정 사용자입니다.");
                response.put("isSocialUser", false);
                response.put("hasNickname", true);
                
                return ResponseEntity.ok(response);
            }
            
        } catch (Exception e) {
            log.error("닉네임 체크 중 오류 발생", e);
            response.put("success", false);
            response.put("message", "서버 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
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
                        code = "TOO_SHORT";
                        break;
                    }
                    if (!value.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                        code = "INVALID_FORMAT";
                        break;
                    }
                    isAvailable = memberService.isEmailAvailable(value);
                    if (!isAvailable) code = "DUPLICATE";
                    break;
                    
                default:
                    code = "INVALID_TYPE";
                    break;
            }
            
            response.put("success", true);
            response.put("available", isAvailable);
            if (code != null) {
                response.put("code", code);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("중복 체크 중 오류 발생: type={}, value={}", type, value, e);
            response.put("success", false);
            response.put("message", "서버 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @PostMapping("/signup")
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