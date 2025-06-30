package com.project.festive.festiveserver.auth.handler;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.project.festive.festiveserver.auth.dto.CustomUserDetails;
import com.project.festive.festiveserver.auth.service.AuthService;
import com.project.festive.festiveserver.common.util.JwtUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CustomSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

  private final JwtUtil jwtUtil;

  public CustomSuccessHandler(JwtUtil jwtUtil) {
    this.jwtUtil = jwtUtil;
  }

  // 순환 참조 방지를 위해 필드 주입 사용
  @Autowired
  private AuthService authService;

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
      Authentication authentication) throws IOException, ServletException {

    log.info("OAuth2 로그인 성공 처리 시작");

    try {
      CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
      
      // 사용자 권한 정보 추출
      String role = authentication.getAuthorities().iterator().next().getAuthority();

      String accessToken = jwtUtil.generateAccessToken(customUserDetails.getMemberNo(), customUserDetails.getEmail(), role, customUserDetails.getSocialId());
      String refreshToken = jwtUtil.generateRefreshToken(customUserDetails.getMemberNo(), customUserDetails.getEmail(), role, customUserDetails.getSocialId());

      log.info("JWT 토큰 생성 완료");

      // Access Token 쿠키 설정
      ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", accessToken)
          .httpOnly(true)
          .secure(false)
          .sameSite("Lax")
          .maxAge(Duration.ofMinutes(30))
          .path("/")
          .build();
          

      // Refresh Token 쿠키 설정
      ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
          .httpOnly(true)
          .secure(false)
          .sameSite("Lax")
          .maxAge(Duration.ofDays(7)) // 7일
          .path("/") // 모든 경로에서 사용 가능하도록 변경
          .build();

      log.info("AccessToken 쿠키 세팅 직전");
      response.addHeader(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());
      log.info("AccessToken 쿠키 세팅 완료");

      log.info("RefreshToken 쿠키 세팅 직전");
      response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
      log.info("RefreshToken 쿠키 세팅 완료");

      // refreshToken 만료일 계산
      Date expirationDate = jwtUtil.getExpirationDate(refreshToken);
      LocalDateTime localExpirationDate = expirationDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
      // DB에 refreshToken 저장
      authService.saveRefreshToken(customUserDetails.getMemberNo(), refreshToken, localExpirationDate);

      log.info("프론트엔드로 리다이렉트 직전");
      response.sendRedirect("http://localhost:5173/");
      log.info("프론트엔드로 리다이렉트 완료");

    } catch (Exception e) {
      log.error("OAuth2 로그인 성공 처리 중 오류 발생: {}", e.getMessage(), e);

      if (!response.isCommitted()) {
        response.sendRedirect("http://localhost:5173/signin?error=oauth_failed");
      }
    }
  }
}
