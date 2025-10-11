# 🎯 황금키워드 파인더

네이버 검색 데이터를 활용하여 검색량은 높지만 경쟁 문서수가 적은 "황금키워드"를 발굴하는 도구입니다.

## ✨ 주요 기능

- **키워드 검색**: 네이버 검색광고 API를 통한 연관키워드 조회 (5개 단위 배치 처리)
- **황금점수 계산**: 총검색량 ÷ 총문서수 비율로 황금키워드 발굴
- **문서수 조회**: 네이버 오픈 API를 통한 블로그, 카페, 웹문서, 뉴스 문서수 조회
- **배치 처리**: 다중 키워드 문서수 일괄 조회 (API 제한 고려)
- **데이터 관리**: Supabase를 통한 키워드 데이터 저장 및 관리
- **필터링**: 다양한 조건으로 키워드 필터링 및 정렬
- **벌크 액션**: 다중 선택/삭제, 일괄 문서수 조회
- **API 모니터링**: 네이버 API 사용량 실시간 추적
- **내보내기**: CSV 형태로 데이터 내보내기

## 🛠 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **APIs**: 네이버 검색광고 API, 네이버 오픈 API

## 🚀 시작하기

### 1. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd 1_nkeyword
npm install
```

### 2. 환경변수 설정

`env.example` 파일을 참고하여 `.env.local` 파일을 생성하고 다음 값들을 설정하세요:

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

### 3. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 파일의 내용을 실행
3. API Settings에서 URL과 anon key를 복사하여 환경변수에 설정

### 4. 네이버 API 설정

#### 검색광고 API
1. [네이버 검색광고](https://searchad.naver.com) 계정 생성
2. API 사용 신청 및 키 발급
3. 발급받은 키를 환경변수에 설정

#### 오픈 API
1. [네이버 개발자센터](https://developers.naver.com)에서 애플리케이션 등록
2. 검색 API 사용 신청
3. 발급받은 Client ID와 Secret을 환경변수에 설정

### 5. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 📊 사용법

### 1. 키워드 검색
- 홈 페이지에서 시드 키워드를 입력 (최대 5개, 쉼표로 구분)
- "상세 지표 포함" 옵션으로 CTR, 클릭수 등 추가 정보 조회
- "자동으로 문서수 조회" 옵션으로 황금점수 자동 계산

### 2. 데이터 관리
- 데이터 페이지에서 저장된 키워드 목록 확인
- 필터링으로 원하는 조건의 키워드만 표시
- 벌크 액션으로 다중 선택/삭제
- CSV 내보내기로 데이터 백업

### 3. 황금점수 활용
- 황금점수 = 총검색량 ÷ 총문서수
- 높은 황금점수 = 검색량은 높고 경쟁이 적은 키워드
- 50점 이상을 황금키워드로 분류

## 🔧 API 제한사항

- **네이버 검색광고 API**: 일일 1,000회 호출 제한, RelKwdStat는 1/5~1/6 속도 제한
- **네이버 오픈 API**: 일일 25,000회 호출 제한 (검색 API 전체 합산)
- **Rate limiting**: 지수 백오프 및 429 오류 대응
- **배치 처리**: 5개 단위 청크로 분할 처리하여 API 제한 준수
- **사용량 모니터링**: 실시간 API 사용량 추적 및 경고 시스템

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── data/              # 데이터 페이지
│   └── page.tsx           # 홈 페이지
├── components/            # React 컴포넌트
│   ├── home/              # 홈 페이지 컴포넌트
│   ├── data/              # 데이터 페이지 컴포넌트
│   └── ui/                # shadcn/ui 컴포넌트
├── lib/                   # 유틸리티 및 라이브러리
│   ├── naver/             # 네이버 API 연동
│   └── supabase/          # Supabase 클라이언트
├── store/                 # Zustand 상태 관리
└── types/                 # TypeScript 타입 정의
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.
