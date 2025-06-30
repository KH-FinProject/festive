package com.project.festive.festiveserver.myPage.model.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;


@Mapper
public interface MyPageMapper {
	
	 // 비밀번호 조회
	String selectPw(Long memberNo);

	// 탈퇴 처리
    int withdrawal(Long memberNo);
    
    // 비밀번호 변경
    int changePw(@Param("memberNo") Long memberNo, @Param("newEncodedPw") String newEncodedPw);
    
    // 내가 작성한 게시글 조회
    List<BoardDto> selectMyPosts(@Param("memberNo") Long memberNo);
    
    // 내가 작성한 댓글 조회
    List<CommentDto> selectMyComments(@Param("memberNo") Long memberNo);
    
    // 정보 조회
    MemberDto selectMyInfo(Long memberNo);

    // 정보 수정
    int updateMyInfo(MemberDto memberDto);
    
    // 프로필 정보 조회 (닉네임, 프로필 이미지, 이름)
    MemberDto selectProfileInfo(@Param("memberNo") Long memberNo);

    // 닉네임 중복 확인 (본인 닉네임 제외)
    Integer countByNicknameExcludeSelf(@Param("nickname") String nickname, @Param("memberNo") Long memberNo);

    // 프로필 업데이트 (닉네임, 프로필 이미지)
    int updateProfile(@Param("memberNo") Long memberNo,
            @Param("nickname") String nickname,
            @Param("profileImagePath") String profileImagePath);
    
    // 찜 목록 가져오기
    List<String> findFavoriteContentIdsByMemberNo(long memberNo);
    
    // 찜 해제하기
    void deleteFavorite(@Param("memberNo") long memberNo, @Param("contentId") String contentId);

 
}