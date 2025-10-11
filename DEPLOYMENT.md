# 🚀 배포 가이드

## GitHub 저장소 생성 및 푸시

### 1. GitHub에서 새 저장소 생성
1. [GitHub](https://github.com)에 로그인
2. "New repository" 클릭
3. 저장소 정보 입력:
   - **Repository name**: `golden-keyword-finder`
   - **Description**: `🎯 네이버 검색 데이터를 활용하여 황금키워드를 발굴하는 도구`
   - **Public** 선택
   - **README, .gitignore, license 추가하지 않음** (이미 있음)

### 2. 로컬 저장소와 연결
```bash
# 원격 저장소 추가 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/golden-keyword-finder.git

# 기본 브랜치를 main으로 변경
git branch -M main

# GitHub에 푸시
git push -u origin main
```

## Vercel 배포

### 1. Vercel 계정 생성
1. [Vercel](https://vercel.com)에 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭

### 2. 프로젝트 연결
1. GitHub 저장소에서 `golden-keyword-finder` 선택
2. Framework Preset: **Next.js** 자동 감지
3. Root Directory: `./` (기본값)
4. Build Command: `npm run build` (기본값)
5. Output Directory: `.next` (기본값)
6. Install Command: `npm install` (기본값)

### 3. 환경변수 설정
Vercel 대시보드에서 다음 환경변수들을 설정:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 네이버 검색광고 API
SEARCHAD_API_KEY=your_access_license
SEARCHAD_SECRET=your_secret_key
SEARCHAD_CUSTOMER_ID=your_customer_id
SEARCHAD_BASE_URL=https://api.naver.com

# 네이버 오픈 API
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
NAVER_OPENAPI_BASE_URL=https://openapi.naver.com
```

### 4. 배포 실행
1. "Deploy" 버튼 클릭
2. 배포 완료 후 제공되는 URL로 접속

## Supabase 설정

### 1. 프로젝트 생성
1. [Supabase](https://supabase.com)에 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력 후 생성

### 2. 데이터베이스 스키마 설정
1. Supabase 대시보드 → SQL Editor
2. `supabase-schema.sql` 파일의 내용을 복사하여 실행
3. API Settings에서 URL과 anon key 복사

## 네이버 API 설정

### 1. 검색광고 API
1. [네이버 검색광고](https://searchad.naver.com) 계정 생성
2. API 사용 신청 및 키 발급
3. 발급받은 키를 환경변수에 설정

### 2. 오픈 API
1. [네이버 개발자센터](https://developers.naver.com)에서 애플리케이션 등록
2. 검색 API 사용 신청
3. 발급받은 Client ID와 Secret을 환경변수에 설정

## 배포 후 확인사항

### 1. 기능 테스트
- [ ] 홈 페이지에서 키워드 검색
- [ ] 검색 결과 저장
- [ ] 문서수 조회
- [ ] 데이터 페이지에서 필터링
- [ ] CSV 내보내기
- [ ] 벌크 액션

### 2. API 모니터링
- [ ] API 사용량 확인 (`/api/usage`)
- [ ] Rate limiting 동작 확인
- [ ] 에러 로그 모니터링

### 3. 성능 최적화
- [ ] 페이지 로딩 속도 확인
- [ ] API 응답 시간 모니터링
- [ ] 데이터베이스 쿼리 최적화

## 문제 해결

### 일반적인 문제들

1. **환경변수 오류**
   - Vercel 대시보드에서 환경변수 재확인
   - API 키 형식 확인

2. **Supabase 연결 오류**
   - URL과 anon key 재확인
   - RLS 정책 확인

3. **네이버 API 오류**
   - API 키 유효성 확인
   - Rate limit 확인
   - 서명 생성 로직 확인

4. **빌드 오류**
   - TypeScript 타입 오류 확인
   - 의존성 버전 호환성 확인

## 추가 최적화

### 1. 캐싱 전략
- Redis를 통한 API 응답 캐싱
- CDN을 통한 정적 자산 최적화

### 2. 모니터링
- Sentry를 통한 에러 추적
- Vercel Analytics를 통한 성능 모니터링

### 3. 보안
- API 키 로테이션
- Rate limiting 강화
- CORS 정책 설정

---

배포가 완료되면 `https://your-project.vercel.app`에서 황금키워드 파인더를 사용할 수 있습니다! 🎉
