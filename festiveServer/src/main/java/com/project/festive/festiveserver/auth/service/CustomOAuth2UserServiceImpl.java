package com.project.festive.festiveserver.auth.service;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.festive.festiveserver.auth.dto.CustomUserDetails;
import com.project.festive.festiveserver.auth.dto.GoogleResponse;
import com.project.festive.festiveserver.auth.dto.KakaoResponse;
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
        log.info("OAuth2 사용자 로드 시작");
        try {
            String registrationId = userRequest.getClientRegistration().getRegistrationId();

            log.info("OAuth2 제공자: {}", registrationId);

            OAuth2User oAuth2User = super.loadUser(userRequest);
            OAuth2Response oAuth2Response = null;

            if(registrationId.equals("google")) {
                oAuth2Response = new GoogleResponse(oAuth2User.getAttributes());

            } else if(registrationId.equals("naver")) {
                oAuth2Response = new NaverResponse(oAuth2User.getAttributes());

            } else if(registrationId.equals("kakao")) {
                oAuth2Response = new KakaoResponse(oAuth2User.getAttributes());

            } else {
                log.error("지원하지 않는 OAuth2 제공자: {}", registrationId);
                throw new OAuth2AuthenticationException("지원하지 않는 OAuth2 제공자입니다.");
            }

            String socialId = oAuth2Response.getProvider() + "_" + oAuth2Response.getProviderId();
            Member existingMember = memberRepository.findBySocialId(socialId);

            if(existingMember == null) {
                Member newMember = Member.builder()
                    .name(oAuth2Response.getName())
                    .email(oAuth2Response.getEmail())
                    .socialId(socialId)
                    .role("USER")
                    .nickname(oAuth2Response.getNickname())
                    .profileImage(oAuth2Response.getProfileImage())
                    .tel(oAuth2Response.getTel())
                    .build();

                Member savedMember = memberRepository.save(newMember);
                log.info("새로운 OAuth2 사용자 저장 완료: memberNo={}", savedMember.getMemberNo());

                return new CustomUserDetails(MemberConverter.toDto(savedMember));

            } else {
                existingMember.setName(oAuth2Response.getName());
                existingMember.setEmail(oAuth2Response.getEmail());
                existingMember.setNickname(oAuth2Response.getNickname());
                existingMember.setProfileImage(oAuth2Response.getProfileImage());

                memberRepository.save(existingMember);

                log.info("기존 OAuth2 사용자 업데이트 완료: memberNo={}", existingMember.getMemberNo());

                return new CustomUserDetails(MemberConverter.toDto(existingMember));
            }
            
        } catch (Exception e) {
            log.error("OAuth2 사용자 로드 중 오류 발생", e);
            throw new OAuth2AuthenticationException("OAuth2 사용자 정보 처리 중 오류가 발생했습니다.");
        }
    }
} 