package com.project.festive.festiveserver.auth.dto;

import java.util.Map;

public class GoogleResponse implements OAuth2Response {
    
    private final Map<String, Object> attribute;
    
    public GoogleResponse(Map<String, Object> attribute) {
        this.attribute = attribute;
    }
    
    @Override
    public String getProvider() {
        return "google";
    }
    
    @Override
    public String getProviderId() {
        return attribute.get("sub").toString();
    }
    
    @Override
    public String getEmail() {
        Object value = attribute.get("email");
        return value != null ? value.toString() : "";
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
        Object value = attribute.get("picture");
        return value != null ? value.toString() : "";
    }

}
