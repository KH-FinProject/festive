package com.project.festive.festiveserver.myPage.model.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;

@Mapper
public interface MyPageMapper {
	
//	/** 회원 정보 수정
//	 * @param inputMember
//	 * @return
//	 */
//	int updateInfo(MemberDto inputMember);

	/** 로그인한 회원의 암호화 비밀번호 조회
	 * @param memberNo
	 * @return
	 */
	String selectPw(long memberNo);
	
	/** 회원 비밀번호 변경
	 * @param paramMap
	 * @return
	 */
	int changePw(Map<String, String> paramMap);

	/** 회원탈퇴
	 * @param memberNo
	 * @return
	 */
	int withdrawal(long memberNo);
	
	/** 내가 작성한 게시글 조회
	 * @param memberNo
	 * @return
	 */
	List<BoardDto> selectMyPosts(int memberNo);
	
	/** 내가 작성한 댓글 조회
	 * @param memberNo
	 * @return
	 */
	List<CommentDto> selectMyComments(int memberNo);
	

	/** 내 정보 수정
	 * @param dto
	 * @return
	 */
	int updateMemberInfo(MemberDto dto);
	
    /** 내 정보 조회
     * @param memberNo
     * @return
     */
    MemberDto selectMemberInfo(long memberNo);
	
//	/** 파일 정보를 DB에 삽입
//	 * @param uf
//	 * @return
//	 */
//	int insertUploadFile(UploadFile uf);
//
//	/** 파일 목록 조회
//	 * @param memberNo
//	 * @return
//	 */
//	List<UploadFile> fileList(int memberNo);
//
//	/** 프로필 이미지 변경
//	 * @param member
//	 * @return
//	 */
//	int profile(MemberDto member);

}
