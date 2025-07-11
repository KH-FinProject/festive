package com.project.festive.festiveserver.auth.entity;

import java.time.LocalDateTime;

import com.project.festive.festiveserver.member.entity.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "REFRESH_TOKEN", indexes = {
    @Index(name = "idx_refresh_token_expiration", columnList = "EXPIRATION_DATE")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

	@Id
	@Column(name = "MEMBER_NO")
	private Long memberNo;

	@Column(name = "REFRESH_TOKEN", nullable = false, length = 500)
	private String refreshToken;

	@Column(name = "EXPIRATION_DATE", nullable = false)
	private LocalDateTime expirationDate;

	@OneToOne(fetch = FetchType.LAZY)
	@MapsId
	@JoinColumn(name = "MEMBER_NO")
	private Member member;

	public void update(String refreshToken, LocalDateTime expirationDate) {
		this.refreshToken = refreshToken;
		this.expirationDate = expirationDate;
	}
}
