package com.project.festive.festiveserver.auth.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class CustomOAuth2FailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        String errorCode = ((OAuth2AuthenticationException)exception).getError().getErrorCode();
        String redirectUrl = "https://festivekorea.site/signin?error=oauth_failed";

        if (errorCode != null && errorCode.equals("WITHDRAWN_MEMBER")) {
            redirectUrl = "https://festivekorea.site/signin?error=withdrawn";
        }
        
        response.sendRedirect(redirectUrl);
    }
} 