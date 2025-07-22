package com.project.festive.festiveserver.auth.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class CustomOAuth2FailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        // 디버깅을 위한 로그 추가
        log.info("===== OAuth2 인증 실패 핸들러 실행 =====");
        log.info("예외 타입: {}", exception.getClass().getSimpleName());
        log.info("예외 메시지: '{}'", exception.getMessage());
        log.info("예외 원인: {}", exception.getCause());
        if (exception.getCause() != null) {
            log.info("원인 메시지: '{}'", exception.getCause().getMessage());
        }
        
        String errorMessage = exception.getMessage();
        String redirectUrl = "https://festivekorea.site/signin?error=oauth_failed";
        
        log.info("WITHDRAWN_MEMBER 체크 중...");
        if (errorMessage != null && errorMessage.contains("WITHDRAWN_MEMBER")) {
            redirectUrl = "https://festivekorea.site/signin?error=withdrawn";
            log.info("✅ WITHDRAWN_MEMBER 감지! withdrawn으로 리다이렉트");
        } else {
            log.info("❌ WITHDRAWN_MEMBER 감지 실패. oauth_failed로 리다이렉트");
            log.info("감지 실패 이유 - errorMessage: '{}'", errorMessage);
        }
        
        log.info("최종 리다이렉트 URL: {}", redirectUrl);
        response.sendRedirect(redirectUrl);
    }
} 