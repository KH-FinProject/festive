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
        
        // 주소가 입력되지 않으면
        // inputMember.getMemberAddress() -> ",,"
        // memberAddress -> [,,]
        
//        // 주소가 입력된 경우
//        if(!member.getAddress().equals(",,")) {
//
//            // String.join("구분자", 배열)
//            // -> 배열의 모든 요소 사이에 "구분자"를 추가하여
//            // 하나의 문자열로 만들어 반환하는 메서드
//            String address = String.join("^^^", member.getAddress());
//            // [12345, 서우시 중구 남대문로, 3층, E강의장]
//            // -> "12345^^^서울시 중구 남대문로^^^3층, E강의장"
//
//            // 구분자로 "^^^" 쓴 이유 :
//            // -> 주소, 상세주소에 안 쓰일 것같은 특수문자 작성
//            // -> 나중에 마이페이지에서 주소 부분 수정시
//            // -> DB에 저장된 기존 주소를 화면상에 출력해줘야함
//            // -> 다시 3분할 해야 할 때 구분자로 ^^^ 이용할 예정
//            // -> 왜? 구분자가 기본 형태인 , 작성되어있으면
//            // -> 주소, 상세주소에 , 가 들어오는 경우
//            // -> 3분할이 아니라 N분할이 될 수 있기 때문에
//
//            // inputMember의 memberAddress로 합쳐진 주소를 세팅
//            inputMember.setMemberAddress(address);
//
//        } else {
//            // 주소가 입력되지 않은 경우
//            inputMember.setMemberAddress(null); // null로 저장
//        }

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
} 