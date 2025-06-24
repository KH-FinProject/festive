package com.project.festive.festiveserver.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.project.festive.festiveserver.auth.handler.CustomSuccessHandler;
import com.project.festive.festiveserver.auth.service.CustomOAuth2UserService;
import com.project.festive.festiveserver.filter.JwtFilter;
import com.project.festive.festiveserver.util.JwtUtil;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // 메서드 레벨 보안 활성화
public class SecurityConfig {
    
    // bcrypt 사용을 위한 Bean 등록
    @Bean
    public BCryptPasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomSuccessHandler customSuccessHandler;
    private final JwtUtil jwtUtil;
    

    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService, CustomSuccessHandler customSuccessHandler, JwtUtil jwtUtil) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.customSuccessHandler = customSuccessHandler;
        this.jwtUtil = jwtUtil;
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        
        // CORS(Cross-Origin Resource Sharing) 기본 설정을 활성화
        http.cors(Customizer.withDefaults())

        // CSRF(Cross-Site Request Forgery) 보호를 비활성화
        .csrf(auth -> auth.disable())
        
        // JWT 필터를 UsernamePasswordAuthenticationFilter 이전에 추가
        // formLogin, oauth2Login 모두에 JWT 필터가 적용됨
        .addFilterBefore(new JwtFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class)
        
        // formLogin 비활성화 (사용자 지정 로그인 사용)
        .formLogin(auth -> auth.disable())
        
        //HTTP Basic 인증 방식 disable
        .httpBasic(auth -> auth.disable())
        
        //oauth2
        .oauth2Login(oauth2 -> oauth2
        .userInfoEndpoint(userInfoEndpointConfig -> userInfoEndpointConfig
        .userService(customOAuth2UserService))
        .successHandler(customSuccessHandler))
        
        //경로별 인가 작업
        .authorizeHttpRequests(auth -> auth
        .requestMatchers("/", "/favicon.ico", "/static/**", "/css/**", "/js/**", "/images/**", "/assets/**", "/error", "/actuator/**").permitAll()
        .requestMatchers("/signup", "/login", "/auth/**", "/oauth2/**").permitAll()
        .requestMatchers("/myPage/**").authenticated() // 인증된 사용자만 접근
        .requestMatchers("/admin/**").hasRole("ADMIN") // 관리자만 접근
        .anyRequest().authenticated())
        
        //세션 설정 : STATELESS
        .sessionManagement(session -> session
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        
        return http.build();
    }
}
