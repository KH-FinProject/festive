package com.project.festive.festiveserver.auth.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.project.festive.festiveserver.auth.entity.RefreshToken;

import java.util.Map;

@Mapper
public interface AuthMapper {

  public int insertRefreshToken(RefreshToken refreshToken);
  public int updateRefreshToken(RefreshToken refreshToken);

  // 아이디 찾기 - 이름+이메일+인증번호 모두 일치 확인
  int checkIdFindByEmail(String name, String email, String authKey);
  // 아이디 찾기 - 이름+전화번호+인증번호 모두 일치 확인
  int checkIdFindByTel(String name, String tel, String authKey);
  // 비밀번호 찾기 - 아이디+이메일+인증번호 모두 일치 확인
  int checkPwFindByEmail(String userId, String email, String authKey);
  // 비밀번호 찾기 - 아이디+전화번호+인증번호 모두 일치 확인
  int checkPwFindByTel(String userId, String tel, String authKey);

  Map<String, Object> findIdSocialByEmail(String name, String email, String authKey);
  Map<String, Object> findIdSocialByTel(String name, String tel, String authKey);

  int findPwSocialByEmail(String userId, String email, String authKey);
  int findPwSocialByTel(String userId, String tel, String authKey);
}
