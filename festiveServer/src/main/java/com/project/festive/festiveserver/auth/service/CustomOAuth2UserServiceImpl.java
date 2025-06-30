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
            // OAuth2 요청 정보 로깅
            String registrationId = userRequest.getClientRegistration().getRegistrationId();
            log.info("OAuth2 제공자: {}", registrationId);
            log.info("Client ID: {}", userRequest.getClientRegistration().getClientId());
            log.info("Redirect URI: {}", userRequest.getClientRegistration().getRedirectUri());
            log.info("Scope: {}", userRequest.getClientRegistration().getScopes());
            
            // DefaultOAuth2UserService의 기본 로직 실행
            OAuth2User oAuth2User = super.loadUser(userRequest);
            log.info("OAuth2 사용자 정보 로드 완료");
            log.debug("oAuth2User attributes: {}", oAuth2User.getAttributes());
            
            OAuth2Response oAuth2Response = null;
            
            if(registrationId.equals("google")) {
                oAuth2Response = new GoogleResponse(oAuth2User.getAttributes());
                log.info("Google OAuth2 응답 생성 완료");
            } else if(registrationId.equals("naver")) {
                oAuth2Response = new NaverResponse(oAuth2User.getAttributes());
                log.info("Naver OAuth2 응답 생성 완료");
            } else if(registrationId.equals("kakao")) {
                oAuth2Response = new KakaoResponse(oAuth2User.getAttributes());
                log.info("Kakao OAuth2 응답 생성 완료");
            } else {
                log.error("지원하지 않는 OAuth2 제공자: {}", registrationId);
                throw new OAuth2AuthenticationException("지원하지 않는 OAuth2 제공자입니다.");
            }

            String socialId = oAuth2Response.getProvider() + "_" + oAuth2Response.getProviderId();
            log.info("소셜 ID: {}", socialId);
            log.info("사용자 정보: name={}, email={}, nickname={}", 
                     oAuth2Response.getName(), 
                     oAuth2Response.getEmail(), 
                     oAuth2Response.getNickname());

            Member existingMember = memberRepository.findBySocialId(socialId);

            // 소셜 로그인 정보가 없으면 회원 정보 생성
            if(existingMember == null) {
                log.info("새로운 OAuth2 사용자 생성 시작");
                
                Member newMember = Member.builder()
                    .name(oAuth2Response.getName())
                    .email(oAuth2Response.getEmail())
                    .socialId(socialId)
                    .role("USER")  // ROLE_ 접두사 (CustomUserDetails에서 추가)
                    .nickname(oAuth2Response.getNickname())
                    .profileImage(oAuth2Response.getProfileImage())
                    .tel(oAuth2Response.getTel())
                    .build();

                log.debug("새로운 OAuth2 사용자 생성: name={}, email={}, socialId={}", 
                         oAuth2Response.getName(), oAuth2Response.getEmail(), socialId);
                
                Member savedMember = memberRepository.save(newMember);
                log.info("새로운 OAuth2 사용자 저장 완료: memberNo={}", savedMember.getMemberNo());

                return new CustomUserDetails(MemberConverter.toDto(savedMember));

            } else {
                log.info("기존 OAuth2 사용자 정보 업데이트 시작");
                
                // 소셜 로그인 정보가 있으면 회원 정보 업데이트
                existingMember.setName(oAuth2Response.getName());
                existingMember.setEmail(oAuth2Response.getEmail());
                existingMember.setNickname(oAuth2Response.getNickname());
                existingMember.setProfileImage(oAuth2Response.getProfileImage());
                
                log.debug("기존 OAuth2 사용자 업데이트: name={}, email={}, socialId={}", 
                         oAuth2Response.getName(), oAuth2Response.getEmail(), socialId);
                
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