package com.project.festive.festiveserver.auth.entity;

import java.time.LocalDateTime;

import com.project.festive.festiveserver.member.entity.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "REFRESH_TOKEN")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

	@Id
	@Column(name = "MEMBER_NO")
	private Long memberNo;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "MEMBER_NO", insertable = false, updatable = false)
	private Member member;

	@Column(name = "REFRESH_TOKEN", nullable = false, length = 500)
	private String token;

	@Column(name = "EXPIRATION_DATE", nullable = false)
	private LocalDateTime expirationDate;

	// 수정 메서드
	public void update(String token, LocalDateTime expirationDate) {
		this.token = token;
		this.expirationDate = expirationDate;
	}
}
