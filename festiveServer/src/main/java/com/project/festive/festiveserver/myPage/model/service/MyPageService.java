package com.project.festive.festiveserver.myPage.model.service;

import java.util.List;
import java.util.Map;

import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.wagle.dto.BoardDto;
import com.project.festive.festiveserver.wagle.dto.CommentDto;

public interface MyPageService {

	
	/** 회원탈퇴
	 * @param memberPw
	 * @param memberNo
	 * @return
	 */
	int withdrawal(String memberPw, long memberNo);
//	
//	/** 회원 정보 수정 서비스
//	 * @param inputMember
//	 * @param memberAddress
//	 * @return
//	 */
//	int updateInfo(MemberDto inputMember, String[] memberAddress);

	/** 비밀번호 변경 서비스
	 * @param paramMap
	 * @param memberNo
	 * @return
	 */
	int changePw(Map<String, String> paramMap, int memberNo);
	
	/** 내가 작성한 게시글 조회
	 * @param memberNo
	 * @return
	 */
	List<BoardDto> getMyPosts(int memberNo);
	
	/** 내가 작성한 댓글 조회
	 * @param memberNo
	 * @return
	 */
	List<CommentDto> getMyComments(int memberNo);
	
	/** 회원 정보 조회
	 * @param memberNo
	 * @return
	 */
	MemberDto getMemberInfo(long memberNo);
	
    /**회원 정보 수정
     * @param dto
     * @return
     */
    boolean updateMemberInfo(MemberDto dto);

//	/** 파일 업로드 테스트 1
//	 * @param uploadFile
//	 * @return
//	 */
//	String fileUpload1(MultipartFile uploadFile) throws Exception;
//
//	/** 파일 업로드 테스트 2
//	 * @param uploadFile
//	 * @param memberNo
//	 * @return
//	 */
//	int fileUpload2(MultipartFile uploadFile, int memberNo) throws Exception;
//
//	/** 파일 목록 조회
//	 * @param memberNo
//	 * @return
//	 */
//	List<UploadFile> fileList(int memberNo);
//
//	/** 여러 파일 업로드 서비스
//	 * @param aaaList
//	 * @param bbbList
//	 * @param memberNo
//	 * @return
//	 */
//	int fileUpload3(List<MultipartFile> aaaList, List<MultipartFile> bbbList, int memberNo) throws Exception;
//
//	/** 프로필 이미지 수정 서비스
//	 * @param profileImg
//	 * @param loginMember
//	 * @return
//	 */
//	int profile(MultipartFile profileImg, MemberDto loginMember) throws Exception;

}
