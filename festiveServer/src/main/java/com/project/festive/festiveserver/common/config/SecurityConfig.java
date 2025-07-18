package com.project.festive.festiveserver.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import jakarta.servlet.http.HttpServletResponse;

import com.project.festive.festiveserver.auth.handler.CustomSuccessHandler;
import com.project.festive.festiveserver.auth.service.CustomOAuth2UserService;
import com.project.festive.festiveserver.common.filter.JwtFilter;
import com.project.festive.festiveserver.common.util.JwtUtil;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // 메서드 레벨 보안 활성화
public class SecurityConfig {

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

        // CSRF(Cross-Site Request Forgery) 보호를 비활성화 (JWT 사용 시)
        .csrf(auth -> auth.disable())
        
        // X-Frame-Options 헤더 설정 (iframe 허용)
        .headers(headers -> headers.frameOptions().sameOrigin())
        
        // formLogin 비활성화 (사용자 지정 로그인 사용)
        .formLogin(auth -> auth.disable())
        
        //HTTP Basic 인증 방식 disable
        .httpBasic(auth -> auth.disable())
        
        // 인증/인가 실패 시 JSON 반환
        .exceptionHandling(auth -> auth
            .authenticationEntryPoint((request, response, authException) -> {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"인증이 필요합니다.\"}");
            })
            .accessDeniedHandler((request, response, accessDeniedException) -> {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"권한이 없습니다.\"}");
            })
        )
        
        //oauth2
        .oauth2Login(oauth2 -> oauth2
            .userInfoEndpoint(userInfoEndpointConfig -> userInfoEndpointConfig
                .userService(customOAuth2UserService))
            .successHandler(customSuccessHandler))
        
        //경로별 인가 작업
        .authorizeHttpRequests(auth -> auth

            // WebSocket 관련 경로 - Spring Security 권장 방식
            .requestMatchers("/ws/**", "/websocket/**").permitAll()

            // 인증/회원/로그인 관련
            .requestMatchers("/auth/**", "/oauth2/**", "/member/**").permitAll()

            // 지역 코드/시군구 조회 - 공개
            .requestMatchers("/area/**").permitAll()

            // 축제 페이지
            .requestMatchers("/api/festival/**").permitAll()
            
            // 관리자 페이지
            .requestMatchers("/admin/**").hasRole("ADMIN")
            
            // 와글 게시판 - 읽기는 공개, 쓰기/수정/삭제는 인증 필요
            .requestMatchers(HttpMethod.GET, "/api/wagle/boards").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/wagle/boards/*").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/wagle/boards/*/comments").permitAll()
            .requestMatchers("/api/wagle/**").authenticated()

            // 고객센터 - 읽기는 공개, 쓰기/수정/삭제는 인증 필요
            .requestMatchers(HttpMethod.GET, "/api/customer/boards").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/customer/boards/*").permitAll()
            .requestMatchers("/api/customer/**").authenticated()
            .requestMatchers(HttpMethod.POST, "/api/customer/boards/*/comments").hasRole("ADMIN")
            .requestMatchers("/api/customer/statistics", "/api/customer/unanswered", "/api/customer/boards/*/status").hasRole("ADMIN")

            // AI 서비스 - 공개
            .requestMatchers("/api/ai/chat", "/api/ai/health").permitAll()
            .requestMatchers("/api/ai/place-overview/**", "/api/ai/place-images/**").permitAll()

            // 여행코스 - 공유 코스 조회와 상세 조회는 공개, 저장/삭제/수정은 인증 필요
            .requestMatchers(HttpMethod.GET, "/api/travel-course/shared-courses").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/travel-course/*").permitAll() // 상세 조회 공개
            .requestMatchers("/api/travel-course/**").authenticated()

            // 신고 - 등록/상세만 공개, 나머지는 관리자
            .requestMatchers(HttpMethod.POST, "/api/reports").authenticated()
            .requestMatchers(HttpMethod.GET, "/api/reports/*", "/api/reports/*/detail").permitAll()
            .requestMatchers("/api/reports/**").hasRole("ADMIN")

            // 마이페이지 - 인증 필요
            .requestMatchers("/mypage/**").authenticated()

            // 프로필 이미지
            .requestMatchers("/profile-images/**").permitAll()
            
            // 게시글 이미지
            .requestMatchers("/board-images/**").permitAll()
            
            // 부스 이미지
            .requestMatchers("/upload/festive/booth/**").permitAll()

            // 정적 리소스/시스템 경로 - Spring Security 권장 방식
            .requestMatchers("/static/**", "/css/**", "/js/**", "/images/**", "/assets/**").permitAll()
            .requestMatchers("/*.ico", "/*.css", "/*.js", "/*.png", "/*.jpg", "/*.jpeg", "/*.gif", "/*.svg").permitAll()
            .requestMatchers("/error", "/actuator/**", "/.well-known/**").permitAll()

            // 부스 신청 관련 API - 인증 없이 허용
            .requestMatchers("/api/booth/**").permitAll()

            // 그 외 모든 요청은 인증 필요
            .anyRequest().authenticated())
        
        // JWT 필터를 UsernamePasswordAuthenticationFilter 이전에 추가
        // permitAll 경로는 JWT 필터를 거치지만 인증 실패 시에도 통과
        .addFilterBefore(new JwtFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class)
        
        //세션 설정 : STATELESS
        .sessionManagement(session -> session
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        
        return http.build();
    }
}
