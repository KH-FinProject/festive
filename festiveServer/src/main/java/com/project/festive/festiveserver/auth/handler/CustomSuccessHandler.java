package com.project.festive.festiveserver.auth.handler;

import java.io.IOException;
import java.util.Collection;
import java.util.Iterator;

import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.project.festive.festiveserver.auth.dto.CustomOAuth2User;
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
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
    
    log.info("OAuth2 로그인 성공 처리 시작");
    
    try {
      CustomOAuth2User customOAuth2User = (CustomOAuth2User) authentication.getPrincipal();
      
      String socialId = customOAuth2User.getSocialId();
      log.info("사용자 정보: memberNo={}, email={}, socialId={}", 
               customOAuth2User.getMemberNo(), customOAuth2User.getEmail(), socialId);

      Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
      Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
      GrantedAuthority auth = iterator.next();
      String role = auth.getAuthority();

      String token = jwtUtil.generateAccessToken(customOAuth2User.getMemberNo(), customOAuth2User.getEmail(), role, socialId);
      String refreshToken = jwtUtil.generateRefreshToken(customOAuth2User.getMemberNo(), customOAuth2User.getEmail(), role, socialId);

    // Access Token 쿠키 설정
    ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", token)
                            .httpOnly(true)
                            //.secure(true)
                            //.sameSite("Strict")
                            .maxAge(3600)
                            .path("/")
                            .build();

    // Refresh Token 쿠키 설정
    ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
                            .httpOnly(true)
                            //.secure(true)
                            //.sameSite("Strict")
                            .maxAge(7 * 24 * 60 * 60) // 7일
                            .path("/")
                            .build();

      response.addHeader("Set-Cookie", accessTokenCookie.toString());
      response.addHeader("Set-Cookie", refreshTokenCookie.toString());
      
      log.info("쿠키 설정 완료");

      log.info("OAuth2 로그인 성공 처리 완료, 리다이렉트 시작");
      
      // 리다이렉트 (응답이 커밋되기 전에 실행)
      response.sendRedirect("http://localhost:5173/");
      
    } catch (Exception e) {
      log.error("OAuth2 로그인 성공 처리 중 오류 발생", e);
      if (!response.isCommitted()) {
        response.sendRedirect("http://localhost:5173/login?error=oauth_failed");
      }
    }
  }
}
