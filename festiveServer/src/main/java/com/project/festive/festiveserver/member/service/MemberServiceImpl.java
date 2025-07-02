package com.project.festive.festiveserver.member.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.festive.festiveserver.auth.repository.AuthKeyRepository;
import com.project.festive.festiveserver.member.entity.Member;
import com.project.festive.festiveserver.member.repository.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final AuthKeyRepository authKeyRepository;
    private final BCryptPasswordEncoder bcrypt;

    @Override
    public boolean isIdAvailable(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("아이디를 입력해주세요.");
        }
        if (id.length() < 4 || id.length() > 20) {
            throw new IllegalArgumentException("아이디는 4~20자여야 합니다.");
        }
        return !memberRepository.findByUserId(id).isPresent();
    }

    @Override
    public boolean isNicknameAvailable(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            throw new IllegalArgumentException("닉네임을 입력해주세요.");
        }
        if (nickname.length() < 2 || nickname.length() > 15) {
            throw new IllegalArgumentException("닉네임은 2~15자여야 합니다.");
        }
        // 한글, 영문, 숫자만 허용
        if (!nickname.matches("^[ㄱ-힣a-zA-Z0-9]+$")) {
            throw new IllegalArgumentException("닉네임은 한글, 영문자, 숫자만 사용 가능합니다.");
        }
        return !memberRepository.findByNickname(nickname).isPresent();
    }

    @Override
    public boolean isEmailAvailable(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }
        // 프론트와 동일한 정규식
        String emailRegex = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
        if (!email.matches(emailRegex)) {
            throw new IllegalArgumentException("올바른 이메일 형식으로 입력해주세요.");
        }
        return !memberRepository.findByEmail(email).isPresent();
    }

    @Override
    public int signup(Member member) {

        // 회원가입 시 기본 권한 설정
        member.setRole("USER");

        // 회원가입 시 비밀번호 암호화
        member.setPassword(bcrypt.encode(member.getPassword()));

        memberRepository.save(member);

        // 회원가입 시 인증키 삭제
        authKeyRepository.deleteByEmail(member.getEmail());

        return 1;
    }

    @Override
    public Member findByMemberNo(Long memberNo) {
        return memberRepository.findByMemberNo(memberNo);
    }

    @Override
    public Member findMemberByNameAndEmail(String name, String email) {
        return memberRepository.findByNameAndEmail(name, email).orElse(null);
    }

    @Override
    public Member findMemberByNameAndTel(String name, String tel) {
        return memberRepository.findByNameAndTel(name, tel).orElse(null);
    }

    @Override
    public Member findMemberByIdAndEmail(String id, String email) {
        return memberRepository.findByIdAndEmail(id, email).orElse(null);
    }

    @Override
    public Member findMemberById(String id) {
        return memberRepository.findByUserId(id).orElse(null);
    }

    @Override
    public void updateMember(Member member) {
        memberRepository.save(member);
    }
} 