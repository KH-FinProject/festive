package com.project.festive.festiveserver.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class PasswordConfig {
  @Bean
  public BCryptPasswordEncoder bcrypt() {
    return new BCryptPasswordEncoder();
  }
}
