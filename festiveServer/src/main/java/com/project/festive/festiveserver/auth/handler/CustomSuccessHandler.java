package com.project.festive.festiveserver.auth.handler;

import java.io.IOException;
import java.time.Duration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.project.festive.festiveserver.auth.dto.CustomUserDetails;
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
          // .secure(true)
          // .sameSite("Strict")
          .maxAge(Duration.ofMinutes(30))
          .path("/")
          .build();
          

      // Refresh Token 쿠키 설정
      ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
          .httpOnly(true)
          // .secure(true)
          // .sameSite("Strict")
          .maxAge(Duration.ofDays(7)) // 7일
          .path("/") // 모든 경로에서 사용 가능하도록 변경
          .build();

      response.addHeader(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());
      response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());

      log.info("토큰 쿠키 설정 완료");

      log.info("OAuth2 로그인 성공 처리 완료");
      
      // 프론트엔드 메인 페이지로 리다이렉트
      response.sendRedirect("http://localhost:5173/");

    } catch (Exception e) {
      log.error("OAuth2 로그인 성공 처리 중 오류 발생", e);

      if (!response.isCommitted()) {
        response.sendRedirect("http://localhost:5173/signin?error=oauth_failed");
      }
    }
  }
}
