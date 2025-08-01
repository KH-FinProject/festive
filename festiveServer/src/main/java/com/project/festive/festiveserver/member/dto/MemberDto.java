package com.project.festive.festiveserver.member.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberDto {

  private Long memberNo;
  
  private String id;
  
  private String name;
  
  private String email;

  private String tel;
  
  private String nickname;
  
  private String password;
  
  private String profileImage;

  private String socialId;

  private String role;
  
  private String address;
  
  private String withdrawDate;
  
  private String enrollDate;  // 가입일 추가
  
  private String memberDelFl; // 탈퇴여부 - 미애 추가
  
  private int sanctionCount; // 제재횟수 - 미애 추가
  
  // 마이페이지 비밀번호 변경 및 확인을 위해 추가함 - 지현
  private String currentPassword;
  
}
