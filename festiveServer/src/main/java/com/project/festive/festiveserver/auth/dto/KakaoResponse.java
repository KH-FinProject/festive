package com.project.festive.festiveserver.auth.dto;

import java.util.Map;

public class KakaoResponse implements OAuth2Response {
    
    private final Map<String, Object> attribute;
    private final Map<String, Object> kakaoAccount;
    private final Map<String, Object> profile;
    
    public KakaoResponse(Map<String, Object> attribute) {
        this.attribute = attribute;
        this.kakaoAccount = (Map<String, Object>) attribute.get("kakao_account");
        this.profile = (Map<String, Object>) kakaoAccount.get("profile");
    }
    
    @Override
    public String getProvider() {
        return "kakao";
    }
    
    @Override
    public String getProviderId() {
        return attribute.get("id").toString();
    }
    
    @Override
    public String getEmail() {
        Object value = kakaoAccount.get("email");
        return value != null ? value.toString() : "";
    }
    
    @Override
    public String getName() {
        Object value = profile.get("nickname");
        return value != null ? value.toString() : "";
    }

    @Override
    public String getNickname() {
        return null;
    }

    @Override
    public String getProfileImage() {
        Object value = profile.get("profile_image_url");
        return value != null ? value.toString() : "";
    }

    @Override
    public String getTel() {
        return null;
    }
} 