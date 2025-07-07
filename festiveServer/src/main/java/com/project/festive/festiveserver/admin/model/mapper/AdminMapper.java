package com.project.festive.festiveserver.admin.model.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.wagle.dto.BoardDto;

@Mapper
public interface AdminMapper {

	// 관리자 이메일 중복 검사
	int checkEmail(String email);

	// 관리자 계정 발급
	int createAdminAccount(MemberDto member);

	/** 탈퇴 회원 조회
	 * @return
	 * @author 미애
	 */
	List<MemberDto> selectWithdrawMembers();

	/** 회원 영구 삭제
	 * @param memberNo
	 * @return
	 * @author 미애
	 */
	int deleteWithdrawMember(int memberNo);

	/** 탈퇴 회원 복구
	 * @param memberNo
	 * @return
	 * @author 미애
	 */
	int updateWithdrawMember(int memberNo);
	
	// 공지글 작성 by 지현
    int insertBoard(BoardDto boardDto);
    
    // 게시글 조회 by 지현
    List<BoardDto> selectAllBoards();

    // 게시글 삭제 by 지현
	int deleteBoard(int boardNo);

}
