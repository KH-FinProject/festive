package com.project.festive.festiveserver.member.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.project.festive.festiveserver.member.entity.Member;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

	Member findByMemberNo(Long memberNo);

	@Query("SELECT m FROM Member m WHERE m.id = :id")
	Optional<Member> findByUserId(@Param("id") String id);

	@Query("SELECT m FROM Member m WHERE m.id = :id AND m.memberDelFl = 'N'")
	Optional<Member> findByUserIdAndNotDeleted(@Param("id") String id);

	Optional<Member> findByEmail(String email);

	Optional<Member> findByNickname(String nickname);

	Member findBySocialId(String socialId);

	@Modifying
	@Query("UPDATE Member m SET m.password = :newPassword WHERE m.memberNo = :memberNo")
	int updatePasswordByMemberNo(@Param("memberNo") Long memberNo, @Param("newPassword") String newPassword);

	Optional<Member> findByNameAndEmail(String name, String email);
	Optional<Member> findByNameAndTel(String name, String tel);

	Optional<Member> findByIdAndEmail(String id, String email);
}
