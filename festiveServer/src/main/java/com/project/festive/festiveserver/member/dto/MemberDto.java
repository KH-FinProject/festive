package com.project.festive.festiveserver.member.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberDto {

  private Long memberNo;
  private String memberName;
  private String email;
  private String nickname;
  private String password;
  private String socialId;
  private String role;
}
