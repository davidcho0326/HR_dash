// F&F AI 조직 직무 체계 타입 정의
// 기반 문서: 직무체계_정의서_v2.md

// ============================================
// 팀/조직 타입
// ============================================

export type TeamType = 'AX' | 'AI_ENGINEERING';

export interface Team {
  id: string;
  name: string;
  type: TeamType;
  description: string;
}

// ============================================
// Task 카테고리 (36개)
// ============================================

// AX팀 Tasks (12개)
export type AXTaskCategory =
  | 'PROJECT_PLANNING'           // 프로젝트 기획 업무
  | 'REQUIREMENTS_DEFINITION'    // 요구사항 정의 업무
  | 'STAKEHOLDER_COORDINATION'   // 이해관계자 조율 업무
  | 'SCHEDULE_RESOURCE_MGMT'     // 일정/리소스 관리 업무
  | 'DATA_PROTOTYPE'             // 데이터 처리 프로토타입 구성 업무
  | 'SHOOTING_PLANNING'          // 촬영 기획 업무
  | 'AGENT_RESEARCH'             // Agent 리서치 업무
  | 'QA_REVIEW'                  // QA/검수 업무
  | 'USER_TEST_DESIGN'           // 사용자 테스트 설계 업무
  | 'CHANGE_MANAGEMENT'          // 변경 관리 업무
  | 'TRAINING_ONBOARDING'        // 교육/온보딩 업무
  | 'REPORTING';                 // 보고 업무

// AI 엔지니어링팀 Tasks (24개)
export type AITaskCategory =
  // 백엔드 개발 영역
  | 'API_DEVELOPMENT'            // API 설계/개발 업무
  | 'SERVER_ARCHITECTURE'        // 서버 아키텍처 설계 업무
  | 'AUTH_SYSTEM'                // 인증/권한 시스템 구축 업무
  | 'PERFORMANCE_OPTIMIZATION'   // 성능 최적화 업무
  // 프론트엔드 개발 영역
  | 'UI_UX_IMPLEMENTATION'       // UI/UX 구현 업무
  | 'COMPONENT_DEVELOPMENT'      // 컴포넌트 개발 업무
  | 'STATE_MANAGEMENT'           // 상태관리 구현 업무
  | 'RESPONSIVE_DESIGN'          // 반응형 설계 업무
  // 데이터 파이프라인 영역
  | 'ETL_PROCESS'                // ETL 프로세스 구축 업무
  | 'DATA_COLLECTION_AUTOMATION' // 데이터 수집 자동화 업무
  | 'SCHEDULING'                 // 스케줄링 설정 업무
  | 'DATA_QUALITY_MANAGEMENT'    // 데이터 품질 관리 업무
  // 배포/운영 영역
  | 'CI_CD'                      // CI/CD 구축 업무
  | 'MONITORING_SYSTEM'          // 모니터링 시스템 구축 업무
  | 'INCIDENT_RESPONSE'          // 장애 대응 업무
  | 'SECURITY_MANAGEMENT'        // 보안 관리 업무
  // 데이터베이스 영역
  | 'SCHEMA_DESIGN'              // 스키마 설계 업무
  | 'QUERY_OPTIMIZATION'         // 쿼리 최적화 업무
  | 'MIGRATION'                  // 마이그레이션 업무
  | 'BACKUP_RECOVERY'            // 백업/복구 체계 구축 업무
  // AI Agent 영역
  | 'PROMPT_ENGINEERING'         // 프롬프트 엔지니어링 업무
  | 'RAG_SYSTEM'                 // RAG 시스템 구축 업무
  | 'WORKFLOW_DESIGN'            // 워크플로우 설계 업무
  | 'MODEL_EVALUATION'           // 모델 평가/튜닝 업무
  | 'MCP_SERVER'                 // MCP 서버 구축 업무
  // 데이터 기획 영역
  | 'DATA_MODELING'              // 데이터 모델링 업무
  | 'KPI_DEFINITION'             // 지표 정의 업무
  | 'DASHBOARD_DESIGN'           // 대시보드 설계 업무
  | 'ANALYSIS_REPORT';           // 분석 리포트 작성 업무

export type TaskCategory = AXTaskCategory | AITaskCategory;

// Task 영역 구분
export type TaskArea =
  | 'PM_PLANNING'        // PM/기획 (AX)
  | 'BACKEND'            // 백엔드 (AI)
  | 'FRONTEND'           // 프론트엔드 (AI)
  | 'DATA_PIPELINE'      // 데이터 파이프라인 (AI)
  | 'DEVOPS'             // 배포/운영 (AI)
  | 'DATABASE'           // 데이터베이스 (AI)
  | 'AI_AGENT'           // AI Agent (AI)
  | 'DATA_PLANNING';     // 데이터 기획 (AI)

export interface TaskDefinition {
  id: TaskCategory;
  name: string;
  team: TeamType;
  area: TaskArea;
  description: string;
  deliverables: string[];
  requiredSkills: SkillType[];
  recommendedSkills: SkillType[];
}

// ============================================
// Skill 타입 (37개)
// ============================================

// AX팀 Skills (14개)
export type AXSkillType =
  | 'PROJECT_MANAGEMENT'         // 프로젝트 관리 역량
  | 'REQUIREMENTS_ANALYSIS'      // 요구사항 분석 역량
  | 'COMMUNICATION'              // 커뮤니케이션 역량
  | 'STAKEHOLDER_MANAGEMENT'     // 이해관계자 관리 역량
  | 'RISK_MANAGEMENT'            // 리스크 관리 역량
  | 'PRD_WRITING'                // 문서 작성(PRD) 역량
  | 'PRESENTATION'               // 발표(PT) 역량
  | 'DATA_MODELING_SKILL'        // 데이터 모델링 역량
  | 'DATA_LITERACY'              // 데이터 리터러시
  | 'AI_TOOL_USAGE'              // AI 도구 활용 역량
  | 'UX_PLANNING'                // UX 기획 역량
  | 'BUSINESS_ANALYSIS'          // 비즈니스 분석 역량
  | 'FASHION_DOMAIN'             // 패션 도메인 지식
  | 'ENTERTAINMENT_DOMAIN';      // 엔터 도메인 지식

// AI 엔지니어링팀 Skills (23개)
export type AISkillType =
  // 개발 역량
  | 'PYTHON'                     // Python
  | 'JAVASCRIPT_TYPESCRIPT'      // JavaScript/TypeScript
  | 'SQL'                        // SQL
  | 'GIT'                        // Git
  // 프레임워크
  | 'FASTAPI_DJANGO'             // FastAPI/Django
  | 'REACT_NEXTJS'               // React/Next.js
  | 'NODEJS'                     // Node.js
  // 인프라
  | 'AWS_GCP'                    // AWS/GCP
  | 'DOCKER'                     // Docker
  | 'KUBERNETES'                 // Kubernetes
  | 'TERRAFORM'                  // Terraform
  // 데이터
  | 'SNOWFLAKE_BIGQUERY'         // Snowflake/BigQuery
  | 'AIRFLOW'                    // Airflow
  | 'DBT'                        // dbt
  | 'PANDAS_POLARS'              // Pandas/Polars
  // AI/ML
  | 'LLM_API'                    // LLM API 활용
  | 'VECTOR_DB'                  // 벡터DB
  | 'LANGCHAIN_LLAMAINDEX'       // LangChain/LlamaIndex
  | 'MCP'                        // Model Context Protocol
  | 'PROMPT_ENGINEERING_SKILL'   // 프롬프트 엔지니어링
  // 협업
  | 'TECH_DOCUMENTATION'         // 기술 문서 작성
  | 'CODE_REVIEW'                // 코드 리뷰
  | 'ARCHITECTURE_DESIGN';       // 아키텍처 설계

export type SkillType = AXSkillType | AISkillType;

// Skill 카테고리 구분
export type SkillCategory =
  | 'MANAGEMENT'      // 관리 역량 (AX)
  | 'DOMAIN'          // 도메인 지식 (AX)
  | 'DEVELOPMENT'     // 개발 역량 (AI)
  | 'FRAMEWORK'       // 프레임워크 (AI)
  | 'INFRASTRUCTURE'  // 인프라 (AI)
  | 'DATA'            // 데이터 (AI)
  | 'AI_ML'           // AI/ML (AI)
  | 'COLLABORATION';  // 협업 (AI)

export interface SkillDefinition {
  id: SkillType;
  name: string;
  team: TeamType | 'COMMON';
  category: SkillCategory;
  description: string;
}

// ============================================
// Task-Skill 매트릭스
// ============================================

export type SkillRequirement = 'REQUIRED' | 'RECOMMENDED' | 'NONE';

export interface TaskSkillMapping {
  taskId: TaskCategory;
  skillId: SkillType;
  requirement: SkillRequirement;
}

// ============================================
// 투입률 관리
// ============================================

export interface Allocation {
  employeeId: number;
  projectId: number;
  taskId?: TaskCategory;
  allocationPercent: number;  // 0-100
  startDate: string;
  endDate: string;
}

export interface TaskAssignment {
  employeeId: number;
  allocationPercent: number;
  role: 'LEAD' | 'MEMBER';
}

// ============================================
// 확장된 Employee 타입
// ============================================

export interface ExtendedEmployee {
  // 기존 필드 (하위 호환)
  id: number;
  name: string;
  role: string;
  status: string;
  statusDetail: string;
  load: number;
  risk: string;
  skills: string[];           // 레거시 (문자열 배열)
  avatar: string;

  // 새 필드
  teamId: string;             // 'ax' | 'ai-eng'
  teamType: TeamType;         // 'AX' | 'AI_ENGINEERING'
  skillSet: SkillType[];      // 타입화된 스킬
  skillLevels?: Partial<Record<SkillType, 1 | 2 | 3 | 4 | 5>>;
  allocations: Allocation[];
  totalAllocation: number;    // 전체 투입률 합계

  // 연봉 관련 필드 (Phase 12)
  salary?: number;            // 현재 연봉 (만원)
  experienceLevel?: ExperienceLevel;  // 경력 수준
}

// ============================================
// 확장된 Task (WorkModule 대체)
// ============================================

export interface ProjectTask {
  // 기존 필드 (하위 호환)
  id: string;
  name: string;
  progress: number;
  techStack: string[];
  estimatedHours: number;
  startDate: string;
  endDate: string;
  assignees: number[];

  // 새 필드
  taskType: TaskCategory;
  requiredSkills: SkillType[];
  recommendedSkills: SkillType[];
  assigneeAllocations: TaskAssignment[];
  deliverables: string[];
}

// ============================================
// 성과 평가 타입
// ============================================

export type PerformanceGrade = 'S' | 'A' | 'B' | 'C' | 'D';
export type ExperienceLevel = 'junior' | 'mid' | 'senior';

export interface ProjectScoreDetail {
  completedProjects: number;      // 완료 프로젝트 수
  totalProjects: number;          // 전체 참여 프로젝트 수
  averageProgress: number;        // 평균 진행률
  onTimeDelivery: number;         // 기한 준수율 (%)
  raw: number;                    // 원점수 (0-100)
  weighted: number;               // 가중치 적용 점수
}

export interface TaskScoreDetail {
  completedTasks: number;         // 완료 Task 수
  totalTasks: number;             // 전체 담당 Task 수
  taskDiversity: number;          // Task 유형 다양성 (몇 개 영역)
  averageAllocation: number;      // 평균 투입률
  raw: number;                    // 원점수 (0-100)
  weighted: number;               // 가중치 적용 점수
}

export interface SkillScoreDetail {
  totalSkills: number;            // 보유 스킬 수
  requiredSkillCoverage: number;  // 필수 스킬 보유율 (%)
  skillMatchRate: number;         // Task 대비 스킬 매칭률 (%)
  raw: number;                    // 원점수 (0-100)
  weighted: number;               // 가중치 적용 점수
}

export interface PerformanceScore {
  employeeId: number;
  employeeName: string;
  teamType: TeamType;
  period: string;                 // '2025-Q4', '2026-H1' 등

  // 3가지 평가 요소
  projectScore: ProjectScoreDetail;   // 프로젝트 Output (40%)
  taskScore: TaskScoreDetail;         // Task Output (35%)
  skillScore: SkillScoreDetail;       // Skill 현황 (25%)

  totalScore: number;             // 최종 점수 (0-100)
  grade: PerformanceGrade;        // 등급
}

// 성과 평가 가중치 설정
export const PERFORMANCE_WEIGHTS = {
  PROJECT: 0.40,
  TASK: 0.35,
  SKILL: 0.25,
} as const;

// ============================================
// 연봉 비교 타입
// ============================================

export interface SalaryData {
  employeeId: number;
  currentSalary: number;          // 현재 연봉 (만원)
  marketMedian: number;           // 시장 중위값
  marketP25: number;              // 시장 하위 25%
  marketP75: number;              // 시장 상위 25%
  comparisonResult: 'above' | 'at' | 'below';
}

export interface MarketSalaryBenchmark {
  teamType: TeamType;
  taskCategory?: TaskCategory;
  experienceLevel: ExperienceLevel;
  median: number;
  p25: number;
  p75: number;
  source: string;
  lastUpdated: string;
}
