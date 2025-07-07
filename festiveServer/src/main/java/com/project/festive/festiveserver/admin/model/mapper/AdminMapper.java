package com.project.festive.festiveserver.admin.model.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import com.project.festive.festiveserver.member.dto.MemberDto;

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

	// 통계 조회 메서드들
	/** 전체 회원 수 조회 */
	int getTotalMembers();
	
	/** 활성 회원 수 조회 */
	int getActiveMembers();
	
	/** 탈퇴 회원 수 조회 */
	int getWithdrawMembers();
	
	/** 최근 일주일 신규 회원 수 조회 */
	int getWeeklyNewMembers();
	
	/** 최근 일주일 탈퇴 회원 수 조회 */
	int getWeeklyWithdrawMembers();
	
	/** 일별 신규 회원 수 조회 (최근 일주일) */
	List<Map<String, Object>> getDailyNewMembers();
	
	/** 일별 탈퇴 회원 수 조회 (최근 일주일) */
	List<Map<String, Object>> getDailyWithdrawMembers();
	
	/** 일별 활동 회원 수 조회 (게시글/댓글 활동이 있는 회원) */
	List<Map<String, Object>> getDailyActiveMembers();
	
	/** 재방문 회원 수 조회 (가입 후 7일 이상 된 활성 회원) */
	int getReturnMembers();

}
