package com.project.festive.festiveserver.auth.service;

import com.project.festive.festiveserver.auth.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    
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
        String username = oAuth2Response.getProvider() + " " + oAuth2Response.getProviderId();
        
        UserDTO userDTO = new UserDTO();
        userDTO.setUsername(username);
        userDTO.setName(oAuth2Response.getName());
        userDTO.setRole("ROLE_USER");
        
        return new CustomOAuth2User(userDTO);
    }
}
