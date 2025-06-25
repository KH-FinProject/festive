package com.project.festive.festiveserver.auth.controller;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;

import com.project.festive.festiveserver.auth.dto.LoginRequest;
import com.project.festive.festiveserver.auth.dto.LoginResponse;
import com.project.festive.festiveserver.auth.service.AuthService;
import com.project.festive.festiveserver.member.entity.Member;
import com.project.festive.festiveserver.common.util.JwtUtil;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("auth")
@RequiredArgsConstructor
//@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
// -> 이미 WebConfig에서 전역적으로 처리해주고 있기 때문에 작성해주지 않아도 됨
public class AuthController {

    // 의존성 주입(DI)
    private final AuthService authService;
    private final JwtUtil jwtUtil;
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        // JSON 형식으로 비동기 요청을 하기 때문에, @ModelAttribute가 아닌, @RequestBody 활용
        // id, password (LoginRequest) -> accessToken, nickname (LoginResponse)
        
        // 1. 로그인 처리 및 토큰 생성 (서비스에서 Access + Refresh 생성 및 DB 저장)
        Map<String, Object> map = authService.login(request);
        LoginResponse loginResponse = (LoginResponse) map.get("loginResponse");
        
        // 2. Refresh Token 쿠키로 전달(보안상 절대 Body에 보내면 안됨(XSS 공격에 취약)
        // ResponseCookie 활용
        // -> 빌더 패턴 + 체이닝 방식으로 가독성을 높힘
        // -> 쿠키 보안 옵션을 쉽게 설정할 수 있음
        ResponseCookie cookie = ResponseCookie.from("refreshToken", (String)map.get("refreshToken"))
                .httpOnly(true) // HttpOnly 쿠키 (JS에서 접근 불가 -> XSS에 안전)
                // .secure(true) HTTPS에서만 전송하도록 제한(개발모드에서 false 괜찮음, 배포모드 반드시 true)
                // .sameSite("Strict") 어떤 요청 상황에서 브라우저가 서버에 전송할지를 제한
                // Strict : 자기 사이트에서만 전송됨
                // Lax : 기본값. GET 방식 같은 일부 외부 요청엔 쿠키 전송 가능
                // None	: 모든 요청에 쿠키 전송, 단 Secure=true도 반드시 함께 설정해야 함 (특히 CORS 상황에서 사용)
                .path("/auth/refresh") // refresh 엔드포인트에서만 사용 (보안 강화)
                .maxAge(Duration.ofDays(7)) // 7일
                .build();
        
        // 3. Access Token은 본문으로 반환 (localStorage에 저장될 수 있도록)
        // 응답은 ResponseEntity 활용
        // -> HttpServletResponse 객체를 사용하지 않고,
        //    ResponseEntity 단일 객체로 모두(status, header, body) 관리 가능하기 때문
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(loginResponse);
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        
        Map<String, Object> responseBody = new HashMap<>();
        
        // 1. 쿠키에서 Refresh Token 추출
        Cookie cookie = WebUtils.getCookie(request, "refreshToken");
        
        if (cookie == null) {
            responseBody.put("success", false);
            responseBody.put("message", "쿠키 없음");
            return ResponseEntity.ok(responseBody);
        }
        // refreshToken이 쿠키에 있으면 꺼내오기
        String refreshToken = cookie.getValue();
        
        // refreshToken이 없다면
        if (refreshToken == null) {
            responseBody.put("success", false);
            responseBody.put("message", "isEmpty");
            return ResponseEntity.ok(responseBody);
        }
        
        // 2. 토큰 유효성 검사
        // 클라이언트가 보낸 토큰 자체를 검사하기 위해 작성
        if (!jwtUtil.isValidToken(refreshToken)) {
            responseBody.put("success", false);
            responseBody.put("message", "expired");
            return ResponseEntity.ok(responseBody);
        }
        
        // 3. 사용자 이메일 추출 및 사용자 번호 조회
        String userEmail = jwtUtil.getEmail(refreshToken);
        Member member = authService.findMemberByEmail(userEmail);
        
        // refreshToken에 해당하는 사용자 정보 없음
        if (member == null) {
            responseBody.put("success", false);
            responseBody.put("message", "nobody");
            return ResponseEntity.ok(responseBody);
        }
        long memberNo = member.getMemberNo();
        
        // 4. DB에 저장된 refreshToken과 요청 시 쿠키에 담겨온 refreshToken이 일치하는지 확인
        String savedToken = authService.findRefreshToken(memberNo);
        if (!refreshToken.equals(savedToken)) {
            responseBody.put("success", false);
            responseBody.put("message", "invalid");  // 저장된 토큰과 일치하지 않음
            return ResponseEntity.ok(responseBody);
        }
        
        // 5. DB에 저장된 RefreshToken 만료 여부 확인
        // - 클라이언트가 만료된 토큰을 일부러 수정하거나 변조해서 보내는 것을 막기 위해
        // - 또는 토큰이 탈취되어도 서버에서 수동 만료 처리하거나 기간을 단축할 수 있도록 하기 위해
        // -> 보안 목적에서 토큰 자체의 만료 + DB 만료시간을 이중 체크
        LocalDateTime expirationDate = authService.findRefreshTokenExpiration(memberNo);
        if (expirationDate.isBefore(LocalDateTime.now())) {
            responseBody.put("success", false);
            responseBody.put("message", "expired"); // 리프레시 토큰 만료
            return ResponseEntity.ok(responseBody);
        }
        
        // 6. 위 모든 경우가 아니라면 새로운 Access Token 발급
        String newAccessToken = jwtUtil.generateAccessToken(memberNo, userEmail, member.getRole(), member.getSocialId());
        
        // 7. 성공 응답
        responseBody.put("success", true);
        responseBody.put("accessToken", newAccessToken);
        return ResponseEntity.ok(responseBody);
    }
    
}
