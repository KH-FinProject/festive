package com.project.festive.festiveserver.common.filter;

import java.io.IOException;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.WebUtils;

import com.project.festive.festiveserver.auth.dto.CustomUserDetails;
import com.project.festive.festiveserver.common.util.JwtUtil;
import com.project.festive.festiveserver.member.dto.MemberDto;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class JwtFilter extends OncePerRequestFilter {
  // 요청당 1번만 실행되는 필터

  private final JwtUtil jwtUtil;

  public JwtFilter(JwtUtil jwtUtil) {
    this.jwtUtil = jwtUtil;
  }

  @Override
  protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
    String requestURI = request.getRequestURI();
    String method = request.getMethod();
    
    log.info("JWT Filter 시작: {} {}", method, requestURI);
    
    try {
      // accessToken 추출 (쿠키 우선, 없으면 Authorization 헤더)
      Cookie cookie = WebUtils.getCookie(request, "accessToken");
      String accessToken = cookie != null ? cookie.getValue() : null;

      // Authorization 헤더에서 Bearer 토큰 추출
      if (accessToken == null) {
          String authHeader = request.getHeader("Authorization");
          if (authHeader != null && authHeader.startsWith("Bearer ")) {
              accessToken = authHeader.substring(7);
          }
      }

      // accessToken이 존재하면서 accessToken이 유효한 경우
      if (accessToken != null && jwtUtil.isValidToken(accessToken)) {

        log.info("유효한 토큰 확인: {} {}", method, requestURI);
        
        // JWT에서 사용자 정보 추출
        Long memberNo = jwtUtil.getMemberNo(accessToken);
        String email = jwtUtil.getEmail(accessToken);
        String role = jwtUtil.getClaims(accessToken).get("role", String.class);

        // SecurityContext에 인증 정보 저장
        createAuthenticationToken(memberNo, email, role);
        
        filterChain.doFilter(request, response);

      } else {
        // accessToken이 없거나 유효하지 않은 경우
        log.warn("유효하지 않은 토큰 확인: {} {}", method, requestURI);

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
      }
      
    } catch (Exception e) {
      log.error("JWT 필터 처리 중 오류 발생: {} {} - {}", method, requestURI, e.getMessage(), e);
      filterChain.doFilter(request, response);
    }
  }
  
  @Override
  protected boolean shouldNotFilter(@NonNull HttpServletRequest request) throws ServletException {
    String path = request.getRequestURI();
    
    // 인증/회원 관련
    if (path.startsWith("/auth/") || path.startsWith("/oauth2/") || path.startsWith("/member/")) {
      return true;
    }
    
    // API 경로들 (읽기 전용)
    if (path.startsWith("/api/ai/chat") || path.startsWith("/api/ai/health")) {
      return true;
    }
    if (path.startsWith("/api/reports/")) {
      return true;
    }
    
    // 정적 리소스
    if (path.startsWith("/favicon.ico") || path.startsWith("/static/") || 
        path.startsWith("/css/") || path.startsWith("/js/") || 
        path.startsWith("/images/") || path.startsWith("/assets/")) {
      return true;
    }
    
    // 정적 파일 확장자
    if (path.endsWith(".ico") || path.endsWith(".css") || path.endsWith(".js") || 
        path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg") || 
        path.endsWith(".gif") || path.endsWith(".svg")) {
      return true;
    }
    
    // 시스템 경로
    if (path.contains("/error") || path.startsWith("/actuator/") || 
        path.startsWith("/.well-known/") || path.startsWith("/ws")) {
      return true;
    }
    
    return false;
  }
  
  /**
   * JWT 토큰 정보로 직접 CustomUserDetails 생성하여 Spring Security 인증 토큰 생성
   */
  private void createAuthenticationToken(Long memberNo, String email, String role) {
    try {
      // JWT 정보로 직접 MemberDto 생성 (DB 조회 없음)
      MemberDto memberDto = MemberDto.builder()
        .memberNo(memberNo)
        .email(email)
        .role(role)
        .build();
      
      // CustomUserDetails 생성
      CustomUserDetails userDetails = new CustomUserDetails(memberDto);
      
      // 인증 토큰 생성
      Authentication authToken = new UsernamePasswordAuthenticationToken(
          userDetails, null, userDetails.getAuthorities());
      
      // SecurityContext에 인증 정보 저장
      SecurityContextHolder.getContext().setAuthentication(authToken);
      
      log.debug("인증 토큰 생성 완료: {}", email);
      
    } catch (Exception e) {
      log.error("인증 토큰 생성 실패: {} - {}", email, e.getMessage());
    }
  }
}
