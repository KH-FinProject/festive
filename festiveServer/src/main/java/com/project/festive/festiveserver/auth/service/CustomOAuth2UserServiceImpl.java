package com.project.festive.festiveserver.auth.service;

import java.io.File;
import java.io.IOException;

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
import com.project.festive.festiveserver.common.util.Utility;
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
            
            switch (registrationId) {
                case "google" -> oAuth2Response = new GoogleResponse(oAuth2User.getAttributes());
                case "naver" -> oAuth2Response = new NaverResponse(oAuth2User.getAttributes());
                case "kakao" -> oAuth2Response = new KakaoResponse(oAuth2User.getAttributes());
                default -> {
                    log.error("지원하지 않는 OAuth2 제공자: {}", registrationId);
                    throw new OAuth2AuthenticationException("지원하지 않는 OAuth2 제공자입니다.");
                }
            }

            String socialId = oAuth2Response.getProvider() + "_" + oAuth2Response.getProviderId();
            Member existingMember = memberRepository.findBySocialId(socialId);

            if(existingMember == null) {
                String profileImageUrl = oAuth2Response.getProfileImage();
                String profileImagePath = null;
                if (profileImageUrl != null && !profileImageUrl.isEmpty()) {
                    String saveDir = "/home/ec2-user/upload/profile/";
                    try {
                        String savedPath = Utility.downloadImageToServer(profileImageUrl, saveDir);
                        profileImagePath = "/profile-images/" + new File(savedPath).getName();
                    } catch (IOException e) {
                        log.error("프로필 이미지 다운로드 실패: {}", e.getMessage());
                    }
                }

                Member newMember = Member.builder()
                    .name(oAuth2Response.getName())
                    .email(oAuth2Response.getEmail())
                    .socialId(socialId)
                    .role("USER")
                    .nickname(oAuth2Response.getNickname())
                    .profileImage(profileImagePath) // 서버 url 경로만 저장
                    .build();
                
                if(registrationId.equals("naver"))
                    newMember.setTel(oAuth2Response.getTel().replaceAll("-", ""));
                else
                    newMember.setTel(oAuth2Response.getTel());

                Member savedMember = memberRepository.save(newMember);
                log.info("새로운 OAuth2 사용자 저장 완료: memberNo={}", savedMember.getMemberNo());

                return new CustomUserDetails(MemberConverter.toDto(savedMember));

            } else {
                existingMember.setName(oAuth2Response.getName());
                existingMember.setEmail(oAuth2Response.getEmail());
                // existingMember.setNickname(oAuth2Response.getNickname()); // 소셜 로그인 시 닉네임 변경을 위한 주석처리
                // existingMember.setProfileImage(oAuth2Response.getProfileImage()); // 소셜 로그인 시 수정된 프로필 이미지 적용을 위한 주석처리

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