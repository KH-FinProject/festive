package com.project.festive.festiveserver.auth.dto;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.project.festive.festiveserver.member.dto.MemberDto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails, OAuth2User {

    private final MemberDto memberDto;

    // UserDetails
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + memberDto.getRole()));
    }

    @Override
    public String getPassword() {
        return memberDto.getPassword();
    }

    @Override
    public String getUsername() {
        return memberDto.getEmail();
    }
    
    // OAuth2User
    @Override
    public Map<String, Object> getAttributes() {
        return null; // OAuth2 속성은 사용하지 않음
    }

    @Override
    public String getName() {
        return memberDto.getEmail();
    }

    public Long getMemberNo() {
        return memberDto.getMemberNo();
    }

    public String getEmail() {
        return memberDto.getEmail();
    }

    public String getUserName() {
        return memberDto.getName();
    }

    public String getNickname() {
        return memberDto.getNickname();
    }

    public String getRole() {
        return memberDto.getRole();
    }
    
    public String getSocialId() {
        return memberDto.getSocialId();
    }
    
    public String getProfileImage() {
        return memberDto.getProfileImage();
    }
}
