package com.project.festive.festiveserver.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.project.festive.festiveserver.auth.service.CustomOAuth2UserService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    // bcrypt 사용을 위한 Bean 등록
    @Bean
    public BCryptPasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    private final CustomOAuth2UserService customOAuth2UserService;
    
    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService) {
        this.customOAuth2UserService = customOAuth2UserService;
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        
        // CORS(Cross-Origin Resource Sharing) 기본 설정을 활성화
        http.cors(Customizer.withDefaults())

        // CSRF(Cross-Site Request Forgery) 보호를 비활성화
        .csrf(auth -> auth.disable())
        
        //formLogin 활성화
        .formLogin(auth -> auth
        .loginPage("/login")  // 커스텀 로그인 페이지
        .loginProcessingUrl("/auth/login")  // 로그인 처리 URL
        .defaultSuccessUrl("/")  // 로그인 성공 시 리다이렉트
        .failureUrl("/error"))  // 로그인 실패 시
        
        //HTTP Basic 인증 방식 disable
        .httpBasic(auth -> auth.disable())
        
        //oauth2
        .oauth2Login(oauth2 -> oauth2
        .userInfoEndpoint(userInfoEndpointConfig -> userInfoEndpointConfig
        .userService(customOAuth2UserService)))
        
        //경로별 인가 작업
        .authorizeHttpRequests(auth -> auth
        .requestMatchers("/", "/signup", "/login", "/auth/**", "/oauth2/**").permitAll()
        .anyRequest().authenticated())
        
        //세션 설정 : STATELESS
        .sessionManagement(session -> session
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        
        return http.build();
    }
}
