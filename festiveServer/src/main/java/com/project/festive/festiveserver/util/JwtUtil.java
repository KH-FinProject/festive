package com.project.festive.festiveserver.util;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtUtil {
  private final SecretKey key;

  // 토큰 유효시간 설정
  private final long accessTokenValidity = 1000L * 60 * 30; // 30분
  private final long refreshTokenValidity = 1000L * 60 * 60 * 24 * 7; // 7일

  public JwtUtil(@Value("${jwt.secret}") String secretKey) { this.key = Keys.hmacShaKeyFor(secretKey.getBytes()); }

  // Access Token 생성
  public String generateAccessToken(Long memberNo, String email) {
    return Jwts.builder()
            // 토큰 제목 설정 - 토큰의 용도 명시
            .claim("sub", "AccessToken")
            // 클레임(Claim) 추가 - 토큰에 포함될 사용자 정보(memberNo, email) 추가
            .claim("memberNo", memberNo)
            .claim("email", email)
            // 발행 시간 설정
            .claim("iat", new Date())
            // 토큰 유효 기간 설정
            .claim("exp", new Date(System.currentTimeMillis() + accessTokenValidity))
            // 서명 추가 - HS256 알고리즘을 사용한 토큰 서명
            .signWith(key)
            // 최종적으로 JWT 문자열 생성 (토큰 생성)
            .compact();
}

// Refresh Token 생성
public String generateRefreshToken(Long memberNo, String email) {
    return Jwts.builder()
            .claim("sub", "RefreshToken")
            .claim("memberNo", memberNo)
            .claim("email", email)
            .claim("iat", new Date())
            .claim("exp", new Date(System.currentTimeMillis() + refreshTokenValidity))
            .signWith(key)
            .compact();
}

// 토큰에서 Claim 추출
public Claims getClaims(String token) {
    return Jwts.parser()
            // 토큰 서명 검증한 후,
            .verifyWith(key)
            // JWT 파서 생성
            .build()
            // 토큰 파싱 및 검증 (서명 유효성, 토큰 만료 여부, 토큰 형식의 정확성)
            .parseSignedClaims(token)
            // 검증된 토큰에서 Claims(페이로드) 추출
            .getPayload();
    
    /* 반환되는 Claims 예시
    {
        "sub": "AccessToken",
        "memberNo": 1,
        "email": "user01@kh.or.kr",
        "iat": 1623456789,
        "exp": 1623460389
    } 
     */
}

// 유효한 토큰인지 검증
// 1. 토큰의 서명이 유효하지 않음 - SignatureException
// 2. 만료 시간 경과 (exp) - ExpiredJwtException
// 3. 잘못된 형식 - MalformedJwtException
// 4. 기타 JWT 관련 오류 (ex. 지원하지 않는 JWT - UnsupportedJwtException)
public boolean isValidToken(String token) {
    try {
        Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
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
