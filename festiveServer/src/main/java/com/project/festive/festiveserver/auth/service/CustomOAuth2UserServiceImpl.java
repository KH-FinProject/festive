package com.project.festive.festiveserver.auth.service;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.project.festive.festiveserver.auth.dto.CustomOAuth2User;
import com.project.festive.festiveserver.auth.dto.GoogleResponse;
import com.project.festive.festiveserver.auth.dto.NaverResponse;
import com.project.festive.festiveserver.auth.dto.OAuth2Response;
import com.project.festive.festiveserver.auth.repository.MemberRepository;
import com.project.festive.festiveserver.member.entity.Member;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CustomOAuth2UserServiceImpl extends DefaultOAuth2UserService implements CustomOAuth2UserService {
    
    private final MemberRepository memberRepository;

    public CustomOAuth2UserServiceImpl(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        
        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.debug("oAuth2User : {}", oAuth2User);
        
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuth2Response oAuth2Response = null;
        if(registrationId.equals("google")) {
            
            oAuth2Response = new GoogleResponse(oAuth2User.getAttributes());
        
        } else if(registrationId.equals("naver")) {
        
            oAuth2Response = new NaverResponse(oAuth2User.getAttributes());
            
        } else if(registrationId.equals("kakao")) {
            return null;
        } else {
            return null;
        }
        
        

        //추후 작성
        String memberName = oAuth2Response.getProvider() + " " + oAuth2Response.getProviderId();
        
        Member member = new Member();
        member.setMemberName(memberName);
        member.setName(oAuth2Response.getName());
        member.setRole("ROLE_MEMBER");
        
        return new CustomOAuth2User(member);
    }
}
