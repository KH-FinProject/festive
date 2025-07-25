package com.project.festive.festiveserver.auth.dto;

public interface OAuth2Response {
    
    //제공자 (Ex. naver, google, ...)
    String getProvider();
    //제공자에서 발급해주는 아이디(번호)
    String getProviderId();
    //이메일
    String getEmail();
    //사용자 실명 (설정한 이름)
    String getName();
    //사용자 닉네임
    String getNickname();
    //프로필 사진
    String getProfileImage();
    // 전화번호
    String getTel();
}
