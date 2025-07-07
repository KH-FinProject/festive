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
      .enrollDate(member.getEnrollDate() != null ? member.getEnrollDate().toString() : null)
      .withdrawDate(member.getWithdrawDate() != null ? member.getWithdrawDate().toString() : null)
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
      .enrollDate(memberDto.getEnrollDate() != null ? java.time.LocalDateTime.parse(memberDto.getEnrollDate()) : null)
      .withdrawDate(memberDto.getWithdrawDate() != null ? java.time.LocalDateTime.parse(memberDto.getWithdrawDate()) : null)
      .build();
  }
}
