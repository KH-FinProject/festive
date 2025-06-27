package com.project.festive.festiveserver.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private Long memberNo;
    private String name;
    private String nickname;
    private String email;
    private String role;
    private String profileImage;
}
