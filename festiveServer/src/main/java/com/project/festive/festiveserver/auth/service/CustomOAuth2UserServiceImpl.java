package com.project.festive.festiveserver.auth.service;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.festive.festiveserver.auth.dto.CustomUserDetails;
import com.project.festive.festiveserver.auth.dto.GoogleResponse;
import com.project.festive.festiveserver.auth.dto.NaverResponse;
import com.project.festive.festiveserver.auth.dto.OAuth2Response;
import com.project.festive.festiveserver.member.converter.MemberConverter;
import com.project.festive.festiveserver.member.entity.Member;
import com.project.festive.festiveserver.member.repository.MemberRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(rollbackFor = Exception.class)
public class CustomOAuth2UserServiceImpl extends DefaultOAuth2UserService implements CustomOAuth2UserService {
    
    private final MemberRepository memberRepository;

    public CustomOAuth2UserServiceImpl(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        
        // DefaultOAuth2UserService의 기본 로직 실행
        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.debug("oAuth2User : {}", oAuth2User);
        log.debug("oAuth2User attributes : {}", oAuth2User.getAttributes());
        
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

        String socialId = oAuth2Response.getProvider() + "_" + oAuth2Response.getProviderId();
        Member existingMember = memberRepository.findBySocialId(socialId);

        // 소셜 로그인 정보가 없으면 회원 정보 생성
        if(existingMember == null) {
            Member newMember = Member.builder()
                .name(oAuth2Response.getName())
                .email(oAuth2Response.getEmail())
                .socialId(socialId)
                .role("USER")  // ROLE_ 접두사 (CustomUserDetails에서 추가)
                .nickname(oAuth2Response.getNickname())
                .profileImage(oAuth2Response.getProfileImage())
                .build();

            // id, password는 소셜 로그인인 경우 없음

            log.debug("새로운 OAuth2 사용자 생성: name={}, email={}, socialId={}", oAuth2Response.getName(), oAuth2Response.getEmail(), socialId);
            Member savedMember = memberRepository.save(newMember);

            return new CustomUserDetails(MemberConverter.toDto(savedMember));

        } else {
            existingMember.setName(oAuth2Response.getName());
            existingMember.setEmail(oAuth2Response.getEmail());
            existingMember.setNickname(oAuth2Response.getNickname());
            existingMember.setProfileImage(oAuth2Response.getProfileImage());

            log.debug("기존 OAuth2 사용자 업데이트: name={}, email={}, socialId={}", oAuth2Response.getName(), oAuth2Response.getEmail(), socialId);
            memberRepository.save(existingMember);

            return new CustomUserDetails(MemberConverter.toDto(existingMember));
        }
    }
} 