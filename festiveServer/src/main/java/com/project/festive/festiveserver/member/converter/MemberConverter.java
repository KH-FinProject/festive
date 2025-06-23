package com.project.festive.festiveserver.member.converter;

import org.springframework.stereotype.Component;

import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.member.entity.Member;

@Component
public class MemberConverter {

  public static MemberDto toDto(Member member) {
    return MemberDto.builder()
      .memberNo(member.getMemberNo())
      .memberName(member.getMemberName())
      .email(member.getEmail())
      .socialId(member.getSocialId())
      .role(member.getRole())
      .build();
  }

  public static Member toEntity(MemberDto memberDto) {
    return Member.builder()
      .memberNo(memberDto.getMemberNo())
      .memberName(memberDto.getMemberName())
      .email(memberDto.getEmail())
      .socialId(memberDto.getSocialId())
      .role(memberDto.getRole())
      .build();
  }
}
