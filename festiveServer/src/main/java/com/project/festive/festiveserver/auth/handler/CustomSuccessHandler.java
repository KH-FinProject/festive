package com.project.festive.festiveserver.auth.handler;

import java.io.IOException;
import java.util.Collection;
import java.util.Iterator;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.project.festive.festiveserver.auth.dto.CustomOAuth2User;
import com.project.festive.festiveserver.util.JwtUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CustomSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
  
  private final JwtUtil jwtUtil;

  public CustomSuccessHandler(JwtUtil jwtUtil) {
    this.jwtUtil = jwtUtil;
  }

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
    
    CustomOAuth2User customOAuth2User = (CustomOAuth2User) authentication.getPrincipal();
    
    String socialId = customOAuth2User.getSocialId();

    Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
    Iterator<? extends GrantedAuthority> iterator = authorities.iterator();
    GrantedAuthority auth = iterator.next();
    String role = auth.getAuthority();

    String token = jwtUtil.generateAccessToken(customOAuth2User.getMemberNo(), customOAuth2User.getEmail(), role, socialId);

    response.addCookie(createCookie("Authorization", token));
    response.sendRedirect("http://localhost:5173/");
  }

  private Cookie createCookie(String name, String value) {
    Cookie cookie = new Cookie(name, value);
    cookie.setPath("/");
    cookie.setMaxAge(3600);
    cookie.setHttpOnly(true);
    //cookie.setSecure(true);

    return cookie;
  }
}
