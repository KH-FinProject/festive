package com.project.festive.festiveserver.auth.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;

import com.project.festive.festiveserver.auth.dto.AuthKeyRequest;
import com.project.festive.festiveserver.auth.dto.LoginRequest;
import com.project.festive.festiveserver.auth.dto.FindAuthKeyRequest;
import com.project.festive.festiveserver.auth.service.AuthService;
import com.project.festive.festiveserver.common.util.JwtUtil;
import com.project.festive.festiveserver.member.entity.Member;
import com.project.festive.festiveserver.member.service.MemberService;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("auth")
@RequiredArgsConstructor
public class AuthController {

    // 의존성 주입(DI)
    private final AuthService authService;
    private final MemberService memberService;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder bcrypt;

    @GetMapping("userInfo")
    public ResponseEntity<?> userInfo(HttpServletRequest request) {
        log.info("userInfo API 호출");

        try {
            Cookie cookie = WebUtils.getCookie(request, "accessToken");
            String accessToken = cookie != null ? cookie.getValue() : null;

            Long memberNo = null;
            String email = null;
            String socialId = null;

            if (accessToken != null) {
                boolean isTokenValid = jwtUtil.isValidToken(accessToken);

                if (isTokenValid) {
                    memberNo = jwtUtil.getMemberNo(accessToken);
                    email = jwtUtil.getEmail(accessToken);
                    socialId = jwtUtil.getSocialId(accessToken);

                    Member member = authService.findMember(memberNo);
                    if (member == null) {
                        log.warn("회원을 찾을 수 없습니다. memberNo: {}", memberNo);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("회원을 찾을 수 없습니다.");
                    }

                    return ResponseEntity.ok(createUserInfoResponse(member));
                }
            }

            Cookie refreshCookie = WebUtils.getCookie(request, "refreshToken");
            if (refreshCookie == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }

            String refreshToken = refreshCookie.getValue();
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }

            if (!jwtUtil.isValidToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }

            memberNo = jwtUtil.getMemberNo(refreshToken);
            email = jwtUtil.getEmail(refreshToken);
            socialId = jwtUtil.getSocialId(refreshToken);

            String savedRefreshToken = authService.findRefreshToken(memberNo);
            if (!refreshToken.equals(savedRefreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }

            LocalDateTime expirationDate = authService.findRefreshTokenExpiration(memberNo);
            if (expirationDate.isBefore(LocalDateTime.now())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }

            Member member = authService.findMember(memberNo);
            if (member == null) {
                log.warn("회원을 찾을 수 없습니다. memberNo: {}", memberNo);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("회원을 찾을 수 없습니다.");
            }

            String newAccessToken = jwtUtil.generateAccessToken(memberNo, email, member.getRole(), member.getSocialId());
            ResponseCookie newAccessTokenCookie = ResponseCookie.from("accessToken", newAccessToken)
                    .httpOnly(true)
                    .maxAge(30 * 60)
                    .path("/auth/refresh")
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, newAccessTokenCookie.toString())
                    .body(createUserInfoResponse(member));

        } catch (Exception e) {
            log.error("userInfo 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("회원 정보 조회 중 오류가 발생했습니다.");
        }
    }
    
    /**
     * 회원 정보를 응답 형식에 맞게 변환하는 헬퍼 메서드
     */
    private Map<String, Object> createUserInfoResponse(Member member) {
        
        Map<String, Object> map = new HashMap<>();

        map.put("memberNo", member.getMemberNo());
        map.put("email", member.getEmail());
        map.put("name", member.getName());
        map.put("nickname", member.getNickname());
        map.put("role", member.getRole());
        map.put("profileImage", member.getProfileImage());
        map.put("socialId", member.getSocialId());
        
        return map;
    }

    @PostMapping("login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        log.info("login API 호출");

        Map<String, Object> result = authService.login(request);

        if (!(Boolean) result.get("success")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result.get("message"));
        }

        try {
            ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", (String)result.get("accessToken"))
                    .httpOnly(true)
                    .maxAge(30 * 60)
                    .path("/")
                    .sameSite("Lax")
                    .secure(false)
                    .build();

            ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", (String)result.get("refreshToken"))
                    .httpOnly(true)
                    .maxAge(7 * 24 * 60 * 60)
                    .path("/auth/refresh")
                    .sameSite("Lax")
                    .secure(false)
                    .build();

            ResponseEntity<Object> response = ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                    .body(result.get("loginResponse"));

            return response;

        } catch (Exception e) {
            log.error("로그인 처리 중 오류 발생", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "로그인 처리 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        Cookie refreshTokenCookie = WebUtils.getCookie(request, "refreshToken");
        Long memberNo = null;

        if (refreshTokenCookie != null) {
            String refreshToken = refreshTokenCookie.getValue();
            memberNo = jwtUtil.getMemberNo(refreshToken);
            authService.logout(memberNo);
        }

        ResponseCookie expiredAccessToken = ResponseCookie.from("accessToken", "")
            .httpOnly(true).path("/").maxAge(0)
            .sameSite("Lax").secure(false).build();
        ResponseCookie expiredRefreshToken = ResponseCookie.from("refreshToken", "")
            .httpOnly(true).path("/").maxAge(0)
            .sameSite("Lax").secure(false).build();
        ResponseCookie expiredRefreshTokenAlt = ResponseCookie.from("refreshToken", "")
            .httpOnly(true).path("/auth/refresh").maxAge(0)
            .sameSite("Lax").secure(false).build();

        log.info("로그아웃 처리 완료 - memberNo: {}", memberNo);

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, expiredAccessToken.toString())
            .header(HttpHeaders.SET_COOKIE, expiredRefreshToken.toString())
            .header(HttpHeaders.SET_COOKIE, expiredRefreshTokenAlt.toString())
            .body(Map.of("success", true, "message", "로그아웃 완료"));
    }
    
    @PostMapping("refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        log.info("refresh API 호출");

        Map<String, Object> responseBody = new HashMap<>();

        Cookie cookie = WebUtils.getCookie(request, "refreshToken");
        if (cookie == null) {
            responseBody.put("success", false);
            responseBody.put("message", "쿠키 없음");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        }

        String refreshToken = cookie.getValue();
        if (refreshToken == null) {
            responseBody.put("success", false);
            responseBody.put("message", "isEmpty");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        }

        if (!jwtUtil.isValidToken(refreshToken)) {
            responseBody.put("success", false);
            responseBody.put("message", "expired");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        }

        String userEmail = jwtUtil.getEmail(refreshToken);
        Long memberNo = jwtUtil.getMemberNo(refreshToken);
        Member member = authService.findMember(memberNo);

        if (member == null) {
            responseBody.put("success", false);
            responseBody.put("message", "nobody");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(responseBody);
        }

        String savedToken = authService.findRefreshToken(memberNo);
        if (!refreshToken.equals(savedToken)) {
            responseBody.put("success", false);
            responseBody.put("message", "invalid");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        }

        LocalDateTime expirationDate = authService.findRefreshTokenExpiration(memberNo);
        if (expirationDate.isBefore(LocalDateTime.now())) {
            responseBody.put("success", false);
            responseBody.put("message", "expired");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        }

        String newAccessToken = jwtUtil.generateAccessToken(memberNo, userEmail, member.getRole(), member.getSocialId());
        responseBody.put("success", true);
        responseBody.put("message", "success");

        ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", newAccessToken)
        .httpOnly(true)
        .maxAge(30 * 60)
        .path("/")
        .sameSite("Lax")
        .secure(false)
        .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .body(responseBody);
    }

    @PostMapping("findId")
    public ResponseEntity<Map<String, Object>> findId(@RequestBody Map<String, String> payload) {
        Map<String, Object> responseBody = new HashMap<>();
        
        // 전화번호, 이메일 중 하나를 선택하여 인증번호 발송
        String authMethod = payload.get("authMethod");

        if(authMethod == null) {
            responseBody.put("success", false);
            responseBody.put("message", "전화번호 또는 이메일을 선택해주세요.");
            return ResponseEntity.badRequest().body(responseBody);
        }

        String name = payload.get("name");
        String value = payload.get(authMethod);

        if(name == null) {
            responseBody.put("success", false);
            responseBody.put("message", "이름을 입력해주세요.");
            return ResponseEntity.badRequest().body(responseBody);
        }

        if(value == null) {
            responseBody.put("success", false);
            responseBody.put("message", "이메일 또는 전화번호를 입력해주세요.");
            return ResponseEntity.badRequest().body(responseBody);
        }
        
        Member member = null;
        
        try {
            switch(authMethod) {
                case "email":
                    member = memberService.findMemberByNameAndEmail(name, value);

                    if(member != null) {
                        String message = authService.sendEmail("findId", value);
    
                        responseBody.put("success", true);
                        responseBody.put("message", message);
                        return ResponseEntity.ok(responseBody);
    
                    } else {
                        responseBody.put("success", false);
                        responseBody.put("message", "일치하는 회원이 없습니다.");
                        return ResponseEntity.badRequest().body(responseBody);
                    }

                case "tel":
                    member = memberService.findMemberByNameAndTel(name, value);

                    if(member != null) {
                        String message = authService.sendSms(value);

                        responseBody.put("success", true);
                        responseBody.put("message", message);
                        return ResponseEntity.ok(responseBody);

                    } else {
                        responseBody.put("success", false);
                        responseBody.put("message", "일치하는 회원이 없습니다.");
                        return ResponseEntity.badRequest().body(responseBody);
                    }
            }

        } catch (Exception e) {
            log.error("인증번호 발송 오류: {}", e.getMessage(), e);
            responseBody.put("success", false);
            responseBody.put("message", "인증번호 발송 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseBody);
        }

        responseBody.put("success", false);
        responseBody.put("message", "인증번호 발송 실패");
        return ResponseEntity.badRequest().body(responseBody);
    }

    @PostMapping("findId/result")
    public ResponseEntity<Map<String, Object>> findIdResult(@RequestBody Map<String, String> payload) {
        Map<String, Object> responseBody = new HashMap<>();

        String name = payload.get("name");
        String email = payload.get("email");
        String tel = payload.get("tel");
        String authKey = payload.get("authKey");
        String authMethod = payload.get("authMethod");

        if (name == null || (email == null && tel == null) || authKey == null || authMethod == null) {
            responseBody.put("success", false);
            responseBody.put("message", "필수 정보를 모두 입력해주세요.");
            return ResponseEntity.badRequest().body(responseBody);
        }

        Map<String, Object> result = null;
        if ("email".equals(authMethod)) {
            result = authService.findIdSocialByEmail(name, email, authKey);
        } else if ("tel".equals(authMethod)) {
            result = authService.findIdSocialByTel(name, tel, authKey);
        }
        String userId = result != null ? (String) result.get("ID") : null;
        String socialId = result != null ? (String) result.get("SOCIAL_ID") : null;
        log.debug("userId: {}", userId);

        if (userId == null) {
            // 소셜 회원 여부 확인
            if (socialId != null) {
                responseBody.put("success", false);
                responseBody.put("message", "소셜 회원은 소셜 로그인으로만 이용 가능합니다.");
                return ResponseEntity.ok(responseBody);
            }
            responseBody.put("success", false);
            responseBody.put("message", "일치하는 회원이 없습니다.");
            return ResponseEntity.ok(responseBody);
        }

        responseBody.put("success", true);
        responseBody.put("userId", userId);
        return ResponseEntity.ok(responseBody);
    }

    @PostMapping("findPw")
    public ResponseEntity<Map<String, Object>> findPw(@RequestBody Map<String, String> payload) {
        Map<String, Object> responseBody = new HashMap<>();

        String id = payload.get("id");
        String email = payload.get("email");
        String tel = payload.get("tel");
        String authMethod = payload.get("authMethod");

        if (id == null) {
            responseBody.put("success", false);
            responseBody.put("message", "아이디를 입력해주세요.");
            return ResponseEntity.badRequest().body(responseBody);
        }

        if ("email".equals(authMethod)) {
            if (email == null) {
                responseBody.put("success", false);
                responseBody.put("message", "이메일을 입력해주세요.");
                return ResponseEntity.badRequest().body(responseBody);
            }
            // 이메일 인증 로직
            try {
                String message = authService.sendEmail("findPw", email);
                responseBody.put("success", true);
                responseBody.put("message", message);
                return ResponseEntity.ok(responseBody);
            } catch (Exception e) {
                log.error("비밀번호 찾기 인증번호 발송 오류: {}", e.getMessage(), e);
                responseBody.put("success", false);
                responseBody.put("message", "인증번호 발송 오류가 발생했습니다.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseBody);
            }

        } else if ("tel".equals(authMethod)) {
            if (tel == null) {
                responseBody.put("success", false);
                responseBody.put("message", "전화번호를 입력해주세요.");
                return ResponseEntity.badRequest().body(responseBody);
            }
            // 전화번호 인증 로직
            try {
                String message = authService.sendSms(tel);
                responseBody.put("success", true);
                responseBody.put("message", message);
                return ResponseEntity.ok(responseBody);
            } catch (Exception e) {
                log.error("비밀번호 찾기 인증번호 발송 오류: {}", e.getMessage(), e);
                responseBody.put("success", false);
                responseBody.put("message", "인증번호 발송 오류가 발생했습니다.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseBody);
            }
            
        } else {
            responseBody.put("success", false);
            responseBody.put("message", "인증 방식을 선택해주세요.");
            return ResponseEntity.badRequest().body(responseBody);
        }
    }

    @PostMapping("findPw/result")
    public ResponseEntity<Map<String, Object>> findPwResult(@RequestBody Map<String, String> payload) {
        Map<String, Object> responseBody = new HashMap<>();

        String id = payload.get("id");
        String email = payload.get("email");
        String tel = payload.get("tel");
        String authKey = payload.get("authKey");
        String authMethod = payload.get("authMethod");

        if (id == null || (email == null && tel == null) || authKey == null || authMethod == null) {
            responseBody.put("success", false);
            responseBody.put("message", "필수 정보를 모두 입력해주세요.");
            return ResponseEntity.badRequest().body(responseBody);
        }

        int result = 0;
        if ("email".equals(authMethod)) {
            result = authService.findPwSocialByEmail(id, email, authKey);
        } else if ("tel".equals(authMethod)) {
            result = authService.findPwSocialByTel(id, tel, authKey);
        }

        if (result == 0) {
            responseBody.put("success", false);
            responseBody.put("message", "일치하는 회원이 없습니다.");
            return ResponseEntity.ok(responseBody);
        }

        responseBody.put("success", true);
        return ResponseEntity.ok(responseBody);
    }

    @PostMapping("findPw/reset")
    public ResponseEntity<Map<String, Object>> findPwReset(@RequestBody Map<String, String> payload) {
        Map<String, Object> responseBody = new HashMap<>();
        String userId = payload.get("userId");
        String newPassword = payload.get("newPassword");

        if (userId == null || newPassword == null) {
            responseBody.put("success", false);
            responseBody.put("message", "필수 정보를 모두 입력해주세요.");
            return ResponseEntity.badRequest().body(responseBody);
        }

        Member member = memberService.findMemberById(userId);
        if (member == null) {
            responseBody.put("success", false);
            responseBody.put("message", "일치하는 회원이 없습니다.");
            return ResponseEntity.badRequest().body(responseBody);
        }

        member.setPassword(bcrypt.encode(newPassword));
        memberService.updateMember(member);

        responseBody.put("success", true);
        responseBody.put("message", "비밀번호가 성공적으로 변경되었습니다.");
        return ResponseEntity.ok(responseBody);
    }
    
    @PostMapping("email")
    public ResponseEntity<Map<String, Object>> authEmail(@RequestBody AuthKeyRequest authKeyRequest) {
        Map<String, Object> responseBody = new HashMap<>();
        
        String message = authService.sendEmail("signup", authKeyRequest.getEmail());
        
        if(message != null) { // 인증번호 발급 성공 & 이메일 보내기 성공
            responseBody.put("success", true);
            responseBody.put("message", message);
            return ResponseEntity.ok(responseBody);
        }
        
        // 이메일 보내기 실패
        responseBody.put("success", false);
        responseBody.put("message", "이메일 전송에 실패했습니다.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseBody);
    }
    
    @PostMapping("sms")
    public ResponseEntity<Map<String, Object>> authSms(@RequestBody AuthKeyRequest authKeyRequest) {
        Map<String, Object> responseBody = new HashMap<>();
        String tel = authKeyRequest.getTel();

        // 전화번호 유효성 검사 (010, 011, 016, 017, 018, 019로 시작, 10~11자리)
        if (tel == null || !tel.matches("^01[016789][0-9]{7,8}$")) {
            responseBody.put("success", false);
            responseBody.put("message", "유효한 휴대폰 번호만 입력 가능합니다.");
            return ResponseEntity.badRequest().body(responseBody);
        }

        String message = authService.sendSms(tel);
        if(message != null) { // 인증번호 발급 성공 & SMS 보내기 성공
            responseBody.put("success", true);
            responseBody.put("message", message);
            return ResponseEntity.ok(responseBody);
        }

        // SMS 보내기 실패
        responseBody.put("success", false);
        responseBody.put("message", "SMS 전송에 실패했습니다.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseBody);
    }
    
    /** 입력받은 이메일, 인증번호가 DB에 있는지 조회
     * @param authKeyRequest (email, authKey)
     * @return ResponseEntity 인증 결과
     */
    @PostMapping("checkAuthKey")
    public ResponseEntity<Map<String, Object>> checkAuthKey(@RequestBody AuthKeyRequest authKeyRequest) {
        Map<String, Object> responseBody = new HashMap<>();
        int result = authService.checkAuthKey(authKeyRequest);
        if(result == 1) { // 인증 성공
            responseBody.put("success", true);
            responseBody.put("message", "인증번호가 확인되었습니다.");
            return ResponseEntity.ok(responseBody);

        } else if(result == 0) { // 인증키 없음(만료/미발급 등)
            responseBody.put("success", false);
            responseBody.put("message", "인증번호가 만료되었거나 올바르지 않습니다.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        
        } else { // 인증키 불일치
            responseBody.put("success", false);
            responseBody.put("message", "인증번호가 일치하지 않습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseBody);
        }
    }
    
    @PostMapping("findCheckAuthKey")
    public ResponseEntity<Map<String, Object>> findAuthKeyCheck(@RequestBody FindAuthKeyRequest findAuthKeyRequest) {
        Map<String, Object> responseBody = new HashMap<>();
        int result = authService.findCheckAuthKey(findAuthKeyRequest);
        if(result == 1) { // 인증 성공
            responseBody.put("success", true);
            responseBody.put("message", "인증번호가 확인되었습니다.");
            return ResponseEntity.ok(responseBody);

        } else if(result == 0) { // 인증키 없음(만료/미발급 등)
            responseBody.put("success", false);
            responseBody.put("message", "인증번호가 만료되었거나 올바르지 않습니다.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        
        } else { // 인증키 불일치
            responseBody.put("success", false);
            responseBody.put("message", "인증번호가 일치하지 않습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseBody);
        }
    }
    
    // 이메일 변경 인증번호 요청 및 이메일 중복 검사를 위해 지현이가 추가한 코드
    // 이메일 인증 번호 발송 요청 (수정: 중복 확인 로직 추가)
    @PostMapping("email/send")
    public ResponseEntity<Map<String, String>> sendEmailVerification(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "이메일 주소를 입력해주세요."));
        }
        
        // 이메일 중복 확인 추가
        if (authService.isEmailDuplicate(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 사용 중인 이메일입니다."));
        }

        try {
            String message = authService.sendEmail("signup", email);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (RuntimeException e) {
            log.error("이메일 발송 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }
    
    // 이메일 변경 인증번호 요청 및 이메일 중복 검사를 위해 지현이가 추가한 코드
    // 이메일 인증 번호 확인 요청
    @PostMapping("email/verify")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestBody AuthKeyRequest authKeyRequest) {
        String email = authKeyRequest.getEmail();
        String code = authKeyRequest.getAuthKey();
        
        if (email == null || email.isEmpty() || code == null || code.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "이메일과 인증번호를 모두 입력해주세요."));
        }
        
        int checkResult = authService.checkAuthKey(authKeyRequest);
        
        if (checkResult == 1) {
            return ResponseEntity.ok(Map.of("message", "이메일이 성공적으로 인증되었습니다."));
        } else if (checkResult == 0) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증번호가 만료되었거나 올바르지 않습니다."));
        } else { // checkResult == 2
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증번호가 일치하지 않습니다."));
        }
    }
}
