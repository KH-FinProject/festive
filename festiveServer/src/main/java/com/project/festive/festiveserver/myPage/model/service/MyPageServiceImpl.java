package com.project.festive.festiveserver.myPage.model.service;

import java.io.File;
import java.io.IOException;
import java.net.URI;
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
    
    @Autowired    
    private final RestTemplate restTemplate; // 외부 API 호출을 위한 RestTemplate
    private final ObjectMapper objectMapper; // JSON 파싱을 위한 ObjectMapper

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
    
    @Override
    public List<MyCalendarDto> getFavoriteFestivals(long memberNo) {
        // 1. DB에서 해당 회원이 찜한 모든 contentId 목록을 가져온다.
        List<String> contentIds = mapper.selectContentIdsByMemberNo(memberNo);
        
        log.info("서비스임플에서 contentIds : "+ contentIds);

        if (contentIds.isEmpty()) {
            return new ArrayList<>(); // 찜한 축제가 없으면 빈 리스트 반환
        }
        
        List<MyCalendarDto> festivalDetails = new ArrayList<>();
        
        // 2. 각 contentId에 대해 TourAPI를 호출하여 상세 정보를 가져온다.
        for (String contentId : contentIds) {
            try {
                String apiUrl = "https://apis.data.go.kr/B551011/KorService2/searchFestival2";
                URI uri = UriComponentsBuilder.fromHttpUrl(apiUrl)
                        .queryParam("serviceKey", serviceKey)
                        .queryParam("MobileOS", "ETC")
                        .queryParam("MobileApp", "Festive")
                        .queryParam("_type", "json")
                        .queryParam("contentId", contentId)
                        .queryParam("defaultYN", "Y") // 기본정보 조회
                        .queryParam("firstImageYN", "Y") // 대표이미지 조회
                        .queryParam("areacodeYN", "Y") // 지역코드 조회
                        .queryParam("catcodeYN", "Y") // 서비스분류코드 조회
                        .queryParam("addrinfoYN", "Y") // 주소 조회
                        .queryParam("mapinfoYN", "Y") // 좌표 조회
                        .queryParam("overviewYN", "Y") // 개요 조회
                        .build(true)
                        .toUri();

                String response = restTemplate.getForObject(uri, String.class);

                // 3. API 응답(JSON)을 파싱하여 필요한 정보만 추출한다.
                JsonNode root = objectMapper.readTree(response);
                JsonNode item = root.path("response").path("body").path("items").path("item").get(0);
                
                if (item != null && !item.isMissingNode()) {
                    // TourAPI의 eventstartdate, eventenddate는 축제(15) 타입에만 존재
                    // detailIntro API를 함께 사용하거나, searchFestival에서 날짜 정보를 가져와야 함.
                    // 여기서는 searchFestival2 API를 기준으로 startDate, endDate 필드를 가져온다고 가정
                    // 하지만 detailCommon2에는 날짜 정보가 없으므로, searchFestival2를 다시 호출해야 합니다.
                    // 더 나은 방법: 찜할 때 날짜 정보도 함께 저장하거나, 별도의 API 호출 로직 구성.
                    // 여기서는 임시로 searchFestival2를 다시 호출하는 로직을 추가합니다. (비효율적일 수 있음)
                    
                   MyCalendarDto detail = getFestivalDates(contentId); // 날짜 정보 가져오는 별도 메서드 호출
                    detail.setContentId(contentId);
                    detail.setTitle(item.path("title").asText());
                    // detail.setStartDate(...) 와 detail.setEndDate(...) 는 getFestivalDates에서 채워짐
                    
                    festivalDetails.add(detail);
                }

            } catch (Exception e) {
                // 특정 contentId 조회 실패 시 로그를 남기고 계속 진행
                System.err.println("Error fetching details for contentId " + contentId + ": " + e.getMessage());
            }
        }
        
        return festivalDetails;
    }

    // detailCommon2에는 날짜 정보가 없으므로, searchFestival2 API를 사용하여 날짜를 가져오는 헬퍼 메서드
    private MyCalendarDto getFestivalDates(String contentId) throws Exception {
         // 실제로는 contentId로 특정 축제 하나만 검색하는 기능이 TourAPI에 마땅치 않습니다.
         // 가장 좋은 방법은 사용자가 축제를 '찜'할 때, 해당 축제의 시작일과 종료일을 FAVORITES 테이블 또는
         // 별도의 테이블에 함께 저장하는 것입니다.
         // 아래는 contentId가 제목에 포함된 축제를 검색하는 임시방편의 코드입니다.
         
         // **권장사항**: 찜 할 때 축제명, 시작일, 종료일을 DB에 같이 저장하세요!
         // ALTER TABLE FAVORITES ADD (TITLE VARCHAR2(255), START_DATE VARCHAR2(8), END_DATE VARCHAR2(8));
         // 이렇게 하면 아래의 불필요한 API 호출을 모두 제거하고 DB 조회만으로 해결 가능합니다.
         
         // 아래는 임시 코드입니다.
       MyCalendarDto dto = new MyCalendarDto();
         // ... TourAPI (searchFestival2) 호출하여 contentId에 해당하는 축제 날짜 정보 조회 로직 ...
         // 예시로 임의의 값을 넣겠습니다.
         dto.setStartDate("20250701"); // YYYYMMDD
         dto.setEndDate("20250710"); // YYYYMMDD
         return dto;
    }


    @Override
    public void removeFavorite(long memberNo, String contentId) {
        mapper.deleteFavorite(memberNo, contentId);
    }
    

}
