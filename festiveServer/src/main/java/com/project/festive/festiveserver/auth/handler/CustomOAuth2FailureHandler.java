package com.project.festive.festiveserver.auth.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomOAuth2FailureHandler implements AuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        String errorMessage = exception.getMessage();
        String redirectUrl = "https://festivekorea.site/signin?error=oauth_failed";
        if (errorMessage != null && errorMessage.contains("WITHDRAWN_MEMBER")) {
            redirectUrl = "https://festivekorea.site/signin?error=withdrawn";
        }
        response.sendRedirect(redirectUrl);
    }
} 