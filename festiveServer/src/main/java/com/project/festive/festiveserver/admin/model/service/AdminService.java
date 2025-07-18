package com.project.festive.festiveserver.admin.model.service;

import java.util.List;

import com.project.festive.festiveserver.admin.dto.AdminStatisticsDto;
import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.wagle.dto.BoardDto;

public interface AdminService {

	// 관리자 이메일 중복 여부 검사
	int checkEmail(String email);

	// 관리자 계정 발급
	String createAdminAccount(MemberDto member);

	/** 탈퇴 회원 조회
	 * @return
	 * @author 미애
	 */
	List<MemberDto> selectWithdrawMembers();

	/** 회원 영구삭제
	 * @param memberNoList
	 * @return
	 * @author 미애
	 */
	int deleteWithdrawMember(List<Integer> memberNoList);

	/** 탈퇴 회원 복구
	 * @param memberNoList
	 * @return
	 * @author 미애
	 */
	int updateWithdrawMember(List<Integer> memberNoList);


	/** 관리자 통계 조회
	 * @return AdminStatisticsDto
	 */
	AdminStatisticsDto getAdminStatistics();

	// 공지글 작성
	int createBoard(BoardDto boardDto);
	
	// 글 목록 조회
	List<BoardDto> getAllBoards();

	// 선택한 글 삭제
	int deleteBoard(List<Integer> boardNoList);

	/** 전체 회원 관리
	 * @return
	 * @author 미애
	 */
	List<MemberDto> selectAllMembers();

	/** 회원 로그인 제재
	 * @return
	 * @author 미애
	 * @param memberNoList 
	 */
	int updateMemberDisable(List<Integer> memberNoList);


}
