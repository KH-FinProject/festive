package com.project.festive.festiveserver.auth.dto;

import java.util.Map;

public class NaverResponse implements OAuth2Response {
    
    private final Map<String, Object> attribute;
    
    public NaverResponse(Map<String, Object> attribute) {
        this.attribute = (Map<String, Object>) attribute.get("response");
    }
    
    @Override
    public String getProvider() {
        return "naver";
    }
    
    @Override
    public String getProviderId() {
        return attribute.get("id").toString();
    }
    
    @Override
    public String getEmail() {
        return attribute.get("email").toString();
    }
    
    @Override
    public String getName() {
        Object value = attribute.get("name");
        return value != null ? value.toString() : "";
    }

    @Override
    public String getNickname() {
        Object value = attribute.get("nickname");
        return value != null ? value.toString() : "";
    }

    @Override
    public String getProfileImage() {
        Object value = attribute.get("profile_image");
        return value != null ? value.toString() : "";
    }

    @Override
    public String getTel() {
        Object value = attribute.get("mobile");
        return value != null ? value.toString() : "";
    }

}
