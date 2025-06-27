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

    // UserDetails 구현
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

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    // OAuth2User 구현
    @Override
    public Map<String, Object> getAttributes() {
        return null; // OAuth2 속성은 사용하지 않음
    }

    @Override
    public String getName() {
        return memberDto.getEmail(); // OAuth2User의 getName()은 식별자로 사용
    }

    // 편의 메서드들
    public Long getMemberNo() {
        return memberDto.getMemberNo();
    }

    public String getEmail() {
        return memberDto.getEmail();
    }

    public String getUserName() {
        return memberDto.getName(); // 사용자 실제 이름
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
