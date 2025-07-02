package com.project.festive.festiveserver.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.http.converter.StringHttpMessageConverter;
import java.nio.charset.StandardCharsets;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  
  // 클라이언트에서 오는 Cross-Origin 요청(CORS)을 어떻게 처리할지 설정
  @Override
  public void addCorsMappings(@NonNull CorsRegistry registry) {
      registry.addMapping("/**") // 서버의 모든 API 경로(/**)에 대해 CORS 설정을 적용
              .allowedOrigins("http://localhost:5173", "http://localhost:3000") // 이 주소에서 오는 요청만 허용
              .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // 클라이언트가 사용할 수 있는 HTTP 메서드를 지정
              .allowedHeaders("*") // 클라이언트가 보낼 수 있는 헤더를 모두 허용
              .allowCredentials(true) // 브라우저가 쿠키, 인증 정보 등을 포함해서 요청할 수 있도록 허용
              .maxAge(3600); // 브라우저가 CORS preflight 요청(OPTIONS)을 캐싱할 시간(초)
  }
  
  // 회원 프로필 이미지 저장 - 지현이가 추가함
  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
      // /profile-images/** 요청이 오면 C:/upload/festive/profile/ 경로에서 파일을 찾도록 매핑
      registry.addResourceHandler("/profile-images/**")
              .addResourceLocations("file:///C:/upload/festive/profile/"); // 실제 저장 경로와 일치
  }
  
  // 찜달력(MypageServiceImpl) - 지현이가 추가함
  @Bean
  public RestTemplate restTemplate() {
      RestTemplate restTemplate = new RestTemplate();
      
      // UTF-8 인코딩을 위한 StringHttpMessageConverter 설정
      StringHttpMessageConverter stringConverter = new StringHttpMessageConverter(StandardCharsets.UTF_8);
      stringConverter.setWriteAcceptCharset(false); // Accept-Charset 헤더 생성 방지
      
      // 기존 메시지 컨버터 중 StringHttpMessageConverter를 UTF-8로 교체
      restTemplate.getMessageConverters().removeIf(converter -> 
          converter instanceof StringHttpMessageConverter);
      restTemplate.getMessageConverters().add(0, stringConverter);
      
      return restTemplate;
  }

  @Bean
  public ObjectMapper objectMapper() {
      ObjectMapper mapper = new ObjectMapper();
      mapper.registerModule(new JavaTimeModule());
      return mapper;
  }
  
}