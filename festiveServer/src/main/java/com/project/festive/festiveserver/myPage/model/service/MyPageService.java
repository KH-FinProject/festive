package com.project.festive.festiveserver.myPage.model.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.myPage.dto.MyCalendarDto;
import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;

public interface MyPageService {

   
   //회원 탈퇴
   boolean withdraw(Long memberNo, String password);
   
   // 비밀번호 변경
   boolean changePw(Long memberNo, String currentPw, String newPw);
   
   // 내가 작성한 게시글 조회
   List<BoardDto> getMyPosts(Long memberNo);
   
   // 내가 작성한 댓글 조회
   List<CommentDto> getMyComments(Long memberNo);
   
   // 정보 조회
    MemberDto getMyInfo(Long memberNo);
    
    // 정보 수정
    boolean updateMyInfo(Long memberNo, MemberDto updatedInfo);
    
    // 프로필 정보 조회
    MemberDto getProfileInfo(Long memberNo);

    // 닉네임 중복 확인 (본인 닉네임 제외)
    boolean checkNicknameDuplicate(String nickname, Long memberNo);

    // 프로필 업데이트 (닉네임, 프로필 이미지)
    boolean updateProfile(Long memberNo, String nickname, MultipartFile profileImageFile);

    // 현재 비밀번호 확인(비밀번호 변경 창)
    boolean checkPassword(Long memberNo, String rawPassword);
    
    // 회원이 찜한 축제 목록의 상세 정보를 조회
    List<MyCalendarDto> getFavoriteFestivals(long memberNo);

     // 축제 찜 해제
    void removeFavorite(long memberNo, String contentId);
    
    // 기본 이미지로 변경
    boolean resetProfileImage(Long memberNo);
}
