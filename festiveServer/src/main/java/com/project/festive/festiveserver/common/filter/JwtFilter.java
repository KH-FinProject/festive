package com.project.festive.festiveserver.common.filter;

import java.io.IOException;

import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.WebUtils;

import com.project.festive.festiveserver.auth.dto.CustomOAuth2User;
import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.common.util.JwtUtil;

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
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
    long startTime = System.currentTimeMillis();
    String requestURI = request.getRequestURI();
    String method = request.getMethod();
    
    log.info("JWT Filter 시작: {} {}", method, requestURI);
    
    try {
      // 쿠키에서 토큰 추출
      Cookie cookie = WebUtils.getCookie(request, "accessToken");
      String accessToken = cookie != null ? cookie.getValue() : null;

      // authorization 헤더 검증
      if (accessToken == null) {
        log.info("accessToken 쿠키 존재하지 않음: {} {}", method, requestURI);
        filterChain.doFilter(request, response);
        return;
      }

      if (!jwtUtil.isValidToken(accessToken)) {
        log.info("토큰이 유효하지 않음 - Refresh Token 확인: {} {}", method, requestURI);
        
        // Refresh Token 확인
        Cookie refreshCookie = WebUtils.getCookie(request, "refreshToken");
        String refreshToken = refreshCookie != null ? refreshCookie.getValue() : null;
        
        if (refreshToken != null && jwtUtil.isValidToken(refreshToken)) {
          log.info("Refresh Token으로 새로운 Access Token 생성: {} {}", method, requestURI);
          
          // Refresh Token에서 정보 추출
          Long memberNo = jwtUtil.getMemberNo(refreshToken);
          String email = jwtUtil.getEmail(refreshToken);
          String role = jwtUtil.getClaims(refreshToken).get("role", String.class);
          
          // 새로운 Access Token 생성
          String newAccessToken = jwtUtil.generateAccessToken(memberNo, email, role, null);
          
          // 새로운 Access Token을 쿠키에 설정
          ResponseCookie newAccessTokenCookie = ResponseCookie.from("accessToken", newAccessToken)
              .httpOnly(true)
              .secure(true)
              .sameSite("Strict")
              .maxAge(30 * 60) // 30분
              .path("/")
              .build();
          
          response.addHeader("Set-Cookie", newAccessTokenCookie.toString());

          createAuthenticationToken(memberNo, email, role);
          
          filterChain.doFilter(request, response);
          return;
          
        } else {
          log.warn("Refresh Token도 유효하지 않음: {} {}", method, requestURI);
          filterChain.doFilter(request, response);
          return;
        }
      }
      
      // 토큰이 유효한 경우 - Spring Security 인증 토큰 생성
      log.info("유효한 토큰 확인: {} {}", method, requestURI);
      
      // JWT에서 사용자 정보 추출
      Long memberNo = jwtUtil.getMemberNo(accessToken);
      String email = jwtUtil.getEmail(accessToken);
      String role = jwtUtil.getClaims(accessToken).get("role", String.class);
      
      createAuthenticationToken(memberNo, email, role);
      
      filterChain.doFilter(request, response);
      
    } catch (Exception e) {
      log.error("JWT 필터 처리 중 오류 발생: {} {} - {}", method, requestURI, e.getMessage(), e);
      filterChain.doFilter(request, response);
    } finally {
      long duration = System.currentTimeMillis() - startTime;
      log.info("JWT Filter 완료: {} {} - {}ms", method, requestURI, duration);
    }
  }
  
  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
    String path = request.getRequestURI();
    
    // 정적 리소스 및 특정 경로 제외
    return path.contains("/favicon.ico") ||
           path.contains("/static/") ||
           path.contains("/css/") ||
           path.startsWith("/admin/") || // 나중에 로그인 다 구현되면 빼기
           path.contains("/js/") ||
           path.contains("/images/") ||
           path.contains("/assets/") ||
           path.contains("/error") ||
           path.contains("/actuator/") ||
           path.endsWith(".ico") ||
           path.endsWith(".css") ||
           path.endsWith(".js") ||
           path.endsWith(".png") ||
           path.endsWith(".jpg") ||
           path.endsWith(".jpeg") ||
           path.endsWith(".gif") ||
           path.endsWith(".svg");
  }
  
  private void createAuthenticationToken(Long memberNo, String email, String role) {

    MemberDto memberDto = new MemberDto();
    memberDto.setMemberNo(memberNo);
    memberDto.setEmail(email);
    memberDto.setRole(role);

    // Spring Security 인증 토큰 생성 및 등록
    CustomOAuth2User customOAuth2User = new CustomOAuth2User(memberDto);
    Authentication authToken = new UsernamePasswordAuthenticationToken(customOAuth2User, null, customOAuth2User.getAuthorities());
    SecurityContextHolder.getContext().setAuthentication(authToken);
  }
}
