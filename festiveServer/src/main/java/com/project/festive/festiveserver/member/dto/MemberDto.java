package com.project.festive.festiveserver.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
  
  @NotBlank(message = "아이디를 입력해주세요")
  @Size(min = 4, max = 20, message = "아이디는 4~20자 사이로 입력해주세요")
  @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "아이디는 영문자와 숫자만 사용 가능합니다")
  private String id;
  
  @NotBlank(message = "이름을 입력해주세요")
  @Size(min = 2, max = 20, message = "이름은 2~20자 사이로 입력해주세요")
  private String name;
  
  @NotBlank(message = "이메일을 입력해주세요")
  @Email(message = "올바른 이메일 형식으로 입력해주세요")
  private String email;
  private String tel;
  
  @NotBlank(message = "닉네임을 입력해주세요")
  @Size(min = 2, max = 15, message = "닉네임은 2~15자 사이로 입력해주세요")
  @Pattern(regexp = "^[ㄱ-힣a-zA-Z0-9]+$", message = "닉네임은 한글, 영문자, 숫자만 사용 가능합니다")
  private String nickname;
  
  @NotBlank(message = "비밀번호를 입력해주세요")
  @Size(min = 6, max = 20, message = "비밀번호는 6~20자 사이로 입력해주세요")
  @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$", message = "비밀번호는 영문자와 숫자를 포함해야 합니다")
  private String password;
  
  private String profileImage;
  private String socialId;
  private String role;
  private String address;
  
}
