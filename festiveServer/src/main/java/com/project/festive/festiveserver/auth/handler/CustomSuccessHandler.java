package com.project.festive.festiveserver.auth.handler;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

import org.springframework.core.env.Environment;
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
  private final AuthService authService;
  private final Environment environment;

  public CustomSuccessHandler(JwtUtil jwtUtil, AuthService authService, Environment environment) {
    this.jwtUtil = jwtUtil;
    this.authService = authService;
    this.environment = environment;
  }

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
      Authentication authentication) throws IOException, ServletException {

    // 핵심 상황만 로그 남김
    log.info("OAuth2 로그인 성공 처리");
    try {
      CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
      String role = authentication.getAuthorities().iterator().next().getAuthority();
      String accessToken = jwtUtil.generateAccessToken(customUserDetails.getMemberNo(), customUserDetails.getEmail(), role, customUserDetails.getSocialId());
      String refreshToken = jwtUtil.generateRefreshToken(customUserDetails.getMemberNo(), customUserDetails.getEmail(), role, customUserDetails.getSocialId());
      
      // 토큰 발급 성공 로그
      log.info("JWT 토큰 발급 완료");
      ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", accessToken)
          .httpOnly(true)
          .secure(true)
          .sameSite("Lax")
          .maxAge(Duration.ofMinutes(30))
          .path("/")
          .build();

      ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
          .httpOnly(true)
          .secure(true)
          .sameSite("Lax")
          .maxAge(Duration.ofDays(7))
          .path("/auth")
          .build();

      response.addHeader(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());
      response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());

      Date expirationDate = jwtUtil.getExpirationDate(refreshToken);
      LocalDateTime localExpirationDate = expirationDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
      
      authService.saveRefreshToken(customUserDetails.getMemberNo(), refreshToken, localExpirationDate);
      
      // 환경에 따라 다른 리다이렉트 URL 사용 - Environment 빈 사용
      String[] activeProfiles = environment.getActiveProfiles();
      String redirectUrl = (activeProfiles.length > 0 && "prod".equals(activeProfiles[0])) 
          ? "https://festivekorea.site/" 
          : "https://festivekorea.site/";
      
      log.info("OAuth2 성공 리다이렉트 URL: {}", redirectUrl);
      getRedirectStrategy().sendRedirect(request, response, redirectUrl);

    } catch (Exception e) {
      log.error("OAuth2 로그인 성공 처리 중 오류 발생: {}", e.getMessage(), e);
      
      if (!response.isCommitted()) {
        // 환경에 따라 다른 에러 리다이렉트 URL 사용 - Environment 빈 사용
        String[] activeProfiles = environment.getActiveProfiles();
        String errorRedirectUrl = (activeProfiles.length > 0 && "prod".equals(activeProfiles[0])) 
            ? "https://festivekorea.site/signin?error=oauth_failed" 
            : "https://festivekorea.site/signin?error=oauth_failed";
        
        log.info("OAuth2 에러 리다이렉트 URL: {}", errorRedirectUrl);
        getRedirectStrategy().sendRedirect(request, response, errorRedirectUrl);
      }
    }
  }
}
