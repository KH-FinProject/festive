package com.project.festive.festiveserver.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.festive.festiveserver.member.entity.Member;

public interface MemberRepository extends JpaRepository<Member, Long> {
  
  Member findByMemberNo(Long memberNo);

  Member findByEmail(String email);

  Member findByMemberName(String memberName);

  Member findByProvider(String provider);

  Member findByProviderId(String providerId);
}
