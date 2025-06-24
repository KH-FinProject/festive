package com.project.festive.festiveserver.member.converter;

import org.springframework.stereotype.Component;

import com.project.festive.festiveserver.member.dto.MemberDto;
import com.project.festive.festiveserver.member.entity.Member;

@Component
public class MemberConverter {

  public static MemberDto toDto(Member member) {
    return MemberDto.builder()
      .memberNo(member.getMemberNo())
      .id(member.getId())
      .nickname(member.getNickname())
      .name(member.getName())
      .email(member.getEmail())
      .password(member.getPassword())
      .profileImage(member.getProfileImage())
      .socialId(member.getSocialId())
      .role(member.getRole())
      .build();
  }

  public static Member toEntity(MemberDto memberDto) {
    return Member.builder()
      .memberNo(memberDto.getMemberNo())
      .id(memberDto.getId())
      .nickname(memberDto.getNickname())
      .name(memberDto.getName())
      .email(memberDto.getEmail())
      .password(memberDto.getPassword())
      .profileImage(memberDto.getProfileImage())
      .socialId(memberDto.getSocialId())
      .role(memberDto.getRole())
      .build();
  }
}
