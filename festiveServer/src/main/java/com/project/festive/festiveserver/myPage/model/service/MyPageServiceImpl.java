package com.project.festive.festiveserver.myPage.model.service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.myPage.dto.MyCalendarDto;
import com.project.festive.festiveserver.myPage.model.mapper.MyPageMapper;
import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;

@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
@Slf4j
public class MyPageServiceImpl implements MyPageService {
	
	private final MyPageMapper mapper;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${tour.api.key}")
    private String serviceKey;
    
    
    @Value("${file.upload-dir}") // 설정 파일에서 경로를 주입받음
    private String uploadDir;


    // 회원 탈퇴
    @Override
    public boolean withdraw(Long memberNo, String password) {
        String encodedPw = mapper.selectPw(memberNo); // DB에서 암호화된 비밀번호 조회

        // bcrypt 비교
        if (encodedPw != null && passwordEncoder.matches(password, encodedPw)) {
            return mapper.withdrawal(memberNo) > 0; // 탈퇴 처리
        }

        return false;
    }
    
    // 비밀번호 변경
    @Override
    public boolean changePw(Long memberNo, String currentPw, String newPw) {
        String encodedPw = mapper.selectPw(memberNo);
        if (encodedPw != null && passwordEncoder.matches(currentPw, encodedPw)) {
            String newEncodedPw = passwordEncoder.encode(newPw);
            return mapper.changePw(memberNo, newEncodedPw) > 0;
        }
        return false;
    }
    
    // 비밀번호 변경 시 현재 비밀번호 확인
    @Override
    public boolean checkPassword(Long memberNo, String rawPassword) {
        String encodedPassword = mapper.selectPw(memberNo);
        if (encodedPassword == null) return false;
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
    
    // 내가 작성한 게시글 조회
    @Override
    public List<BoardDto> getMyPosts(Long memberNo) {
        return mapper.selectMyPosts(memberNo);
    }
    
    // 내가 작성한 댓글 조회
    @Override
    public List<CommentDto> getMyComments(Long memberNo) {
    	return mapper.selectMyComments(memberNo);
    }
    
    // 회원 정보 조회
    @Override
    public MemberDto getMyInfo(Long memberNo) {
        return mapper.selectMyInfo(memberNo);
    }

    // 회원 정보 수정
    @Override
    public boolean updateMyInfo(Long memberNo, MemberDto updatedInfo) {
        // 현재 비밀번호 조회 (DB에 저장된 암호화된 비밀번호)
//        String currentEncodedPw = mapper.selectPw(memberNo);
//
//        // 프론트에서 넘어온 비밀번호(updatedInfo.getPassword()가 아니라 updatedInfo.getCurrentPassword())와 DB 비밀번호 비교
//        if (!passwordEncoder.matches(updatedInfo.getCurrentPassword(), currentEncodedPw)) {
//            // 비밀번호 불일치
//            return false;
//        }

        // 비밀번호 일치 시 정보 수정
        updatedInfo.setMemberNo(memberNo); // memberNo는 JWT에서 추출한 것으로 설정
        mapper.updateMyInfo(updatedInfo); // MemberDto 객체 전체를 전달
        return true;
    }
    
    @Override
    public MemberDto getProfileInfo(Long memberNo) {
        return mapper.selectProfileInfo(memberNo);
    }

    @Override
    public boolean checkNicknameDuplicate(String nickname, Long memberNo) {
        // 본인 닉네임은 중복 검사에서 제외
        Integer count = mapper.countByNicknameExcludeSelf(nickname, memberNo);
        return count > 0; // 중복이면 true, 아니면 false
    }

    @Override
    public boolean updateProfile(Long memberNo, String nickname, MultipartFile profileImageFile) {
        String profileImagePath = null;

        // 1. 프로필 이미지 파일 처리 (파일이 있을 때만)
        if (profileImageFile != null && !profileImageFile.isEmpty()) {
            try {
                File directory = new File(uploadDir);
                if (!directory.exists()) {
                    boolean created = directory.mkdirs();
                    if (!created) {
                        throw new IOException("Failed to create upload directory at " + uploadDir);
                    }
                }

                String originalFilename = profileImageFile.getOriginalFilename();
                String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                String savedFileName = UUID.randomUUID().toString() + extension;
                File targetFile = new File(uploadDir, savedFileName);

                profileImageFile.transferTo(targetFile);
                profileImagePath = "/profile-images/" + savedFileName;
            } catch (IOException e) {
                log.error("프로필 이미지 저장 중 오류 발생 (memberNo: {}): {}", memberNo, e.getMessage(), e);
                throw new RuntimeException("프로필 이미지 저장에 실패했습니다.");
            }
        }

        // 2. DB 업데이트 (닉네임만 변경되거나, 이미지 파일만 변경되거나, 둘 다 변경될 수 있음)
        int result = mapper.updateProfile(memberNo, nickname, profileImagePath);
        return result > 0;
    }
    
 // 실제 환경에서는 config로 빼는 게 좋음
    private static final String SERVICE_KEY = "여기에_API_KEY_입력";
    private static final String FESTIVAL_DETAIL_URL =
            "https://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=%s&MobileOS=ETC&MobileApp=Festive&_type=json&contentId=%s";
    private static final String FESTIVAL_IMAGE_URL =
            "https://apis.data.go.kr/B551011/KorService2/detailImage2?serviceKey=%s&MobileApp=Festive&MobileOS=ETC&_type=json&contentId=%s&imageYN=Y";

    @Override
    public List<MyCalendarDto> getFavoriteFestivals(Long memberNo) {
        List<String> contentIds = mapper.selectFavoriteContentIds(memberNo);

        List<MyCalendarDto> result = new ArrayList<>();
        RestTemplate restTemplate = new RestTemplate();
        ObjectMapper objectMapper = new ObjectMapper();

        for (String contentId : contentIds) {
            try {
                // 축제 상세 정보 호출 (여기서는 contentId별 호출, 병렬처리 권장)
                String url = String.format("https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=%s&MobileApp=Festive&MobileOS=ETC&_type=json&contentId=%s&defaultYN=Y&overviewYN=Y&addrinfoYN=Y", SERVICE_KEY, contentId);
                String json = restTemplate.getForObject(url, String.class);

                JsonNode root = objectMapper.readTree(json);
                JsonNode item = root.at("/response/body/items/item").get(0);

                MyCalendarDto dto = new MyCalendarDto();
                dto.setContentId(contentId);
                dto.setTitle(item.path("title").asText());
                dto.setStartDate(item.path("eventstartdate").asText().replaceAll("(\\d{4})(\\d{2})(\\d{2})", "$1-$2-$3")); // 20250101 → 2025-01-01
                dto.setEndDate(item.path("eventenddate").asText().replaceAll("(\\d{4})(\\d{2})(\\d{2})", "$1-$2-$3"));
                dto.setImageUrl(item.path("firstimage").asText());
                dto.setFirstImage(item.path("firstimage").asText());
                dto.setAddr1(item.path("addr1").asText());
                dto.setOverview(item.path("overview").asText());

                result.add(dto);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return result;
    }

    @Override
    @Transactional
    public void deleteFavoriteFestival(Long memberNo, String contentId) {
        mapper.deleteFavoriteFestival(memberNo, contentId);
    }
    

}

