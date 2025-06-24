package com.project.festive.festiveserver.util;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtUtil {
  private final SecretKey secretKey;

  // 토큰 유효시간 설정
  private final long accessTokenValidity = 1000L * 60 * 30; // 30분
  private final long refreshTokenValidity = 1000L * 60 * 60 * 24 * 7; // 7일

  public JwtUtil(@Value("${jwt.secret}") String secret) {
    // 문자열 시크릿(secret)을 UTF-8 바이트 배열로 변환, 내부적으로 SecretKeySpec을 사용해서 SecretKey 객체를 만들어줌
    this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  // Access Token 생성
  public String generateAccessToken(Long memberNo, String email, String role, String socialId) {
    JwtBuilder builder = Jwts.builder()
        .claim("memberNo", memberNo)
        .claim("email", email)
        .claim("role", role);

    // 소셜 로그인 시 소셜 아이디 추가
    if (socialId != null) {
        builder.claim("socialId", socialId);
    }

    return builder
        .subject("AccessToken")
        .issuedAt(new Date(System.currentTimeMillis()))
        .expiration(new Date(System.currentTimeMillis() + accessTokenValidity))
        .signWith(secretKey)
        .compact();
  }

  // Refresh Token 생성
  public String generateRefreshToken(Long memberNo, String email, String role, String socialId) {
    JwtBuilder builder = Jwts.builder()
        .claim("memberNo", memberNo)
        .claim("email", email)
        .claim("role", role);

    if (socialId != null) {
        builder.claim("socialId", socialId);
    }

    return builder
        .subject("RefreshToken")
        .issuedAt(new Date(System.currentTimeMillis()))
        .expiration(new Date(System.currentTimeMillis() + refreshTokenValidity))
        .signWith(secretKey)
        .compact();
  }

  // 토큰에서 Claim 추출
  public Claims getClaims(String token) {
    return Jwts.parser()
            // 토큰 서명 검증한 후,
            .verifyWith(secretKey)
            // JWT 파서 생성
            .build()
            // 토큰 파싱 및 검증 (서명 유효성, 토큰 만료 여부, 토큰 형식의 정확성)
            .parseSignedClaims(token)
            // 검증된 토큰에서 Claims(페이로드) 추출
            .getPayload();
  }

  // 유효한 토큰인지 검증 (0.12.3 버전 JwtException으로 일괄 사용)
  public boolean isValidToken(String token) {
    try {
        Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
        return true;
    } catch (JwtException e) {
        log.debug("JWT 처리 중 오류 발생", e);
    } catch (Exception e) {
        log.debug("알 수 없는 예외 발생", e);
    }
    return false;
  }

  // 토큰에서 이메일 추출
  public String getEmail(String token) { return getClaims(token).get("email", String.class); }

  // 토큰에서 회원번호 추출
  public Long getMemberNo(String token) {
    try {
        return getClaims(token).get("memberNo", Long.class);
    } catch (ExpiredJwtException e) {
        // 만료된 토큰이라도 claims 유효
        return e.getClaims().get("memberNo", Long.class);
    }
  }

  // 토큰 만료일자 추출
  public Date getExpirationDate(String token) { return getClaims(token).getExpiration(); }
}
