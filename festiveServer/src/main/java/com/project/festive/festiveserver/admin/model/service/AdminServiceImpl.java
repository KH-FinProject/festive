package com.project.festive.festiveserver.admin.model.service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.festive.festiveserver.admin.dto.AdminStatisticsDto;
import com.project.festive.festiveserver.admin.model.mapper.AdminMapper;
import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.wagle.dto.BoardDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService{
	
	private final AdminMapper mapper;
	private final BCryptPasswordEncoder bcrypt;

	
	// 관리자 이메일 중복 검사
	@Override
	public int checkEmail(String email) {
		return mapper.checkEmail(email);
	}

	// 관리자 이메일 발급
	@Override
	public String createAdminAccount(MemberDto member) {
	    // 1. 영어(대소문자) 6자리 난수로 만든 비밀번호를 암호화한 값 구하기
	    String rawPw = generateRandomPassword(4); // 평문 비번

	    // 2. 평문 비밀번호를 암호화하여 저장
	    String encPw = bcrypt.encode(rawPw);

	    // 3. member에 암호화된 비밀번호 세팅
	    member.setPassword(encPw);

	    // 4. DB에 암호화된 비밀번호가 세팅된 member를 전달하여 계정 발급
	    int result = mapper.createAdminAccount(member);

	    // 5. 계정 발급 정상처리 되었다면, 발급된(평문) 비밀번호 리턴
	    return result > 0 ? rawPw : null;
	}

	/**
	 * 대소문자 영어 6자리 난수 비밀번호 생성
	 */
	private String generateRandomPassword(int length) {
	    String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	    StringBuilder password = new StringBuilder(length);
	    for (int i = 0; i < length; i++) {
	        int index = (int) (Math.random() * characters.length());
	        password.append(characters.charAt(index));
	    }
	    return password.toString();
	}

	// 탈퇴 회원 조회 by 미애
	@Override
	public List<MemberDto> selectWithdrawMembers() {
		
		List<MemberDto> result = mapper.selectWithdrawMembers();
		
		return result;
	}

	// 회원 영구 삭제 by 미애
	@Override
	public int deleteWithdrawMember(List<Integer> memberNoList) {
		
		int result = 0;
		int deleteMember = 0;
		
		for (int memberNo : memberNoList) {
			
			deleteMember = mapper.deleteWithdrawMember(memberNo);
			
			if(deleteMember > 0) {
				result ++;
			} else {
				log.debug("멤버 삭제 실패 : " + memberNo);
			}
		}
		
		return result;
	}

	// 탈퇴 회원 복구 by 미애
	@Override
	public int updateWithdrawMember(List<Integer> memberNoList) {
		int result = 0;
		int updateMember = 0;
		
		for (int memberNo : memberNoList) {
			updateMember = mapper.updateWithdrawMember(memberNo);
			
			if(updateMember > 0) {
				result ++;
			} else {
				log.debug("멤버 복구 실패 : " + memberNo);
			}
		}
		
		return result;
	}

	// 관리자 통계 조회
	@Override
	public AdminStatisticsDto getAdminStatistics() {
		try {
			// 전체 통계 정보 조회 (실제 DB 데이터)
			log.info("=== 관리자 통계 조회 시작 ===");
			int totalMembers = mapper.getTotalMembers();
			log.info("전체 회원 수: {}", totalMembers);
			
			int activeMembers = mapper.getActiveMembers();
			log.info("활동 회원 수: {}", activeMembers);
			
			int withdrawMembers = mapper.getWithdrawMembers();
			log.info("탈퇴 회원 수: {}", withdrawMembers);
			
			// 실제 DB 데이터 조회 시도
			int weeklyNewMembers;
			int weeklyWithdrawMembers;
			int returnMembers;
			List<Map<String, Object>> dailyNewMembersData;
			List<Map<String, Object>> dailyWithdrawMembersData;
			
			// 실제 DB 통계 조회 (더미데이터 제거)
			log.info("상세 통계 조회 시작");
			weeklyNewMembers = mapper.getWeeklyNewMembers();
			log.info("주간 신규 회원 수: {}", weeklyNewMembers);
			
			weeklyWithdrawMembers = mapper.getWeeklyWithdrawMembers();
			log.info("주간 탈퇴 회원 수: {}", weeklyWithdrawMembers);
			
			returnMembers = mapper.getReturnMembers();
			log.info("전체 활성 회원 수: {}", returnMembers);
			
			dailyNewMembersData = mapper.getDailyNewMembers();
			log.info("일별 신규 회원 데이터: {}", dailyNewMembersData);
			
			dailyWithdrawMembersData = mapper.getDailyWithdrawMembers();
			log.info("일별 탈퇴 회원 데이터: {}", dailyWithdrawMembersData);
			
			// 일별 활동 회원 데이터 추가
			List<Map<String, Object>> dailyActiveMembersData = mapper.getDailyActiveMembers();
			log.info("일별 활동 회원 데이터: {}", dailyActiveMembersData);
			
			// 7일 전까지의 기준 회원 수 조회 (누적 계산용)
			int baseMembersCount = mapper.getBaseMembersCount();
			log.info("7일 전까지의 기준 회원 수: {}", baseMembersCount);
			
			log.info("실제 DB 통계 조회 완료");
			
			// 일별 통계 데이터 변환
			List<AdminStatisticsDto.DailyStatistics> dailyStatistics = new ArrayList<>();
			
			// 누적 회원 수 계산을 위한 변수
			int cumulativeMembersCount = baseMembersCount;
			
			// 최근 7일간의 데이터를 생성
			for (int i = 6; i >= 0; i--) {
				LocalDate date = LocalDate.now().minusDays(i);
				String dateString = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
				
				// 해당 날짜의 신규 회원 수 찾기
				int newMembers = 0;
				for (Map<String, Object> data : dailyNewMembersData) {
					if (dateString.equals(data.get("ENROLL_DATE_STR"))) {
						newMembers = ((Number) data.get("NEW_MEMBERS")).intValue();
						break;
					}
				}
				
				// 해당 날짜의 탈퇴 회원 수 찾기
				int withdrawMembersCount = 0;
				for (Map<String, Object> data : dailyWithdrawMembersData) {
					if (dateString.equals(data.get("WITHDRAW_DATE_STR"))) {
						withdrawMembersCount = ((Number) data.get("WITHDRAW_MEMBERS")).intValue();
						break;
					}
				}
				
				// 해당 날짜의 활동 회원 수 찾기
				int activeMembersCount = 0;
				for (Map<String, Object> data : dailyActiveMembersData) {
					if (dateString.equals(data.get("ACTIVITY_DATE_STR"))) {
						activeMembersCount = ((Number) data.get("ACTIVE_MEMBERS")).intValue();
						break;
					}
				}
				
				// 해당 날짜의 누적 회원 수 계산 (신규 가입자 +, 탈퇴자 -)
				cumulativeMembersCount += newMembers - withdrawMembersCount;
				
				// 실제 날짜 표시 (yyyy-MM-dd 형식)
				String dayName = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
				
				AdminStatisticsDto.DailyStatistics dailyStat = AdminStatisticsDto.DailyStatistics.builder()
					.date(date)
					.dayName(dayName)
					.newMembers(newMembers)
					.withdrawMembers(withdrawMembersCount)
					.activeMembers(activeMembersCount)
					.returnMembers(cumulativeMembersCount)  // 누적 회원 수 사용
					.build();
				
				dailyStatistics.add(dailyStat);
			}
			
			// 전체 통계 DTO 생성
			AdminStatisticsDto statistics = AdminStatisticsDto.builder()
				.totalMembers(totalMembers)
				.activeMembers(activeMembers)
				.withdrawMembers(withdrawMembers)
				.weeklyNewMembers(weeklyNewMembers)
				.weeklyWithdrawMembers(weeklyWithdrawMembers)
				.returnMembers(returnMembers)  // returnMembers 추가
				.dailyStatistics(dailyStatistics)
				.build();
			
			log.info("통계 DTO 생성 완료: totalMembers={}, activeMembers={}, returnMembers={}", 
					totalMembers, activeMembers, returnMembers);
			
			return statistics;
			
		} catch (Exception e) {
			log.error("관리자 통계 조회 중 오류 발생", e);
			throw new RuntimeException("통계 조회 중 오류 발생", e);
		}
	}

	// 공지글 작성 by 지현
	@Override
	public int createBoard(BoardDto boardDto) {
		try {
            boardDto.setBoardCreateDate(LocalDateTime.now());
            boardDto.setBoardDeleteYn("N");
            return mapper.insertBoard(boardDto);
        } catch (Exception e) {
            log.error("게시글 작성 중 오류 발생", e);
            throw new RuntimeException("게시글 작성에 실패했습니다.");
        }
	}
	
	// 게시글 조회 by 지현
	@Override
    public List<BoardDto> getAllBoards() {
        return mapper.selectAllBoards();
    }

	// 선택한 글 삭제 by 지현
	@Override
	public int deleteBoard(List<Integer> boardNoList) {
		int result = 0;
		int deleteBoard = 0;
		
		for (int boardNo : boardNoList) {
			
			deleteBoard = mapper.deleteBoard(boardNo);
			
			if(deleteBoard > 0) {
				result ++;
			} else {
				log.debug("게시글 삭제 실패 : " + boardNo);
			}
		}
		
		return result;

	}

	// 전체 회원 관리
	@Override
	public List<MemberDto> selectAllMembers() {
		// TODO Auto-generated method stub
		return mapper.selectAllMembers();
	}

	// 회원 로그인 제재
	@Override
	public int updateMemberDisable(List<Integer> memberNoList) {
		int result = 0;
		int updateMember = 0;
		Map<String, Integer> disableMap = new HashMap<>();
		
		for (int memberNo : memberNoList) {
			// 사용자의 제재 횟수를 불러옴
			int sactionCount = mapper.getSantionCount(memberNo);
			disableMap.put("memberNo", memberNo);
			if(sactionCount<3) {
				// 제재 횟수가 3보다 작을경우(정상 로그인 가능)
				// 3을 넣어서 로그인 불가능하도록 함
				disableMap.put("sanctionCount", 3);
			} else {
				// 제재 횟수가 3 이상일 경우 (로그인 제재 상태)
				// 0으로 변경하여 해당 사용자 로그인 할 수 있게 함
				disableMap.put("sanctionCount", 0);
			}
			updateMember = mapper.updateMemberDisable(disableMap);
			
			if(updateMember > 0) {
				result ++;
			} else {
				log.debug("회원 로그인 제재 실패 : " + memberNo);
			}
		}
		
		return result;
	}



}
