package com.project.festive.festiveserver.auth.handler;

import java.io.IOException;
import java.time.Duration;
import java.util.Collection;
import java.util.Iterator;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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

      Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
      Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
      GrantedAuthority auth = iterator.next();
      String role = auth.getAuthority();

      String accessToken = jwtUtil.generateAccessToken(customUserDetails.getMemberNo(), customUserDetails.getEmail(), role);
      String refreshToken = jwtUtil.generateRefreshToken(customUserDetails.getMemberNo(), customUserDetails.getEmail(), role);

      // Access Token을 쿼리 파라미터로 포함하여 프론트엔드로 리다이렉트
      String redirectUrl = String.format("http://localhost:5173/oauth-callback.html?accessToken=%s", accessToken);
      response.sendRedirect(redirectUrl);

      // Refresh Token 쿠키 설정
      ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
          .httpOnly(true)
          // .secure(true)
          // .sameSite("Strict")
          .maxAge(Duration.ofDays(7)) // 7일
          .path("/")
          .build();

      response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());

      log.info("토큰 설정 완료");

      log.info("OAuth2 로그인 성공 처리 완료");

    } catch (Exception e) {
      log.error("OAuth2 로그인 성공 처리 중 오류 발생", e);
      if (!response.isCommitted()) {
        response.sendRedirect("http://localhost:5173/login?error=oauth_failed");
      }
    }
  }
}
