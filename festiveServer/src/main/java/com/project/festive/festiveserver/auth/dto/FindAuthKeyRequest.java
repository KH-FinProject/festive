package com.project.festive.festiveserver.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FindAuthKeyRequest {
    // 아이디 찾기용
    private String name;      // 아이디 찾기일 때만 사용
    // 비밀번호 찾기용
    private String userId;    // 비밀번호 찾기일 때만 사용

    // 공통
    private String email;     // 이메일 인증일 때
    private String tel;       // 전화번호 인증일 때
    private String authKey;   // 인증번호
    private String authMethod; // "email" 또는 "tel"
    private String type;      // "id" 또는 "pw"
} 