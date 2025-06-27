package com.project.festive.festiveserver.myPage.model.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.festive.festiveserver.member.dto.MemberDto;
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

    @Override
    public boolean updateMyInfo(Long memberNo, MemberDto updatedInfo) {
        // 현재 비밀번호 조회
        String currentEncodedPw = mapper.selectPw(memberNo);

        if (!passwordEncoder.matches(updatedInfo.getPassword(), currentEncodedPw)) {
            return false;
        }

        // 비밀번호 일치 시 정보 수정
        updatedInfo.setMemberNo(memberNo);
        mapper.updateMyInfo(updatedInfo);
        return true;
    }



}
