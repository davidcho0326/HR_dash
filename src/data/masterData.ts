// F&F AI 조직 직무 체계 마스터 데이터
// 기반 문서: 직무체계_정의서_v2.md

import {
  Team,
  TaskDefinition,
  SkillDefinition,
  TaskSkillMapping,
  TaskCategory,
  SkillType,
} from '../types/organization';

// ============================================
// 팀 정의
// ============================================

export const TEAMS: Team[] = [
  {
    id: 'ax',
    name: 'AX팀',
    type: 'AX',
    description: 'PM/기획 - 프로젝트 관리, 요구사항 정의, 이해관계자 조율',
  },
  {
    id: 'ai-eng',
    name: 'AI 엔지니어링팀',
    type: 'AI_ENGINEERING',
    description: '기술 구현 - 데이터 엔지니어링, 데이터 기획, 풀스택 개발',
  },
];

// ============================================
// Task 정의 (36개)
// ============================================

export const TASK_DEFINITIONS: TaskDefinition[] = [
  // ─────────────────────────────────────────
  // AX팀 Tasks (12개)
  // ─────────────────────────────────────────
  {
    id: 'PROJECT_PLANNING',
    name: '프로젝트 기획 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: '프로젝트 전체 범위 및 방향성 수립',
    deliverables: ['프로젝트 계획서', 'WBS'],
    requiredSkills: ['PROJECT_MANAGEMENT', 'RISK_MANAGEMENT', 'PRD_WRITING'],
    recommendedSkills: ['REQUIREMENTS_ANALYSIS', 'COMMUNICATION', 'STAKEHOLDER_MANAGEMENT', 'BUSINESS_ANALYSIS', 'FASHION_DOMAIN', 'ENTERTAINMENT_DOMAIN'],
  },
  {
    id: 'REQUIREMENTS_DEFINITION',
    name: '요구사항 정의 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: '사용자 니즈 파악, 기능 명세서 작성',
    deliverables: ['PRD', '기능 명세서'],
    requiredSkills: ['REQUIREMENTS_ANALYSIS', 'COMMUNICATION', 'PRD_WRITING'],
    recommendedSkills: ['PROJECT_MANAGEMENT', 'STAKEHOLDER_MANAGEMENT', 'DATA_MODELING_SKILL', 'DATA_LITERACY', 'AI_TOOL_USAGE', 'UX_PLANNING', 'FASHION_DOMAIN', 'ENTERTAINMENT_DOMAIN'],
  },
  {
    id: 'STAKEHOLDER_COORDINATION',
    name: '이해관계자 조율 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: '유관부서, 경영진, 외부 벤더 간 의견 조율',
    deliverables: ['회의록', '합의서'],
    requiredSkills: ['COMMUNICATION', 'STAKEHOLDER_MANAGEMENT', 'RISK_MANAGEMENT'],
    recommendedSkills: ['PROJECT_MANAGEMENT', 'REQUIREMENTS_ANALYSIS', 'PRD_WRITING', 'PRESENTATION', 'BUSINESS_ANALYSIS'],
  },
  {
    id: 'SCHEDULE_RESOURCE_MGMT',
    name: '일정/리소스 관리 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: 'WBS 작성, 마일스톤 관리, 리소스 배분',
    deliverables: ['일정표', '리소스 현황'],
    requiredSkills: ['PROJECT_MANAGEMENT', 'RISK_MANAGEMENT'],
    recommendedSkills: ['COMMUNICATION', 'STAKEHOLDER_MANAGEMENT', 'PRD_WRITING', 'DATA_LITERACY'],
  },
  {
    id: 'DATA_PROTOTYPE',
    name: '데이터 처리 프로토타입 구성 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: '데이터 처리 방식 설계 및 프로토타입 구성',
    deliverables: ['프로토타입 화면'],
    requiredSkills: ['REQUIREMENTS_ANALYSIS', 'DATA_MODELING_SKILL', 'DATA_LITERACY'],
    recommendedSkills: ['COMMUNICATION', 'PRD_WRITING', 'AI_TOOL_USAGE', 'UX_PLANNING'],
  },
  {
    id: 'SHOOTING_PLANNING',
    name: '촬영 기획 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: '컨텐츠 촬영 관련 기획 및 조율',
    deliverables: ['촬영 계획서', '스케줄'],
    requiredSkills: ['COMMUNICATION', 'PRD_WRITING'],
    recommendedSkills: ['PROJECT_MANAGEMENT', 'REQUIREMENTS_ANALYSIS', 'STAKEHOLDER_MANAGEMENT', 'RISK_MANAGEMENT', 'FASHION_DOMAIN', 'ENTERTAINMENT_DOMAIN'],
  },
  {
    id: 'AGENT_RESEARCH',
    name: 'Agent 리서치 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: 'AI Agent 관련 기술/트렌드 조사',
    deliverables: ['리서치 보고서'],
    requiredSkills: ['AI_TOOL_USAGE'],
    recommendedSkills: ['REQUIREMENTS_ANALYSIS', 'PRD_WRITING', 'DATA_LITERACY'],
  },
  {
    id: 'QA_REVIEW',
    name: 'QA/검수 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: '결과물 품질 검증, 피드백 수집 및 반영',
    deliverables: ['검수 체크리스트', '피드백'],
    requiredSkills: ['REQUIREMENTS_ANALYSIS', 'COMMUNICATION'],
    recommendedSkills: ['PROJECT_MANAGEMENT', 'PRD_WRITING', 'DATA_LITERACY', 'UX_PLANNING', 'FASHION_DOMAIN', 'ENTERTAINMENT_DOMAIN'],
  },
  {
    id: 'USER_TEST_DESIGN',
    name: '사용자 테스트 설계 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: 'UAT 시나리오 설계 및 수행, 결과 분석',
    deliverables: ['테스트 시나리오', '결과 보고서'],
    requiredSkills: ['REQUIREMENTS_ANALYSIS', 'COMMUNICATION', 'PRD_WRITING'],
    recommendedSkills: ['PROJECT_MANAGEMENT', 'STAKEHOLDER_MANAGEMENT', 'DATA_LITERACY', 'UX_PLANNING', 'FASHION_DOMAIN', 'ENTERTAINMENT_DOMAIN'],
  },
  {
    id: 'CHANGE_MANAGEMENT',
    name: '변경 관리 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: '스코프 변경 요청 처리, 영향도 분석',
    deliverables: ['변경 요청서', '영향 분석서'],
    requiredSkills: ['PROJECT_MANAGEMENT', 'REQUIREMENTS_ANALYSIS', 'COMMUNICATION', 'STAKEHOLDER_MANAGEMENT', 'RISK_MANAGEMENT', 'PRD_WRITING'],
    recommendedSkills: ['BUSINESS_ANALYSIS'],
  },
  {
    id: 'TRAINING_ONBOARDING',
    name: '교육/온보딩 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: '결과물 사용법 교육, 매뉴얼 작성',
    deliverables: ['교육 자료', '사용자 매뉴얼'],
    requiredSkills: ['COMMUNICATION', 'PRD_WRITING', 'PRESENTATION'],
    recommendedSkills: ['REQUIREMENTS_ANALYSIS', 'STAKEHOLDER_MANAGEMENT', 'AI_TOOL_USAGE'],
  },
  {
    id: 'REPORTING',
    name: '보고 업무',
    team: 'AX',
    area: 'PM_PLANNING',
    description: '경영진/이해관계자 대상 보고',
    deliverables: ['보고 자료', '발표 자료'],
    requiredSkills: ['COMMUNICATION', 'STAKEHOLDER_MANAGEMENT', 'PRD_WRITING', 'PRESENTATION'],
    recommendedSkills: ['PROJECT_MANAGEMENT', 'DATA_LITERACY', 'BUSINESS_ANALYSIS', 'FASHION_DOMAIN', 'ENTERTAINMENT_DOMAIN'],
  },

  // ─────────────────────────────────────────
  // AI 엔지니어링팀 Tasks (24개)
  // ─────────────────────────────────────────

  // 백엔드 개발 영역
  {
    id: 'API_DEVELOPMENT',
    name: 'API 설계/개발 업무',
    team: 'AI_ENGINEERING',
    area: 'BACKEND',
    description: 'RESTful/GraphQL API 설계 및 구현',
    deliverables: ['API 명세서', '엔드포인트'],
    requiredSkills: ['PYTHON', 'FASTAPI_DJANGO', 'GIT', 'TECH_DOCUMENTATION'],
    recommendedSkills: ['SQL', 'NODEJS', 'AWS_GCP', 'DOCKER', 'CODE_REVIEW', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'SERVER_ARCHITECTURE',
    name: '서버 아키텍처 설계 업무',
    team: 'AI_ENGINEERING',
    area: 'BACKEND',
    description: '시스템 구조 설계, 기술 스택 선정',
    deliverables: ['아키텍처 문서'],
    requiredSkills: ['PYTHON', 'FASTAPI_DJANGO', 'AWS_GCP', 'DOCKER', 'TECH_DOCUMENTATION', 'ARCHITECTURE_DESIGN'],
    recommendedSkills: ['SQL', 'NODEJS', 'KUBERNETES', 'TERRAFORM', 'CODE_REVIEW'],
  },
  {
    id: 'AUTH_SYSTEM',
    name: '인증/권한 시스템 구축 업무',
    team: 'AI_ENGINEERING',
    area: 'BACKEND',
    description: '사용자 인증, 권한 관리 시스템 개발',
    deliverables: ['인증 모듈'],
    requiredSkills: ['PYTHON', 'FASTAPI_DJANGO', 'GIT'],
    recommendedSkills: ['SQL', 'AWS_GCP', 'TECH_DOCUMENTATION', 'CODE_REVIEW', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'PERFORMANCE_OPTIMIZATION',
    name: '성능 최적화 업무',
    team: 'AI_ENGINEERING',
    area: 'BACKEND',
    description: '응답 속도 개선, 부하 분산 처리',
    deliverables: ['최적화 보고서'],
    requiredSkills: ['PYTHON', 'SQL'],
    recommendedSkills: ['FASTAPI_DJANGO', 'AWS_GCP', 'DOCKER', 'TECH_DOCUMENTATION', 'CODE_REVIEW', 'ARCHITECTURE_DESIGN'],
  },

  // 프론트엔드 개발 영역
  {
    id: 'UI_UX_IMPLEMENTATION',
    name: 'UI/UX 구현 업무',
    team: 'AI_ENGINEERING',
    area: 'FRONTEND',
    description: '디자인 시안 기반 화면 개발',
    deliverables: ['웹/앱 화면'],
    requiredSkills: ['JAVASCRIPT_TYPESCRIPT', 'REACT_NEXTJS', 'GIT'],
    recommendedSkills: ['NODEJS', 'TECH_DOCUMENTATION', 'CODE_REVIEW'],
  },
  {
    id: 'COMPONENT_DEVELOPMENT',
    name: '컴포넌트 개발 업무',
    team: 'AI_ENGINEERING',
    area: 'FRONTEND',
    description: '재사용 가능한 UI 컴포넌트 개발',
    deliverables: ['컴포넌트 라이브러리'],
    requiredSkills: ['JAVASCRIPT_TYPESCRIPT', 'REACT_NEXTJS', 'GIT'],
    recommendedSkills: ['TECH_DOCUMENTATION', 'CODE_REVIEW', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'STATE_MANAGEMENT',
    name: '상태관리 구현 업무',
    team: 'AI_ENGINEERING',
    area: 'FRONTEND',
    description: '애플리케이션 상태 관리 로직 개발',
    deliverables: ['상태관리 모듈'],
    requiredSkills: ['JAVASCRIPT_TYPESCRIPT', 'REACT_NEXTJS', 'GIT'],
    recommendedSkills: ['TECH_DOCUMENTATION', 'CODE_REVIEW', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'RESPONSIVE_DESIGN',
    name: '반응형 설계 업무',
    team: 'AI_ENGINEERING',
    area: 'FRONTEND',
    description: '다양한 디바이스 대응 레이아웃 구현',
    deliverables: ['반응형 UI'],
    requiredSkills: ['JAVASCRIPT_TYPESCRIPT', 'REACT_NEXTJS'],
    recommendedSkills: ['GIT', 'CODE_REVIEW'],
  },

  // 데이터 파이프라인 영역
  {
    id: 'ETL_PROCESS',
    name: 'ETL 프로세스 구축 업무',
    team: 'AI_ENGINEERING',
    area: 'DATA_PIPELINE',
    description: '데이터 추출, 변환, 적재 프로세스 개발',
    deliverables: ['ETL 파이프라인'],
    requiredSkills: ['PYTHON', 'SQL', 'GIT', 'AIRFLOW', 'PANDAS_POLARS'],
    recommendedSkills: ['AWS_GCP', 'DOCKER', 'SNOWFLAKE_BIGQUERY', 'DBT', 'TECH_DOCUMENTATION', 'CODE_REVIEW', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'DATA_COLLECTION_AUTOMATION',
    name: '데이터 수집 자동화 업무',
    team: 'AI_ENGINEERING',
    area: 'DATA_PIPELINE',
    description: '크롤링, API 연동 등 데이터 수집 자동화',
    deliverables: ['수집 스크립트'],
    requiredSkills: ['PYTHON', 'GIT', 'AIRFLOW', 'PANDAS_POLARS'],
    recommendedSkills: ['JAVASCRIPT_TYPESCRIPT', 'SQL', 'NODEJS', 'AWS_GCP', 'DOCKER', 'TECH_DOCUMENTATION', 'CODE_REVIEW'],
  },
  {
    id: 'SCHEDULING',
    name: '스케줄링 설정 업무',
    team: 'AI_ENGINEERING',
    area: 'DATA_PIPELINE',
    description: '배치 작업 스케줄 설정 및 관리',
    deliverables: ['스케줄러 설정'],
    requiredSkills: ['PYTHON', 'AIRFLOW'],
    recommendedSkills: ['GIT', 'AWS_GCP', 'DOCKER', 'TECH_DOCUMENTATION'],
  },
  {
    id: 'DATA_QUALITY_MANAGEMENT',
    name: '데이터 품질 관리 업무',
    team: 'AI_ENGINEERING',
    area: 'DATA_PIPELINE',
    description: '데이터 정합성 검증, 이상치 탐지',
    deliverables: ['품질 리포트'],
    requiredSkills: ['PYTHON', 'SQL', 'DBT', 'PANDAS_POLARS'],
    recommendedSkills: ['GIT', 'SNOWFLAKE_BIGQUERY', 'AIRFLOW', 'TECH_DOCUMENTATION', 'CODE_REVIEW'],
  },

  // 배포/운영 영역
  {
    id: 'CI_CD',
    name: 'CI/CD 구축 업무',
    team: 'AI_ENGINEERING',
    area: 'DEVOPS',
    description: '지속적 통합/배포 파이프라인 구축',
    deliverables: ['CI/CD 파이프라인'],
    requiredSkills: ['GIT', 'AWS_GCP', 'DOCKER', 'TECH_DOCUMENTATION'],
    recommendedSkills: ['PYTHON', 'JAVASCRIPT_TYPESCRIPT', 'KUBERNETES', 'TERRAFORM', 'CODE_REVIEW', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'MONITORING_SYSTEM',
    name: '모니터링 시스템 구축 업무',
    team: 'AI_ENGINEERING',
    area: 'DEVOPS',
    description: '시스템 상태 모니터링, 알림 설정',
    deliverables: ['모니터링 대시보드'],
    requiredSkills: ['AWS_GCP'],
    recommendedSkills: ['PYTHON', 'SQL', 'GIT', 'DOCKER', 'KUBERNETES', 'TECH_DOCUMENTATION', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'INCIDENT_RESPONSE',
    name: '장애 대응 업무',
    team: 'AI_ENGINEERING',
    area: 'DEVOPS',
    description: '시스템 장애 분석 및 복구',
    deliverables: ['장애 보고서'],
    requiredSkills: ['PYTHON', 'SQL', 'AWS_GCP', 'DOCKER'],
    recommendedSkills: ['JAVASCRIPT_TYPESCRIPT', 'GIT', 'FASTAPI_DJANGO', 'KUBERNETES', 'SNOWFLAKE_BIGQUERY', 'TECH_DOCUMENTATION', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'SECURITY_MANAGEMENT',
    name: '보안 관리 업무',
    team: 'AI_ENGINEERING',
    area: 'DEVOPS',
    description: '취약점 점검, 보안 패치 적용',
    deliverables: ['보안 점검 보고서'],
    requiredSkills: ['AWS_GCP', 'DOCKER', 'TECH_DOCUMENTATION'],
    recommendedSkills: ['PYTHON', 'GIT', 'KUBERNETES', 'TERRAFORM', 'CODE_REVIEW', 'ARCHITECTURE_DESIGN'],
  },

  // 데이터베이스 영역
  {
    id: 'SCHEMA_DESIGN',
    name: '스키마 설계 업무',
    team: 'AI_ENGINEERING',
    area: 'DATABASE',
    description: '데이터베이스 구조 설계',
    deliverables: ['ERD', 'DDL'],
    requiredSkills: ['SQL', 'SNOWFLAKE_BIGQUERY', 'TECH_DOCUMENTATION'],
    recommendedSkills: ['GIT', 'DBT', 'CODE_REVIEW', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'QUERY_OPTIMIZATION',
    name: '쿼리 최적화 업무',
    team: 'AI_ENGINEERING',
    area: 'DATABASE',
    description: '쿼리 성능 분석 및 개선',
    deliverables: ['최적화된 쿼리'],
    requiredSkills: ['SQL', 'SNOWFLAKE_BIGQUERY'],
    recommendedSkills: ['DBT', 'TECH_DOCUMENTATION', 'CODE_REVIEW'],
  },
  {
    id: 'MIGRATION',
    name: '마이그레이션 업무',
    team: 'AI_ENGINEERING',
    area: 'DATABASE',
    description: '데이터/스키마 마이그레이션 수행',
    deliverables: ['마이그레이션 스크립트'],
    requiredSkills: ['PYTHON', 'SQL', 'GIT'],
    recommendedSkills: ['AWS_GCP', 'SNOWFLAKE_BIGQUERY', 'DBT', 'TECH_DOCUMENTATION', 'CODE_REVIEW'],
  },
  {
    id: 'BACKUP_RECOVERY',
    name: '백업/복구 체계 구축 업무',
    team: 'AI_ENGINEERING',
    area: 'DATABASE',
    description: '데이터 백업 정책 수립 및 구현',
    deliverables: ['백업 정책 문서'],
    requiredSkills: ['SQL', 'AWS_GCP', 'SNOWFLAKE_BIGQUERY', 'TECH_DOCUMENTATION'],
    recommendedSkills: ['TERRAFORM', 'ARCHITECTURE_DESIGN'],
  },

  // AI Agent 영역
  {
    id: 'PROMPT_ENGINEERING',
    name: '프롬프트 엔지니어링 업무',
    team: 'AI_ENGINEERING',
    area: 'AI_AGENT',
    description: 'LLM 프롬프트 설계 및 최적화',
    deliverables: ['프롬프트 템플릿'],
    requiredSkills: ['PYTHON', 'LLM_API', 'PROMPT_ENGINEERING_SKILL'],
    recommendedSkills: ['GIT', 'LANGCHAIN_LLAMAINDEX', 'TECH_DOCUMENTATION', 'CODE_REVIEW'],
  },
  {
    id: 'RAG_SYSTEM',
    name: 'RAG 시스템 구축 업무',
    team: 'AI_ENGINEERING',
    area: 'AI_AGENT',
    description: '검색 증강 생성 시스템 개발',
    deliverables: ['RAG 파이프라인'],
    requiredSkills: ['PYTHON', 'GIT', 'LLM_API', 'VECTOR_DB', 'LANGCHAIN_LLAMAINDEX', 'PROMPT_ENGINEERING_SKILL'],
    recommendedSkills: ['SQL', 'FASTAPI_DJANGO', 'AWS_GCP', 'DOCKER', 'MCP', 'TECH_DOCUMENTATION', 'CODE_REVIEW', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'WORKFLOW_DESIGN',
    name: '워크플로우 설계 업무',
    team: 'AI_ENGINEERING',
    area: 'AI_AGENT',
    description: 'Agent 동작 흐름 설계',
    deliverables: ['워크플로우 문서'],
    requiredSkills: ['PYTHON', 'LLM_API', 'LANGCHAIN_LLAMAINDEX', 'PROMPT_ENGINEERING_SKILL', 'TECH_DOCUMENTATION', 'ARCHITECTURE_DESIGN'],
    recommendedSkills: ['GIT', 'MCP', 'CODE_REVIEW'],
  },
  {
    id: 'MODEL_EVALUATION',
    name: '모델 평가/튜닝 업무',
    team: 'AI_ENGINEERING',
    area: 'AI_AGENT',
    description: '모델 성능 평가, 파인튜닝',
    deliverables: ['평가 보고서'],
    requiredSkills: ['PYTHON', 'LLM_API', 'PANDAS_POLARS', 'PROMPT_ENGINEERING_SKILL'],
    recommendedSkills: ['SQL', 'GIT', 'LANGCHAIN_LLAMAINDEX', 'TECH_DOCUMENTATION', 'CODE_REVIEW'],
  },
  {
    id: 'MCP_SERVER',
    name: 'MCP 서버 구축 업무',
    team: 'AI_ENGINEERING',
    area: 'AI_AGENT',
    description: 'Model Context Protocol 서버 개발',
    deliverables: ['MCP 서버'],
    requiredSkills: ['PYTHON', 'GIT', 'LLM_API', 'MCP', 'TECH_DOCUMENTATION'],
    recommendedSkills: ['JAVASCRIPT_TYPESCRIPT', 'FASTAPI_DJANGO', 'NODEJS', 'AWS_GCP', 'DOCKER', 'LANGCHAIN_LLAMAINDEX', 'PROMPT_ENGINEERING_SKILL', 'CODE_REVIEW', 'ARCHITECTURE_DESIGN'],
  },

  // 데이터 기획 영역
  {
    id: 'DATA_MODELING',
    name: '데이터 모델링 업무',
    team: 'AI_ENGINEERING',
    area: 'DATA_PLANNING',
    description: '비즈니스 요구 기반 데이터 모델 설계',
    deliverables: ['데이터 모델'],
    requiredSkills: ['SQL', 'SNOWFLAKE_BIGQUERY', 'TECH_DOCUMENTATION'],
    recommendedSkills: ['PYTHON', 'DBT', 'PANDAS_POLARS', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'KPI_DEFINITION',
    name: '지표 정의 업무',
    team: 'AI_ENGINEERING',
    area: 'DATA_PLANNING',
    description: 'KPI, 메트릭 정의 및 산출 로직 설계',
    deliverables: ['지표 정의서'],
    requiredSkills: ['SQL', 'SNOWFLAKE_BIGQUERY', 'TECH_DOCUMENTATION'],
    recommendedSkills: ['DBT', 'PANDAS_POLARS'],
  },
  {
    id: 'DASHBOARD_DESIGN',
    name: '대시보드 설계 업무',
    team: 'AI_ENGINEERING',
    area: 'DATA_PLANNING',
    description: '시각화 대시보드 기획 및 설계',
    deliverables: ['대시보드 기획서'],
    requiredSkills: ['SQL', 'TECH_DOCUMENTATION'],
    recommendedSkills: ['PYTHON', 'JAVASCRIPT_TYPESCRIPT', 'REACT_NEXTJS', 'SNOWFLAKE_BIGQUERY', 'PANDAS_POLARS', 'ARCHITECTURE_DESIGN'],
  },
  {
    id: 'ANALYSIS_REPORT',
    name: '분석 리포트 작성 업무',
    team: 'AI_ENGINEERING',
    area: 'DATA_PLANNING',
    description: '데이터 기반 인사이트 도출 및 보고',
    deliverables: ['분석 리포트'],
    requiredSkills: ['PYTHON', 'SQL', 'SNOWFLAKE_BIGQUERY', 'PANDAS_POLARS', 'TECH_DOCUMENTATION'],
    recommendedSkills: ['DBT'],
  },
];

// ============================================
// Skill 정의 (37개)
// ============================================

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  // ─────────────────────────────────────────
  // AX팀 Skills (14개)
  // ─────────────────────────────────────────
  { id: 'PROJECT_MANAGEMENT', name: '프로젝트 관리 역량', team: 'AX', category: 'MANAGEMENT', description: '애자일/워터폴 방법론 이해 및 적용' },
  { id: 'REQUIREMENTS_ANALYSIS', name: '요구사항 분석 역량', team: 'AX', category: 'MANAGEMENT', description: '비즈니스 요구를 기술 명세로 전환' },
  { id: 'COMMUNICATION', name: '커뮤니케이션 역량', team: 'AX', category: 'MANAGEMENT', description: '다양한 이해관계자와의 원활한 소통' },
  { id: 'STAKEHOLDER_MANAGEMENT', name: '이해관계자 관리 역량', team: 'AX', category: 'MANAGEMENT', description: '다양한 레벨의 커뮤니케이션 조율' },
  { id: 'RISK_MANAGEMENT', name: '리스크 관리 역량', team: 'AX', category: 'MANAGEMENT', description: '이슈 사전 파악, 대응 계획 수립' },
  { id: 'PRD_WRITING', name: '문서 작성(PRD) 역량', team: 'AX', category: 'MANAGEMENT', description: '기획 문서, 요구사항 명세서 작성' },
  { id: 'PRESENTATION', name: '발표(PT) 역량', team: 'AX', category: 'MANAGEMENT', description: '프레젠테이션 및 설득 커뮤니케이션' },
  { id: 'DATA_MODELING_SKILL', name: '데이터 모델링 역량', team: 'AX', category: 'MANAGEMENT', description: '데이터 구조 설계 및 관계 정의' },
  { id: 'DATA_LITERACY', name: '데이터 리터러시', team: 'AX', category: 'MANAGEMENT', description: 'SQL 기초, 데이터 해석 능력' },
  { id: 'AI_TOOL_USAGE', name: 'AI 도구 활용 역량', team: 'AX', category: 'MANAGEMENT', description: 'Claude, ChatGPT 등 프롬프팅 능력' },
  { id: 'UX_PLANNING', name: 'UX 기획 역량', team: 'AX', category: 'MANAGEMENT', description: '사용자 경험 설계, 와이어프레임 작성' },
  { id: 'BUSINESS_ANALYSIS', name: '비즈니스 분석 역량', team: 'AX', category: 'MANAGEMENT', description: 'ROI 분석, 비용-효과 분석' },
  { id: 'FASHION_DOMAIN', name: '패션 도메인 지식', team: 'AX', category: 'DOMAIN', description: '패션 산업 트렌드, 용어, 프로세스 이해' },
  { id: 'ENTERTAINMENT_DOMAIN', name: '엔터 도메인 지식', team: 'AX', category: 'DOMAIN', description: '엔터테인먼트 산업에 대한 이해' },

  // ─────────────────────────────────────────
  // AI 엔지니어링팀 Skills (23개)
  // ─────────────────────────────────────────
  // 개발 역량
  { id: 'PYTHON', name: 'Python', team: 'AI_ENGINEERING', category: 'DEVELOPMENT', description: '백엔드, 데이터 처리, AI 개발' },
  { id: 'JAVASCRIPT_TYPESCRIPT', name: 'JavaScript/TypeScript', team: 'AI_ENGINEERING', category: 'DEVELOPMENT', description: '프론트엔드, Node.js 개발' },
  { id: 'SQL', name: 'SQL', team: 'AI_ENGINEERING', category: 'DEVELOPMENT', description: '데이터베이스 쿼리, 분석' },
  { id: 'GIT', name: 'Git', team: 'AI_ENGINEERING', category: 'DEVELOPMENT', description: '버전 관리, 협업' },
  // 프레임워크
  { id: 'FASTAPI_DJANGO', name: 'FastAPI/Django', team: 'AI_ENGINEERING', category: 'FRAMEWORK', description: 'Python 웹 프레임워크' },
  { id: 'REACT_NEXTJS', name: 'React/Next.js', team: 'AI_ENGINEERING', category: 'FRAMEWORK', description: '프론트엔드 프레임워크' },
  { id: 'NODEJS', name: 'Node.js', team: 'AI_ENGINEERING', category: 'FRAMEWORK', description: 'JavaScript 런타임' },
  // 인프라
  { id: 'AWS_GCP', name: 'AWS/GCP', team: 'AI_ENGINEERING', category: 'INFRASTRUCTURE', description: '클라우드 플랫폼' },
  { id: 'DOCKER', name: 'Docker', team: 'AI_ENGINEERING', category: 'INFRASTRUCTURE', description: '컨테이너 기술' },
  { id: 'KUBERNETES', name: 'Kubernetes', team: 'AI_ENGINEERING', category: 'INFRASTRUCTURE', description: '컨테이너 오케스트레이션' },
  { id: 'TERRAFORM', name: 'Terraform', team: 'AI_ENGINEERING', category: 'INFRASTRUCTURE', description: 'IaC (Infrastructure as Code)' },
  // 데이터
  { id: 'SNOWFLAKE_BIGQUERY', name: 'Snowflake/BigQuery', team: 'AI_ENGINEERING', category: 'DATA', description: '클라우드 데이터 웨어하우스' },
  { id: 'AIRFLOW', name: 'Airflow', team: 'AI_ENGINEERING', category: 'DATA', description: '워크플로우 오케스트레이션' },
  { id: 'DBT', name: 'dbt', team: 'AI_ENGINEERING', category: 'DATA', description: '데이터 변환 도구' },
  { id: 'PANDAS_POLARS', name: 'Pandas/Polars', team: 'AI_ENGINEERING', category: 'DATA', description: '데이터 처리 라이브러리' },
  // AI/ML
  { id: 'LLM_API', name: 'LLM API 활용', team: 'AI_ENGINEERING', category: 'AI_ML', description: 'OpenAI, Anthropic API 활용' },
  { id: 'VECTOR_DB', name: '벡터DB', team: 'AI_ENGINEERING', category: 'AI_ML', description: 'Pinecone, Chroma, Weaviate' },
  { id: 'LANGCHAIN_LLAMAINDEX', name: 'LangChain/LlamaIndex', team: 'AI_ENGINEERING', category: 'AI_ML', description: 'LLM 애플리케이션 프레임워크' },
  { id: 'MCP', name: 'MCP', team: 'AI_ENGINEERING', category: 'AI_ML', description: 'Model Context Protocol' },
  { id: 'PROMPT_ENGINEERING_SKILL', name: '프롬프트 엔지니어링', team: 'AI_ENGINEERING', category: 'AI_ML', description: '효과적인 프롬프트 설계' },
  // 협업
  { id: 'TECH_DOCUMENTATION', name: '기술 문서 작성', team: 'AI_ENGINEERING', category: 'COLLABORATION', description: 'API 문서, 설계 문서 작성' },
  { id: 'CODE_REVIEW', name: '코드 리뷰', team: 'AI_ENGINEERING', category: 'COLLABORATION', description: '코드 품질 검토, 피드백' },
  { id: 'ARCHITECTURE_DESIGN', name: '아키텍처 설계', team: 'AI_ENGINEERING', category: 'COLLABORATION', description: '시스템 구조 설계' },
];

// ============================================
// Task-Skill 매트릭스 헬퍼 함수
// ============================================

// Task 정의에서 매트릭스 생성
export function buildTaskSkillMatrix(): TaskSkillMapping[] {
  const mappings: TaskSkillMapping[] = [];

  TASK_DEFINITIONS.forEach(task => {
    // 필수 스킬 매핑
    task.requiredSkills.forEach(skillId => {
      mappings.push({
        taskId: task.id,
        skillId,
        requirement: 'REQUIRED',
      });
    });

    // 권장 스킬 매핑
    task.recommendedSkills.forEach(skillId => {
      mappings.push({
        taskId: task.id,
        skillId,
        requirement: 'RECOMMENDED',
      });
    });
  });

  return mappings;
}

// 특정 Task에 필요한 스킬 조회
export function getSkillsForTask(taskId: TaskCategory): {
  required: SkillDefinition[];
  recommended: SkillDefinition[];
} {
  const task = TASK_DEFINITIONS.find(t => t.id === taskId);
  if (!task) return { required: [], recommended: [] };

  return {
    required: task.requiredSkills
      .map(id => SKILL_DEFINITIONS.find(s => s.id === id))
      .filter((s): s is SkillDefinition => s !== undefined),
    recommended: task.recommendedSkills
      .map(id => SKILL_DEFINITIONS.find(s => s.id === id))
      .filter((s): s is SkillDefinition => s !== undefined),
  };
}

// 특정 Skill이 필요한 Task 조회
export function getTasksForSkill(skillId: SkillType): {
  required: TaskDefinition[];
  recommended: TaskDefinition[];
} {
  return {
    required: TASK_DEFINITIONS.filter(t => t.requiredSkills.includes(skillId)),
    recommended: TASK_DEFINITIONS.filter(t => t.recommendedSkills.includes(skillId)),
  };
}

// 팀별 Task 조회
export function getTasksByTeam(teamType: 'AX' | 'AI_ENGINEERING'): TaskDefinition[] {
  return TASK_DEFINITIONS.filter(t => t.team === teamType);
}

// 팀별 Skill 조회
export function getSkillsByTeam(teamType: 'AX' | 'AI_ENGINEERING'): SkillDefinition[] {
  return SKILL_DEFINITIONS.filter(s => s.team === teamType || s.team === 'COMMON');
}

// 영역별 Task 조회
export function getTasksByArea(area: string): TaskDefinition[] {
  return TASK_DEFINITIONS.filter(t => t.area === area);
}

// Task-Skill 매트릭스 생성 (미리 계산)
export const TASK_SKILL_MATRIX = buildTaskSkillMatrix();

// ============================================
// 시장 연봉 벤치마크 데이터 (Phase 12)
// 출처: LinkedIn Salary Insights, Glassdoor (수동 입력, 2024년 기준)
// ============================================

import { MarketSalaryBenchmark, ExperienceLevel, TeamType } from '../types/organization';

export const MARKET_SALARY_BENCHMARKS: MarketSalaryBenchmark[] = [
  // AX팀 (PM/기획)
  {
    teamType: 'AX',
    experienceLevel: 'junior',
    median: 4500,
    p25: 3800,
    p75: 5200,
    source: 'LinkedIn Salary Insights 2024',
    lastUpdated: '2024-12-01',
  },
  {
    teamType: 'AX',
    experienceLevel: 'mid',
    median: 6500,
    p25: 5500,
    p75: 8000,
    source: 'LinkedIn Salary Insights 2024',
    lastUpdated: '2024-12-01',
  },
  {
    teamType: 'AX',
    experienceLevel: 'senior',
    median: 8500,
    p25: 7000,
    p75: 11000,
    source: 'LinkedIn Salary Insights 2024',
    lastUpdated: '2024-12-01',
  },

  // AI 엔지니어링팀 (개발/데이터)
  {
    teamType: 'AI_ENGINEERING',
    experienceLevel: 'junior',
    median: 5000,
    p25: 4200,
    p75: 6000,
    source: 'LinkedIn Salary Insights 2024',
    lastUpdated: '2024-12-01',
  },
  {
    teamType: 'AI_ENGINEERING',
    experienceLevel: 'mid',
    median: 7500,
    p25: 6000,
    p75: 9500,
    source: 'LinkedIn Salary Insights 2024',
    lastUpdated: '2024-12-01',
  },
  {
    teamType: 'AI_ENGINEERING',
    experienceLevel: 'senior',
    median: 10000,
    p25: 8000,
    p75: 13000,
    source: 'LinkedIn Salary Insights 2024',
    lastUpdated: '2024-12-01',
  },
];

// 벤치마크 조회 헬퍼
export function getSalaryBenchmark(
  teamType: TeamType,
  experienceLevel: ExperienceLevel
): MarketSalaryBenchmark | undefined {
  return MARKET_SALARY_BENCHMARKS.find(
    b => b.teamType === teamType && b.experienceLevel === experienceLevel
  );
}
