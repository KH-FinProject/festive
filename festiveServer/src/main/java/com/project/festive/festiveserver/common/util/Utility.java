package com.project.festive.festiveserver.common.util;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.UUID;

// 프로그램 전체적으로 사용될 유용한 기능 모음
public class Utility {
	
	public static int seqNum = 1; // 1~99999 반복
	
	private static final String CHARACTERS 
	= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	private static final int CODE_LENGTH = 6;
	
	// 매개변수로 전달받은 원본명으로 파일의 변경명을 만들어 반환 메소드
	public static String fileRename(String originalFileName) {
		// 20250424150830_00001.jpg
		
		// SimpleDateFormat : 시간을 원하는 형태의 문자열로 간단히 변경
		SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
		
		// java.util.Date() : 현재 시간을 저장한 자바 객체
		String date = sdf.format(new Date());
		
		String number = String.format("%05d", seqNum);
		
		seqNum++; // 1 증가
		if(seqNum == 100000) seqNum = 1;
		
		// 확장자 구하기
		// "문자열.substring(인덱스)
		// - 문자열을 인덱스부터 끝까지 잘라낸 결과 반환
		
		// "문자열".lastIndexOf(".")
		// - 문자열에서 마지막 "."의 인덱스 반환
		
		String ext = originalFileName.substring(originalFileName.lastIndexOf("."));
		
		// originalFileName == 짱구.jpg
		// ext == .jpg
		
		return date + "_" + number + ext;
	}
	
	// 랜덤 비밀번호 발급 메서드(관리자용)
	public static String generatePassword() {
		
		SecureRandom random = new SecureRandom();
		// SecureRandom : 난수를 생성하기 위한 클래스로,
		//				  보안적으로 더 강력한 랜덤 값 생성
		// 일반적인 Random보다 예측 가능성이 낮아,
		// 민감한 데이터(암호 생성)와 같은 곳에 적합함.
		
		StringBuilder randomCode = new StringBuilder(CODE_LENGTH);
		// 길이 6을 초기 용량으로 갖는 StringBuilder 객체 생성
		
		for(int i=0; i<CODE_LENGTH; i++) {
			int index = random.nextInt(CHARACTERS.length()); // CHARACTERS의 길이(62)
			// random.nextInt(62)는 0부터 61사이의 난수 생성
			
			randomCode.append(CHARACTERS.charAt(index));
			// CHARACTERS 문자열에 index 위치에 있는 문자 반환
			// ex) index가 0이면 'A', index가 61이면 '9'를 반환
			// 반환받은 값을 randomCode에 누적
			
		}
		
		return randomCode.toString();
		
	}

	public static String downloadImageToServer(String imageUrl, String saveDir) throws IOException {
		// 1. URL에서 확장자 추출 (없으면 .jpg 기본)
		String extension = ".jpg";
		String path = URI.create(imageUrl).getPath();
		int lastDot = path.lastIndexOf('.');
		if (lastDot != -1 && lastDot < path.length() - 1) {
			extension = path.substring(lastDot);
			// 확장자에 쿼리스트링이 붙어있으면 제거
			int qIdx = extension.indexOf('?');
			if (qIdx != -1) extension = extension.substring(0, qIdx);
		}

		// 2. UUID로 파일명 생성
		String fileName = UUID.randomUUID().toString() + extension;

		// 3. 저장 디렉토리 생성
		File dir = new File(saveDir);
		if (!dir.exists()) dir.mkdirs();

		// 4. 파일 저장
		File file = new File(dir, fileName);
		try (InputStream in = URI.create(imageUrl).toURL().openStream();
			 OutputStream out = new FileOutputStream(file)) {
			byte[] buffer = new byte[8192];
			int bytesRead;
			while ((bytesRead = in.read(buffer)) != -1) {
				out.write(buffer, 0, bytesRead);
			}
		}
		return file.getAbsolutePath();
	}
}
