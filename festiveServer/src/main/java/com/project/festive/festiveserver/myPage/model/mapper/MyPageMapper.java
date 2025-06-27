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


}
