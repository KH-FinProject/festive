package com.project.festive.festiveserver.myPage.model.service;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.myPage.dto.MyCalendarDto;
import com.project.festive.festiveserver.myPage.model.mapper.MyPageMapper;
import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
@Slf4j
public class MyPageServiceImpl implements MyPageService {
	
	private final MyPageMapper mapper;
    private final PasswordEncoder passwordEncoder;
    @Value("${file.upload-dir}") // 설정 파일에서 경로를 주입받음
    private String uploadDir;
    
    @Autowired
    private final RestTemplate restTemplate; // Bean으로 등록하여 사용
    private final ObjectMapper objectMapper; // Bean으로 등록하여 사용

    @Value("${tour.api.service-key:}")
    private String serviceKey;


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
    
    
    
    
    
    
    private MyCalendarDto fetchFestivalDetails(String contentId) {
        String tourApiUrl = "http://api.visitkorea.or.kr/openapi/service/rest/KorService1/detailCommon1";

        URI uri = UriComponentsBuilder.fromHttpUrl(tourApiUrl)
                .queryParam("ServiceKey", serviceKey)
                .queryParam("contentId", contentId)
                .queryParam("defaultYN", "Y")
                .queryParam("firstImageYN", "Y")
                .queryParam("addrinfoYN", "Y")
                .queryParam("overviewYN", "Y")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "AppTest")
                .queryParam("_type", "json")
                .build(true)
                .toUri();

        try {
            // API 호출 전 로그 추가
            log.info("Requesting TourAPI for contentId: {}", contentId);
            log.debug("Request URI: {}", uri);

            String response = restTemplate.getForObject(uri, String.class);
            // API 응답 로그 추가
            log.debug("Response from TourAPI for contentId {}: {}", contentId, response);

            JsonNode root = objectMapper.readTree(response);
            JsonNode item = root.path("response").path("body").path("items").path("item");

            if (item.isMissingNode() || item.isEmpty()) { // item이 비어있는 경우도 체크
                log.warn("No item found in TourAPI response for contentId: {}", contentId);
                return null;
            }

            // 날짜 파싱 포맷터
            DateTimeFormatter apiFormatter = DateTimeFormatter.ofPattern("yyyyMMdd");
            DateTimeFormatter dbFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

            String startDateStr = item.path("eventstartdate").asText(null); // 날짜가 없을 경우 null 반환
            String endDateStr = item.path("eventenddate").asText(null);   // 날짜가 없을 경우 null 반환

            // 시작일 또는 종료일이 없는 경우, 해당 축제는 캘린더에 추가하지 않음
            if (startDateStr == null || endDateStr == null) {
                log.warn("Start date or end date is missing for contentId: {}. Skipping.", contentId);
                return null;
            }

            LocalDate startDate = LocalDate.parse(startDateStr, apiFormatter);
            LocalDate endDate = LocalDate.parse(endDateStr, apiFormatter);

            return new MyCalendarDto(
                    item.path("contentid").asText(),
                    item.path("title").asText(),
                    startDate.format(dbFormatter),
                    endDate.format(dbFormatter),
                    item.path("firstimage").asText(null) // 이미지가 없을 수 있으므로 null 처리
            );
        } catch (Exception e) {
            // 어떤 contentId에서 오류가 발생했는지 명확하게 로그 기록
            log.error("Failed to fetch or parse festival details for contentId: {}. Error: {}", contentId, e.getMessage(), e);
            return null; // 오류 발생 시 null을 반환하여 다른 축제 정보 처리에 영향 없도록 함
        }
    }

    @Override
    public List<MyCalendarDto> getFavoriteFestivals(long memberNo) {
        List<String> contentIds = mapper.findFavoriteContentIdsByMemberNo(memberNo);

        if (contentIds == null || contentIds.isEmpty()) {
            return new ArrayList<>();
        }

        return contentIds.stream()
                .map(this::fetchFestivalDetails)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void removeFavorite(long memberNo, String contentId) {
        mapper.deleteFavorite(memberNo, contentId);
    }

   



}
