package com.project.festive.festiveserver.auth.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

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
import com.project.festive.festiveserver.auth.service.AuthService;
import com.project.festive.festiveserver.common.util.JwtUtil;
import com.project.festive.festiveserver.member.entity.Member;

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

    @GetMapping("/userInfo")
    public ResponseEntity<Object> userInfo(HttpServletRequest request) {
        try {
            // 쿠키에서 accessToken 추출
            Cookie cookie = WebUtils.getCookie(request, "accessToken");
            String accessToken = cookie != null ? cookie.getValue() : null;
            
            // Authorization 헤더에서 Bearer 토큰 추출
            if (accessToken == null) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    accessToken = authHeader.substring(7);
                }
            }
            
            // accessToken이 없는 경우
            if (accessToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }
            
            // accessToken 유효성 검사 및 정보 추출
            if (!jwtUtil.isValidToken(accessToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("유효하지 않은 토큰입니다.");
            }

            Long memberNo = jwtUtil.getMemberNo(accessToken);
            Member member = authService.findMember(memberNo);

            if (member == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("회원을 찾을 수 없습니다.");
            }

            // 회원 정보 조회 결과를 필요한 정보만 담은 Map으로 변환
            Map<String, Object> map = new HashMap<>();
            map.put("memberNo", member.getMemberNo());
            map.put("email", member.getEmail());
            map.put("name", member.getName());
            map.put("nickname", member.getNickname());
            map.put("role", member.getRole());
            map.put("profileImage", member.getProfileImage());

            return ResponseEntity.ok(map);

        } catch (Exception e) {
            log.error("userInfo 조회 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("회원 정보 조회 중 오류가 발생했습니다.");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // JSON 형식으로 비동기 요청을 하기 때문에, @ModelAttribute가 아닌, @RequestBody 활용
        // id, password (LoginRequest) -> 기본적인 회원정보 + 토큰 (LoginResponse)
        
        // 1. 로그인 처리 및 토큰 생성 (서비스에서 Access + Refresh 생성 및 DB 저장)
        Map<String, Object> result = authService.login(request);
        
        // 2. 로그인 실패 시
        if (!(Boolean) result.get("success")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result.get("message"));
        }
        
        // 3. 로그인 성공 시
        try {
            // 쿠키로 전달(보안상 절대 Body에 보내면 안됨(XSS 공격에 취약)
            ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", (String)result.get("accessToken"))
                    .httpOnly(true)
                    // .secure(true)
                    // .sameSite("Strict")
                    .maxAge(30 * 60) // 30분
                    .path("/")
                    .build();

            ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", (String)result.get("refreshToken"))
                    .httpOnly(true) // HttpOnly 쿠키 (JS에서 접근 불가 -> XSS에 안전)
                    // .secure(true) HTTPS에서만 전송하도록 제한(개발모드에서 false 괜찮음, 배포모드 반드시 true)
                    // .sameSite("Strict") 어떤 요청 상황에서 브라우저가 서버에 전송할지를 제한
                    // Strict : 자기 사이트에서만 전송됨
                    // Lax : 기본값. GET 방식 같은 일부 외부 요청엔 쿠키 전송 가능
                    // None	: 모든 요청에 쿠키 전송, 단 Secure=true도 반드시 함께 설정해야 함 (특히 CORS 상황에서 사용)
                    .maxAge(7 * 24 * 60 * 60) // 7일
                    .path("/") // 모든 경로에서 사용 가능하도록 변경
                    .build();

            // 4. 응답 헤더에 쿠키 추가
            // accessToken & refreshToken 모두 httpOnly 쿠키로 전달
            ResponseEntity<Object> response = ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                    .body(result.get("loginResponse"));
            
            return response;
                    
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "로그인 처리 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        
        Map<String, Object> responseBody = new HashMap<>();
        
        // 1. 쿠키에서 Refresh Token 추출
        Cookie cookie = WebUtils.getCookie(request, "refreshToken");
        
        if (cookie == null) {
            responseBody.put("success", false);
            responseBody.put("message", "쿠키 없음");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        }
        // refreshToken이 쿠키에 있으면 꺼내오기
        String refreshToken = cookie.getValue();
        
        // refreshToken이 없다면
        if (refreshToken == null) {
            responseBody.put("success", false);
            responseBody.put("message", "isEmpty");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        }
        
        // 2. 토큰 유효성 검사
        // 클라이언트가 보낸 토큰 자체를 검사하기 위해 작성
        if (!jwtUtil.isValidToken(refreshToken)) {
            responseBody.put("success", false);
            responseBody.put("message", "expired");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        }
        
        // 3. 사용자 이메일 추출 및 사용자 번호 조회
        String userEmail = jwtUtil.getEmail(refreshToken);
        Long memberNo = jwtUtil.getMemberNo(refreshToken);
        Member member = authService.findMember(memberNo);
        
        // refreshToken에 해당하는 사용자 정보 없음
        if (member == null) {
            responseBody.put("success", false);
            responseBody.put("message", "nobody");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(responseBody);
        }
        
        // 4. DB에 저장된 refreshToken과 요청 시 쿠키에 담겨온 refreshToken이 일치하는지 확인
        String savedToken = authService.findRefreshToken(memberNo);
        if (!refreshToken.equals(savedToken)) {
            responseBody.put("success", false);
            responseBody.put("message", "invalid");  // 저장된 토큰과 일치하지 않음
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        }
        
        // 5. DB에 저장된 RefreshToken 만료 여부 확인
        // - 클라이언트가 만료된 토큰을 일부러 수정하거나 변조해서 보내는 것을 막기 위해
        // - 또는 토큰이 탈취되어도 서버에서 수동 만료 처리하거나 기간을 단축할 수 있도록 하기 위해
        // -> 보안 목적에서 토큰 자체의 만료 + DB 만료시간을 이중 체크
        LocalDateTime expirationDate = authService.findRefreshTokenExpiration(memberNo);
        if (expirationDate.isBefore(LocalDateTime.now())) {
            responseBody.put("success", false);
            responseBody.put("message", "expired"); // 리프레시 토큰 만료
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseBody);
        }
        
        // 6. 위 모든 경우가 아니라면 새로운 Access Token 발급
        String newAccessToken = jwtUtil.generateAccessToken(memberNo, userEmail, member.getRole());
        
        // 7. 성공 응답
        responseBody.put("success", true);
        responseBody.put("message", "success");

        ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", newAccessToken)
        .httpOnly(true)
        // .secure(true)
        // .sameSite("Strict")
        .maxAge(30 * 60) // 30분
        .path("/")
        .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .body(responseBody);
    }
    
    @PostMapping("email")
    public ResponseEntity<Map<String, Object>> authEmail(@RequestBody AuthKeyRequest authKeyRequest) {
        Map<String, Object> responseBody = new HashMap<>();
        
        String authKey = authService.sendEmail("signup", authKeyRequest.getEmail());
        
        if(authKey != null) { // 인증번호 발급 성공 & 이메일 보내기 성공
            responseBody.put("success", true);
            responseBody.put("message", "인증번호가 이메일로 전송되었습니다.");
            return ResponseEntity.ok(responseBody);
        }
        
        // 이메일 보내기 실패
        responseBody.put("success", false);
        responseBody.put("message", "이메일 전송에 실패했습니다.");
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
        
        if(result == 1) { // 이메일, 인증번호 일치
            responseBody.put("success", true);
            responseBody.put("message", "인증번호가 확인되었습니다.");
            return ResponseEntity.ok(responseBody);
        } else { // 인증번호 불일치
            responseBody.put("success", false);
            responseBody.put("message", "인증번호가 일치하지 않습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseBody);
        }
    }
}
