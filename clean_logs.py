#!/usr/bin/env python3
import re

def clean_log_params(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    cleaned_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # log.info 파라미터 패턴들 감지
        # 패턴 1: 함수 호출의 파라미터들만 있는 라인
        if re.match(r'^\s+[a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_]*\(\).*[,;]\s*$', line.strip()):
            # 이런 라인은 건너뛰기
            i += 1
            continue
            
        # 패턴 2: 변수명들과 쉼표로 구성된 라인
        if re.match(r'^\s+[a-zA-Z][a-zA-Z0-9_]*,\s*[a-zA-Z][a-zA-Z0-9_]*.*[,);]\s*$', line.strip()):
            # 이런 라인은 건너뛰기
            i += 1
            continue
            
        # 패턴 3: 삼항연산자가 포함된 파라미터 라인
        if re.match(r'^\s+.*\?\s*"[^"]*"\s*:\s*"[^"]*".*[,);]\s*$', line.strip()):
            # 이런 라인은 건너뛰기
            i += 1
            continue
            
        # 패턴 4: .size() 호출이 포함된 파라미터 라인
        if re.match(r'^\s+.*\.size\(\).*[,);]\s*$', line.strip()):
            # 이런 라인은 건너뛰기
            i += 1
            continue
            
        # 패턴 5: 여러 줄에 걸친 log.info 파라미터들
        if re.match(r'^\s+[a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_]*\([^)]*\),\s*$', line.strip()):
            # 이런 라인은 건너뛰기
            i += 1
            continue
            
        # 패턴 6: .filter로 시작하는 stream 연산 라인 (잘못 제거된 것)
        if re.match(r'^\s+\.filter\(.*\)\s*//.*$', line.strip()):
            # 이런 라인은 건너뛰기
            i += 1
            continue
            
        # 패턴 7: .collect로 끝나는 stream 연산 라인
        if re.match(r'^\s+\.collect\(.*\)\)\);\s*$', line.strip()):
            # 이런 라인은 건너뛰기
            i += 1
            continue
        
        # 그 외의 라인은 유지
        cleaned_lines.append(line)
        i += 1
    
    # 파일에 다시 쓰기
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(cleaned_lines)

if __name__ == "__main__":
    file_path = "festiveServer/src/main/java/com/project/festive/festiveserver/ai/service/AITravelServiceImpl.java"
    clean_log_params(file_path)
    print("Log parameters cleaned successfully!") 