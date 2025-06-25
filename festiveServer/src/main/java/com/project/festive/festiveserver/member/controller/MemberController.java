package com.project.festive.festiveserver.member.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.project.festive.festiveserver.member.service.MemberService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

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
} 