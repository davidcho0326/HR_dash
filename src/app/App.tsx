import React, { useState, useEffect, useRef } from 'react';
import { requestTeamComposition, TeamProposal, Employee as GeminiEmployee, Project as GeminiProject, WorkModule as GeminiWorkModule } from '../services/gemini';
import {
  archiveProjectToNotion,
  saveToLocalStorage,
  ProjectArchiveData,
  syncAllFromNotion,
  NotionProject,
  NotionTask,
  NotionSyncStatus
} from '../services/notion';
import {
  TeamType,
  TaskCategory,
  SkillType,
  Allocation,
  ExtendedEmployee,
  ProjectTask,
  TaskAssignment,
  PerformanceScore,
  PerformanceGrade,
  PERFORMANCE_WEIGHTS,
  MarketSalaryBenchmark,
  ExperienceLevel
} from '../types/organization';
import { TASK_DEFINITIONS, SKILL_DEFINITIONS, getSkillsForTask, getTasksByTeam, MARKET_SALARY_BENCHMARKS, getSalaryBenchmark } from '../data/masterData';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserPlus,
  Settings,
  Search,
  Bell,
  MessageSquare,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Database,
  ShieldAlert,
  PieChart,
  BarChart2,
  Target,
  Filter,
  Move,
  Zap,
  Link2,
  Plus,
  Eye,
  Edit3,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GanttChart,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  Mic,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  X,
  Award,
  Upload,
  CheckCircle2,
  DollarSign,
  Cloud,
  RefreshCw
} from 'lucide-react';

// --- Mock Data ---

// 팀 타입 → 표시 라벨 헬퍼 함수
const getTeamLabel = (teamType: TeamType): string => {
  switch (teamType) {
    case 'AX': return 'AX팀';
    case 'AI_ENGINEERING': return 'AI 엔지니어링팀';
    default: return '미배정';
  }
};

// 팀 타입 → 배지 스타일 헬퍼 함수
const getTeamBadgeStyle = (teamType: TeamType): string => {
  switch (teamType) {
    case 'AX': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'AI_ENGINEERING': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    default: return 'bg-slate-500/20 text-slate-400';
  }
};

// ============================================
// 성과 평가 계산 함수
// ============================================

const getPerformanceGrade = (score: number): PerformanceGrade => {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
};

const getGradeColor = (grade: PerformanceGrade): string => {
  switch (grade) {
    case 'S': return 'text-amber-400';
    case 'A': return 'text-emerald-400';
    case 'B': return 'text-cyan-400';
    case 'C': return 'text-slate-400';
    case 'D': return 'text-red-400';
  }
};

const getGradeBgColor = (grade: PerformanceGrade): string => {
  switch (grade) {
    case 'S': return 'bg-amber-500/20 border-amber-500/30';
    case 'A': return 'bg-emerald-500/20 border-emerald-500/30';
    case 'B': return 'bg-cyan-500/20 border-cyan-500/30';
    case 'C': return 'bg-slate-500/20 border-slate-500/30';
    case 'D': return 'bg-red-500/20 border-red-500/30';
  }
};

// 성과 점수 계산 함수
// 직무체계 정의서 기반 3가지 평가 요소:
// - 프로젝트 Output (40%): 참여 프로젝트 진행률, 기한 준수
// - Task Output (35%): 담당 Task 완료도, 다양성
// - Skill 현황 (25%): 보유 스킬 수, Task 대비 매칭률
const calculatePerformanceScore = (
  employee: ExtendedEmployee,
  projects: typeof PROJECTS,
  workModules: Record<number, ProjectTask[]>,
  period: string = '2025-Q4'
): PerformanceScore => {
  // 1. 프로젝트 Output 계산 (40%)
  const employeeProjects = projects.filter(p => p.members.includes(employee.id));
  const totalProjects = employeeProjects.length;
  const completedProjects = employeeProjects.filter(p => p.progress === 100).length;
  const averageProgress = totalProjects > 0
    ? employeeProjects.reduce((sum, p) => sum + p.progress, 0) / totalProjects
    : 0;

  // 기한 준수율 계산 (간소화: 진행률 기반 추정)
  const onTimeDelivery = employeeProjects.reduce((count, p) => {
    const today = new Date();
    const endDate = new Date(p.endDate);
    const isOnTrack = p.status === 'OnTrack' || today <= endDate;
    return count + (isOnTrack ? 1 : 0);
  }, 0) / Math.max(totalProjects, 1) * 100;

  // 프로젝트 점수: 완료율 30% + 평균진행률 40% + 기한준수 30%
  const projectRaw = Math.min(100,
    (completedProjects / Math.max(totalProjects, 1)) * 30 +
    averageProgress * 0.4 +
    onTimeDelivery * 0.3
  );

  // 2. Task Output 계산 (35%)
  const employeeTasks: ProjectTask[] = [];
  Object.values(workModules).forEach(tasks => {
    tasks.forEach(task => {
      if (task.assignees.includes(employee.id)) {
        employeeTasks.push(task);
      }
    });
  });

  const totalTasks = employeeTasks.length;
  const completedTasks = employeeTasks.filter(t => t.progress === 100).length;
  const taskDiversity = new Set(employeeTasks.map(t => t.taskType)).size;
  const avgAllocation = employee.allocations.length > 0
    ? employee.allocations.reduce((sum, a) => sum + a.allocationPercent, 0) / employee.allocations.length
    : 0;

  // Task 점수: 완료율 40% + 다양성 30% + 투입률효율 30%
  const taskRaw = Math.min(100,
    (completedTasks / Math.max(totalTasks, 1)) * 100 * 0.4 +
    Math.min(taskDiversity * 15, 30) +
    Math.min(avgAllocation, 100) * 0.3
  );

  // 3. Skill 현황 계산 (25%)
  const totalSkills = employee.skillSet.length;

  // 담당 Task의 필수 스킬과 매칭률 계산
  const requiredSkillsSet = new Set<SkillType>();
  employeeTasks.forEach(task => {
    task.requiredSkills.forEach(skill => requiredSkillsSet.add(skill));
  });
  const requiredSkills = Array.from(requiredSkillsSet);

  const matchedSkills = employee.skillSet.filter(s =>
    requiredSkills.includes(s as SkillType)
  ).length;

  const requiredSkillCoverage = requiredSkills.length > 0
    ? (matchedSkills / requiredSkills.length) * 100
    : 100;

  const skillMatchRate = totalSkills > 0
    ? (matchedSkills / totalSkills) * 100
    : 0;

  // Skill 점수: 보유수 30% + 필수커버리지 40% + 매칭률 30%
  const skillRaw = Math.min(100,
    Math.min(totalSkills * 5, 30) +
    requiredSkillCoverage * 0.4 +
    skillMatchRate * 0.3
  );

  // 가중치 적용
  const projectWeighted = projectRaw * PERFORMANCE_WEIGHTS.PROJECT;
  const taskWeighted = taskRaw * PERFORMANCE_WEIGHTS.TASK;
  const skillWeighted = skillRaw * PERFORMANCE_WEIGHTS.SKILL;

  const totalScore = projectWeighted + taskWeighted + skillWeighted;
  const grade = getPerformanceGrade(totalScore);

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    teamType: employee.teamType,
    period,
    projectScore: {
      completedProjects,
      totalProjects,
      averageProgress: Math.round(averageProgress),
      onTimeDelivery: Math.round(onTimeDelivery),
      raw: Math.round(projectRaw),
      weighted: Math.round(projectWeighted * 10) / 10,
    },
    taskScore: {
      completedTasks,
      totalTasks,
      taskDiversity,
      averageAllocation: Math.round(avgAllocation),
      raw: Math.round(taskRaw),
      weighted: Math.round(taskWeighted * 10) / 10,
    },
    skillScore: {
      totalSkills,
      requiredSkillCoverage: Math.round(requiredSkillCoverage),
      skillMatchRate: Math.round(skillMatchRate),
      raw: Math.round(skillRaw),
      weighted: Math.round(skillWeighted * 10) / 10,
    },
    totalScore: Math.round(totalScore * 10) / 10,
    grade,
  };
};

// ExtendedEmployee 타입으로 확장된 직원 데이터
// teamType: AX(PM/기획) vs AI_ENGINEERING(기술구현)
// skillSet: 직무체계 정의서 기반 타입화된 스킬
// allocations: 프로젝트별 투입률
const EMPLOYEES: ExtendedEmployee[] = [
  {
    id: 1,
    name: "김철수",
    role: "Backend Lead",
    status: "Focusing",
    statusDetail: "GitHub - API 서버 개발 중",
    load: 140,  // 과부하 상태
    risk: "High",
    skills: ["Python", "AWS", "System Design"],
    avatar: "KC",
    teamId: 'ai-eng',
    teamType: 'AI_ENGINEERING',
    skillSet: ['PYTHON', 'FASTAPI_DJANGO', 'AWS_GCP', 'DOCKER', 'SQL', 'GIT', 'ARCHITECTURE_DESIGN'],
    allocations: [
      // 프로젝트 103: API 서버 구축 (60%)
      { employeeId: 1, projectId: 103, taskId: 'API_DEVELOPMENT', allocationPercent: 60, startDate: '2025-11-15', endDate: '2026-01-15' },
      // 프로젝트 105: 태깅 API 설계/개발 (80%)
      { employeeId: 1, projectId: 105, taskId: 'API_DEVELOPMENT', allocationPercent: 80, startDate: '2025-12-01', endDate: '2026-01-31' },
    ],
    totalAllocation: 140,  // 60 + 80 = 140%
    salary: 8500,  // 연봉 8,500만원
    experienceLevel: 'senior',
  },
  {
    id: 2,
    name: "이영희",
    role: "Product Manager",
    status: "Meeting",
    statusDetail: "Zoom - 프로젝트 기획 회의",
    load: 240,  // 심각한 과부하 (3개 프로젝트 참여)
    risk: "Critical",
    skills: ["Jira", "Figma", "Data Analysis"],
    avatar: "LY",
    teamId: 'ax',
    teamType: 'AX',
    skillSet: ['PROJECT_MANAGEMENT', 'REQUIREMENTS_ANALYSIS', 'COMMUNICATION', 'STAKEHOLDER_MANAGEMENT', 'PRD_WRITING', 'PRESENTATION', 'DATA_LITERACY', 'UX_PLANNING', 'RISK_MANAGEMENT'],
    allocations: [
      // 프로젝트 103: 요구사항 정의 (40%) + QA (30%) + 교육 (30%)
      { employeeId: 2, projectId: 103, taskId: 'REQUIREMENTS_DEFINITION', allocationPercent: 40, startDate: '2025-11-01', endDate: '2025-11-30' },
      { employeeId: 2, projectId: 103, taskId: 'QA_REVIEW', allocationPercent: 30, startDate: '2025-12-15', endDate: '2026-01-31' },
      { employeeId: 2, projectId: 103, taskId: 'TRAINING_ONBOARDING', allocationPercent: 30, startDate: '2026-01-20', endDate: '2026-01-31' },
      // 프로젝트 104: 프로젝트 기획 (40%) + 이해관계자 조율 (20%) + 교육 (30%)
      { employeeId: 2, projectId: 104, taskId: 'PROJECT_PLANNING', allocationPercent: 40, startDate: '2025-12-01', endDate: '2025-12-15' },
      { employeeId: 2, projectId: 104, taskId: 'STAKEHOLDER_COORDINATION', allocationPercent: 20, startDate: '2025-12-01', endDate: '2026-01-20' },
      { employeeId: 2, projectId: 104, taskId: 'TRAINING_ONBOARDING', allocationPercent: 30, startDate: '2026-01-25', endDate: '2026-01-31' },
      // 프로젝트 105: QA (30%) + 교육 (20%)
      { employeeId: 2, projectId: 105, taskId: 'QA_REVIEW', allocationPercent: 30, startDate: '2026-01-15', endDate: '2026-02-10' },
      { employeeId: 2, projectId: 105, taskId: 'TRAINING_ONBOARDING', allocationPercent: 20, startDate: '2026-02-05', endDate: '2026-02-15' },
    ],
    totalAllocation: 240,  // 103: (40+30+30) + 104: (40+20+30) + 105: (30+20) = 240%
    salary: 7200,  // 연봉 7,200만원
    experienceLevel: 'senior',
  },
  {
    id: 3,
    name: "박지성",
    role: "Frontend Dev",
    status: "Working",
    statusDetail: "VSCode - 챗봇 UI 개발 중",
    load: 240,  // 심각한 과부하 (3개 프로젝트 참여)
    risk: "Critical",
    skills: ["React", "TypeScript", "Three.js"],  // 레거시 호환
    avatar: "PJ",
    // 새 필드
    teamId: 'ai-eng',
    teamType: 'AI_ENGINEERING',
    skillSet: ['JAVASCRIPT_TYPESCRIPT', 'REACT_NEXTJS', 'GIT', 'RESPONSIVE_DESIGN', 'COMPONENT_DEVELOPMENT'],
    allocations: [
      // 프로젝트 103: 챗봇 UI 개발 (80%)
      { employeeId: 3, projectId: 103, taskId: 'UI_UX_IMPLEMENTATION', allocationPercent: 80, startDate: '2025-12-01', endDate: '2026-01-31' },
      // 프로젝트 104: 대시보드 UI (60%) + API 개발 (40%)
      { employeeId: 3, projectId: 104, taskId: 'UI_UX_IMPLEMENTATION', allocationPercent: 60, startDate: '2025-12-20', endDate: '2026-01-31' },
      { employeeId: 3, projectId: 104, taskId: 'API_DEVELOPMENT', allocationPercent: 40, startDate: '2026-01-05', endDate: '2026-01-31' },
      // 프로젝트 105: 관리자 대시보드 UI (60%)
      { employeeId: 3, projectId: 105, taskId: 'UI_UX_IMPLEMENTATION', allocationPercent: 60, startDate: '2026-01-01', endDate: '2026-02-15' },
    ],
    totalAllocation: 240,  // 103: 80 + 104: (60+40) + 105: 60 = 240%
    salary: 5800,  // 연봉 5,800만원
    experienceLevel: 'mid',
  },
  {
    id: 4,
    name: "최수민",
    role: "UI Designer",
    status: "Focusing",
    statusDetail: "Figma - 트렌드 대시보드 프로토타입",
    load: 340,  // 심각한 과부하!
    risk: "Critical",
    skills: ["UI/UX", "Prototyping"],  // 레거시 호환
    avatar: "CS",
    // 새 필드
    teamId: 'ax',
    teamType: 'AX',
    skillSet: ['UX_PLANNING', 'DATA_LITERACY', 'COMMUNICATION', 'PRESENTATION', 'FASHION_DOMAIN', 'REQUIREMENTS_ANALYSIS'],
    allocations: [
      // 프로젝트 104: 요구사항 정의 (100%) + 데이터 프로토타입 (60%) + 사용자 테스트 (50%)
      { employeeId: 4, projectId: 104, taskId: 'REQUIREMENTS_DEFINITION', allocationPercent: 100, startDate: '2025-12-01', endDate: '2025-12-31' },
      { employeeId: 4, projectId: 104, taskId: 'DATA_PROTOTYPE', allocationPercent: 60, startDate: '2026-01-01', endDate: '2026-01-20' },
      { employeeId: 4, projectId: 104, taskId: 'USER_TEST_DESIGN', allocationPercent: 50, startDate: '2026-01-15', endDate: '2026-01-31' },
      // 프로젝트 105: 요구사항 정의 (60%) + 프로토타입 (40%) + QA (30%)
      { employeeId: 4, projectId: 105, taskId: 'REQUIREMENTS_DEFINITION', allocationPercent: 60, startDate: '2025-11-15', endDate: '2025-12-31' },
      { employeeId: 4, projectId: 105, taskId: 'DATA_PROTOTYPE', allocationPercent: 40, startDate: '2026-01-01', endDate: '2026-01-31' },
      { employeeId: 4, projectId: 105, taskId: 'QA_REVIEW', allocationPercent: 30, startDate: '2026-01-20', endDate: '2026-02-15' },
    ],
    totalAllocation: 340,  // 100+60+50+60+40+30 = 340% Critical!
    salary: 5200,  // 연봉 5,200만원
    experienceLevel: 'mid',
  },
  {
    id: 5,
    name: "정민우",
    role: "DevOps",
    status: "Working",
    statusDetail: "GitHub Actions - CI/CD 파이프라인 구축",
    load: 80,
    risk: "Medium",
    skills: ["Docker", "Kubernetes"],  // 레거시 호환
    avatar: "JM",
    // 새 필드
    teamId: 'ai-eng',
    teamType: 'AI_ENGINEERING',
    skillSet: ['DOCKER', 'KUBERNETES', 'AWS_GCP', 'TERRAFORM', 'CI_CD', 'MONITORING_SYSTEM', 'GIT'],
    allocations: [
      // 프로젝트 103: CI/CD 구축 (80%)
      { employeeId: 5, projectId: 103, taskId: 'CI_CD', allocationPercent: 80, startDate: '2025-12-15', endDate: '2026-01-31' },
    ],
    totalAllocation: 80,
    salary: 6500,  // 연봉 6,500만원
    experienceLevel: 'mid',
  },
  // 추가 직원 - 더 풍부한 데모 데이터
  {
    id: 6,
    name: "한지원",
    role: "AI Engineer",
    status: "Focusing",
    statusDetail: "Jupyter - RAG 시스템 개발",
    load: 180,  // 과부하 상태
    risk: "High",
    skills: ["Python", "LangChain", "Vector DB"],
    avatar: "HJ",
    teamId: 'ai-eng',
    teamType: 'AI_ENGINEERING',
    skillSet: ['PYTHON', 'LLM_API', 'VECTOR_DB', 'LANGCHAIN_LLAMAINDEX', 'PROMPT_ENGINEERING_SKILL', 'RAG_SYSTEM'],
    allocations: [
      // 프로젝트 103: RAG 시스템 구축 (100%) + 스키마 설계 (20%)
      { employeeId: 6, projectId: 103, taskId: 'RAG_SYSTEM', allocationPercent: 100, startDate: '2025-11-01', endDate: '2025-12-31' },
      { employeeId: 6, projectId: 103, taskId: 'SCHEMA_DESIGN', allocationPercent: 20, startDate: '2025-11-01', endDate: '2025-11-30' },
      // 프로젝트 105: 프롬프트 엔지니어링 (60%)
      { employeeId: 6, projectId: 105, taskId: 'PROMPT_ENGINEERING', allocationPercent: 60, startDate: '2025-12-01', endDate: '2026-01-31' },
    ],
    totalAllocation: 180,  // 100+20+60 = 180%
    salary: 9200,  // 연봉 9,200만원 (AI 엔지니어 프리미엄)
    experienceLevel: 'senior',
  },
  {
    id: 7,
    name: "윤서연",
    role: "Data Engineer",
    status: "Working",
    statusDetail: "Airflow - 데이터 파이프라인 구축",
    load: 130,  // 과부하 상태 (3개 프로젝트 참여)
    risk: "High",
    skills: ["Python", "Airflow", "BigQuery"],
    avatar: "YS",
    teamId: 'ai-eng',
    teamType: 'AI_ENGINEERING',
    skillSet: ['PYTHON', 'SNOWFLAKE_BIGQUERY', 'AIRFLOW', 'DBT', 'SQL', 'ETL_PROCESS', 'DATA_QUALITY_MANAGEMENT'],
    allocations: [
      // 프로젝트 103: ETL 프로세스 (50%)
      { employeeId: 7, projectId: 103, taskId: 'ETL_PROCESS', allocationPercent: 50, startDate: '2025-12-01', endDate: '2026-01-15' },
      // 프로젝트 104: 트렌드 데이터 ETL (40%)
      { employeeId: 7, projectId: 104, taskId: 'ETL_PROCESS', allocationPercent: 40, startDate: '2025-12-15', endDate: '2026-01-20' },
      // 프로젝트 105: ETL 프로세스 (40%)
      { employeeId: 7, projectId: 105, taskId: 'ETL_PROCESS', allocationPercent: 40, startDate: '2026-01-01', endDate: '2026-02-15' },
    ],
    totalAllocation: 130,  // 103: 50 + 104: 40 + 105: 40 = 130%
    salary: 5500,  // 연봉 5,500만원
    experienceLevel: 'mid',
  },
  {
    id: 8,
    name: "강민석",
    role: "Data Analyst",
    status: "Idle",
    statusDetail: "Slack - 대기 중",
    load: 0,
    risk: "Low",
    skills: ["SQL", "Tableau", "Python"],
    avatar: "KM",
    teamId: 'ai-eng',
    teamType: 'AI_ENGINEERING',
    skillSet: ['SQL', 'PANDAS_POLARS', 'PYTHON', 'DATA_MODELING', 'KPI_DEFINITION', 'DASHBOARD_DESIGN', 'ANALYSIS_REPORT'],
    allocations: [],  // 프로젝트 102 삭제로 배정 없음
    totalAllocation: 0,  // 투입 가능 인력
    salary: 4200,  // 연봉 4,200만원
    experienceLevel: 'junior',
  },
];

const PROJECTS = [
  // ============================================
  // 직무체계 정의서 4번 섹션 프로젝트 예시 (3개)
  // ============================================
  // 예시 A: 사내 AI 어시스턴트 구축 (협업 프로젝트: AI + AX)
  {
    id: 103,
    name: "사내 AI 어시스턴트 구축",
    phase: "Development",
    progress: 45,
    status: "OnTrack",
    members: [1, 2, 3, 6],  // AI팀(김철수, 박지성, 한지원) + AX팀(이영희)
    predictiveEnd: "2026.01.31",
    contributionToOrg: 60,
    startDate: "2025-11-01",
    endDate: "2026-01-31",
    category: "AI/ML",
    teamType: "COLLABORATION" as const,
    difficulty: "상"
  },
  // 예시 B: 패션 트렌드 예측 대시보드 (협업 프로젝트: AX + AI)
  {
    id: 104,
    name: "패션 트렌드 예측 대시보드",
    phase: "Planning",
    progress: 25,
    status: "OnTrack",
    members: [2, 3, 4, 7],  // AX팀(이영희, 최수민) + AI팀(박지성, 윤서연)
    predictiveEnd: "2026.01.31",
    contributionToOrg: 35,
    startDate: "2025-12-01",
    endDate: "2026-01-31",
    category: "Dashboard",
    teamType: "COLLABORATION" as const,
    difficulty: "중"
  },
  // 예시 C: AI 기반 상품 자동 태깅 시스템 (협업)
  {
    id: 105,
    name: "AI 기반 상품 자동 태깅 시스템",
    phase: "Design",
    progress: 30,
    status: "Delayed",
    members: [2, 4, 1, 6],  // AX(이영희, 최수민) + AI(김철수, 한지원)
    predictiveEnd: "2026.02.15",
    contributionToOrg: 55,
    startDate: "2025-11-15",
    endDate: "2026-02-15",
    category: "AI/ML",
    teamType: "COLLABORATION" as const,
    difficulty: "상"
  },
];

// Work modules for projects (업무 단위)
// ProjectTask 타입으로 확장 - taskType으로 직무체계 연결
// assigneeAllocations로 직원별 투입률 관리
const WORK_MODULES: Record<number, ProjectTask[]> = {
  // ============================================
  // 프로젝트 103: 사내 AI 어시스턴트 구축 (AI 엔지니어링팀)
  // 직무체계 정의서 4.1 예시 A 기반
  // ============================================
  103: [
    {
      id: 'w103-1',
      name: 'RAG 시스템 구축',
      progress: 50,
      techStack: ['LangChain', 'Pinecone', 'OpenAI API'],
      estimatedHours: 120,
      startDate: "2025-11-01",
      endDate: "2025-12-31",
      assignees: [6],
      taskType: 'RAG_SYSTEM',
      requiredSkills: ['PYTHON', 'LLM_API', 'LANGCHAIN_LLAMAINDEX', 'VECTOR_DB', 'PROMPT_ENGINEERING_SKILL'],
      recommendedSkills: ['FASTAPI_DJANGO', 'DOCKER', 'ARCHITECTURE_DESIGN'],
      assigneeAllocations: [{ employeeId: 6, allocationPercent: 100, role: 'LEAD' }],
      deliverables: ['RAG 파이프라인', '임베딩 모델 선정 문서'],
    },
    {
      id: 'w103-2',
      name: '벡터DB 스키마 설계',
      progress: 70,
      techStack: ['Pinecone', 'PostgreSQL'],
      estimatedHours: 40,
      startDate: "2025-11-01",
      endDate: "2025-11-30",
      assignees: [6],
      taskType: 'SCHEMA_DESIGN',
      requiredSkills: ['SQL', 'VECTOR_DB'],
      recommendedSkills: ['SNOWFLAKE_BIGQUERY', 'TECH_DOCUMENTATION'],
      assigneeAllocations: [{ employeeId: 6, allocationPercent: 20, role: 'LEAD' }],
      deliverables: ['ERD', 'DDL 스크립트'],
    },
    {
      id: 'w103-3',
      name: '사내 문서 ETL 파이프라인',
      progress: 40,
      techStack: ['Python', 'Airflow', 'S3'],
      estimatedHours: 80,
      startDate: "2025-11-15",
      endDate: "2026-01-15",
      assignees: [7],
      taskType: 'ETL_PROCESS',
      requiredSkills: ['PYTHON', 'SQL', 'AIRFLOW', 'PANDAS_POLARS'],
      recommendedSkills: ['DOCKER', 'SNOWFLAKE_BIGQUERY', 'DBT'],
      assigneeAllocations: [{ employeeId: 7, allocationPercent: 50, role: 'LEAD' }],
      deliverables: ['ETL 파이프라인', 'DAG 설정 문서'],
    },
    {
      id: 'w103-4',
      name: '챗봇 UI 개발',
      progress: 35,
      techStack: ['React', 'TypeScript', 'Tailwind'],
      estimatedHours: 100,
      startDate: "2025-12-01",
      endDate: "2026-01-31",
      assignees: [3],
      taskType: 'UI_UX_IMPLEMENTATION',
      requiredSkills: ['JAVASCRIPT_TYPESCRIPT', 'REACT_NEXTJS', 'GIT'],
      recommendedSkills: ['RESPONSIVE_DESIGN', 'COMPONENT_DEVELOPMENT'],
      assigneeAllocations: [{ employeeId: 3, allocationPercent: 80, role: 'LEAD' }],
      deliverables: ['챗봇 웹 UI', 'UI 컴포넌트'],
    },
    {
      id: 'w103-5',
      name: 'API 서버 구축',
      progress: 55,
      techStack: ['FastAPI', 'PostgreSQL', 'Redis'],
      estimatedHours: 100,
      startDate: "2025-11-15",
      endDate: "2026-01-15",
      assignees: [1],
      taskType: 'API_DEVELOPMENT',
      requiredSkills: ['PYTHON', 'FASTAPI_DJANGO', 'SQL', 'GIT'],
      recommendedSkills: ['AWS_GCP', 'DOCKER', 'ARCHITECTURE_DESIGN'],
      assigneeAllocations: [{ employeeId: 1, allocationPercent: 60, role: 'LEAD' }],
      deliverables: ['API 명세서', 'Swagger 문서', 'API 서버'],
    },
    {
      id: 'w103-6',
      name: 'CI/CD 및 배포 환경 구축',
      progress: 20,
      techStack: ['GitHub Actions', 'Docker', 'AWS ECS'],
      estimatedHours: 60,
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      assignees: [5],
      taskType: 'CI_CD',
      requiredSkills: ['GIT', 'AWS_GCP', 'DOCKER'],
      recommendedSkills: ['KUBERNETES', 'TERRAFORM', 'TECH_DOCUMENTATION'],
      assigneeAllocations: [{ employeeId: 5, allocationPercent: 80, role: 'LEAD' }],
      deliverables: ['CI/CD 파이프라인', '배포 문서'],
    },
    // --- AX팀 Tasks (신규 추가) ---
    {
      id: 'w103-7',
      name: '요구사항 정의 업무',
      progress: 85,
      techStack: ['Notion', 'Figma'],
      estimatedHours: 30,
      startDate: "2025-11-01",
      endDate: "2025-11-30",
      assignees: [2],
      taskType: 'REQUIREMENTS_DEFINITION',
      requiredSkills: ['REQUIREMENTS_ANALYSIS', 'COMMUNICATION', 'PRD_WRITING'],
      recommendedSkills: ['PROJECT_MANAGEMENT', 'STAKEHOLDER_MANAGEMENT', 'AI_TOOL_USAGE'],
      assigneeAllocations: [{ employeeId: 2, allocationPercent: 40, role: 'LEAD' }],
      deliverables: ['PRD', '사용자 요구사항 명세서'],
    },
    {
      id: 'w103-8',
      name: 'QA/검수 업무',
      progress: 20,
      techStack: ['Notion', 'Slack'],
      estimatedHours: 40,
      startDate: "2025-12-15",
      endDate: "2026-01-31",
      assignees: [2],
      taskType: 'QA_REVIEW',
      requiredSkills: ['REQUIREMENTS_ANALYSIS', 'COMMUNICATION'],
      recommendedSkills: ['DATA_LITERACY', 'AI_TOOL_USAGE', 'PRD_WRITING'],
      assigneeAllocations: [{ employeeId: 2, allocationPercent: 30, role: 'LEAD' }],
      deliverables: ['AI 응답 품질 검수 체크리스트', '피드백 보고서'],
    },
    {
      id: 'w103-9',
      name: '교육/온보딩 업무',
      progress: 0,
      techStack: ['Notion', 'Loom'],
      estimatedHours: 25,
      startDate: "2026-01-20",
      endDate: "2026-01-31",
      assignees: [2],
      taskType: 'TRAINING_ONBOARDING',
      requiredSkills: ['COMMUNICATION', 'PRD_WRITING', 'PRESENTATION'],
      recommendedSkills: ['REQUIREMENTS_ANALYSIS', 'AI_TOOL_USAGE'],
      assigneeAllocations: [{ employeeId: 2, allocationPercent: 30, role: 'LEAD' }],
      deliverables: ['사용자 교육 자료', 'AI 어시스턴트 사용 매뉴얼'],
    },
  ],

  // ============================================
  // 프로젝트 104: 패션 트렌드 예측 대시보드 (협업 프로젝트: AX + AI)
  // 직무체계 정의서 4.2 예시 B 기반
  // ============================================
  104: [
    {
      id: 'w104-1',
      name: '프로젝트 기획 업무',
      progress: 90,
      techStack: ['Notion', 'Jira'],
      estimatedHours: 30,
      startDate: "2025-12-01",
      endDate: "2025-12-15",
      assignees: [2],
      taskType: 'PROJECT_PLANNING',
      requiredSkills: ['PROJECT_MANAGEMENT', 'RISK_MANAGEMENT', 'PRD_WRITING'],
      recommendedSkills: ['REQUIREMENTS_ANALYSIS', 'COMMUNICATION', 'BUSINESS_ANALYSIS', 'FASHION_DOMAIN'],
      assigneeAllocations: [{ employeeId: 2, allocationPercent: 40, role: 'LEAD' }],
      deliverables: ['프로젝트 계획서', 'WBS'],
    },
    {
      id: 'w104-2',
      name: '요구사항 정의 업무',
      progress: 70,
      techStack: ['Figma', 'Notion'],
      estimatedHours: 40,
      startDate: "2025-12-10",
      endDate: "2025-12-31",
      assignees: [4],
      taskType: 'REQUIREMENTS_DEFINITION',
      requiredSkills: ['REQUIREMENTS_ANALYSIS', 'COMMUNICATION', 'PRD_WRITING'],
      recommendedSkills: ['DATA_LITERACY', 'UX_PLANNING', 'AI_TOOL_USAGE', 'FASHION_DOMAIN'],
      assigneeAllocations: [{ employeeId: 4, allocationPercent: 100, role: 'LEAD' }],
      deliverables: ['PRD', '기능 명세서'],
    },
    {
      id: 'w104-3',
      name: '데이터 처리 프로토타입 구성',
      progress: 30,
      techStack: ['Figma', 'SQL'],
      estimatedHours: 35,
      startDate: "2025-12-20",
      endDate: "2026-01-10",
      assignees: [4],
      taskType: 'DATA_PROTOTYPE',
      requiredSkills: ['REQUIREMENTS_ANALYSIS', 'DATA_MODELING_SKILL', 'DATA_LITERACY'],
      recommendedSkills: ['COMMUNICATION', 'PRD_WRITING', 'AI_TOOL_USAGE', 'UX_PLANNING'],
      assigneeAllocations: [{ employeeId: 4, allocationPercent: 60, role: 'LEAD' }],
      deliverables: ['프로토타입 화면', '데이터 모델 초안'],
    },
    {
      id: 'w104-4',
      name: '이해관계자 조율 업무',
      progress: 50,
      techStack: ['Zoom', 'Notion'],
      estimatedHours: 25,
      startDate: "2025-12-01",
      endDate: "2026-01-20",
      assignees: [2],
      taskType: 'STAKEHOLDER_COORDINATION',
      requiredSkills: ['COMMUNICATION', 'STAKEHOLDER_MANAGEMENT', 'RISK_MANAGEMENT'],
      recommendedSkills: ['PROJECT_MANAGEMENT', 'PRESENTATION', 'BUSINESS_ANALYSIS'],
      assigneeAllocations: [{ employeeId: 2, allocationPercent: 20, role: 'LEAD' }],
      deliverables: ['회의록', '합의서'],
    },
    {
      id: 'w104-5',
      name: '사용자 테스트 설계 업무',
      progress: 10,
      techStack: ['Figma', 'UserTesting'],
      estimatedHours: 30,
      startDate: "2026-01-10",
      endDate: "2026-01-25",
      assignees: [4],
      taskType: 'USER_TEST_DESIGN',
      requiredSkills: ['REQUIREMENTS_ANALYSIS', 'COMMUNICATION', 'PRD_WRITING'],
      recommendedSkills: ['PROJECT_MANAGEMENT', 'STAKEHOLDER_MANAGEMENT', 'UX_PLANNING', 'FASHION_DOMAIN'],
      assigneeAllocations: [{ employeeId: 4, allocationPercent: 50, role: 'LEAD' }],
      deliverables: ['테스트 시나리오', '결과 보고서'],
    },
    {
      id: 'w104-6',
      name: '교육/온보딩 업무',
      progress: 0,
      techStack: ['Notion', 'Loom'],
      estimatedHours: 20,
      startDate: "2026-01-25",
      endDate: "2026-01-31",
      assignees: [2],
      taskType: 'TRAINING_ONBOARDING',
      requiredSkills: ['COMMUNICATION', 'PRD_WRITING', 'PRESENTATION'],
      recommendedSkills: ['REQUIREMENTS_ANALYSIS', 'STAKEHOLDER_MANAGEMENT', 'AI_TOOL_USAGE'],
      assigneeAllocations: [{ employeeId: 2, allocationPercent: 30, role: 'LEAD' }],
      deliverables: ['교육 자료', '사용자 매뉴얼'],
    },
    // --- AI 엔지니어링팀 Tasks (신규 추가) ---
    {
      id: 'w104-7',
      name: '대시보드 UI 개발',
      progress: 15,
      techStack: ['React', 'TypeScript', 'Tailwind', 'Chart.js'],
      estimatedHours: 80,
      startDate: "2025-12-20",
      endDate: "2026-01-31",
      assignees: [3],
      taskType: 'UI_UX_IMPLEMENTATION',
      requiredSkills: ['JAVASCRIPT_TYPESCRIPT', 'REACT_NEXTJS', 'GIT'],
      recommendedSkills: ['RESPONSIVE_DESIGN', 'COMPONENT_DEVELOPMENT', 'TECH_DOCUMENTATION'],
      assigneeAllocations: [{ employeeId: 3, allocationPercent: 60, role: 'LEAD' }],
      deliverables: ['트렌드 대시보드 UI', '차트 컴포넌트'],
    },
    {
      id: 'w104-8',
      name: '트렌드 데이터 ETL',
      progress: 10,
      techStack: ['Python', 'Airflow', 'BigQuery'],
      estimatedHours: 60,
      startDate: "2025-12-15",
      endDate: "2026-01-20",
      assignees: [7],
      taskType: 'ETL_PROCESS',
      requiredSkills: ['PYTHON', 'SQL', 'AIRFLOW', 'PANDAS_POLARS'],
      recommendedSkills: ['SNOWFLAKE_BIGQUERY', 'DBT', 'TECH_DOCUMENTATION'],
      assigneeAllocations: [{ employeeId: 7, allocationPercent: 40, role: 'LEAD' }],
      deliverables: ['트렌드 데이터 수집 파이프라인', '데이터 정제 스크립트'],
    },
    {
      id: 'w104-9',
      name: '데이터 API 개발',
      progress: 5,
      techStack: ['FastAPI', 'PostgreSQL'],
      estimatedHours: 50,
      startDate: "2026-01-05",
      endDate: "2026-01-31",
      assignees: [3],
      taskType: 'API_DEVELOPMENT',
      requiredSkills: ['PYTHON', 'FASTAPI_DJANGO', 'SQL', 'GIT'],
      recommendedSkills: ['AWS_GCP', 'DOCKER', 'TECH_DOCUMENTATION'],
      assigneeAllocations: [{ employeeId: 3, allocationPercent: 40, role: 'LEAD' }],
      deliverables: ['트렌드 데이터 API', 'Swagger 문서'],
    },
  ],

  // ============================================
  // 프로젝트 105: AI 기반 상품 자동 태깅 시스템 (협업)
  // 직무체계 정의서 4.3 예시 C 기반
  // AX팀 4개 + AI팀 4개 = 총 8개 Task
  // ============================================
  105: [
    // --- AX팀 Tasks ---
    {
      id: 'w105-ax-1',
      name: '요구사항 정의 업무',
      progress: 80,
      techStack: ['Figma', 'Notion'],
      estimatedHours: 40,
      startDate: "2025-11-15",
      endDate: "2025-12-15",
      assignees: [4],
      taskType: 'REQUIREMENTS_DEFINITION',
      requiredSkills: ['REQUIREMENTS_ANALYSIS', 'COMMUNICATION', 'PRD_WRITING'],
      recommendedSkills: ['DATA_LITERACY', 'UX_PLANNING', 'FASHION_DOMAIN'],
      assigneeAllocations: [{ employeeId: 4, allocationPercent: 60, role: 'LEAD' }],
      deliverables: ['PRD', '태깅 분류 체계 명세서'],
    },
    {
      id: 'w105-ax-2',
      name: '태깅 분류 체계 설계',
      progress: 60,
      techStack: ['Notion', 'Figma'],
      estimatedHours: 35,
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      assignees: [4],
      taskType: 'DATA_PROTOTYPE',
      requiredSkills: ['REQUIREMENTS_ANALYSIS', 'DATA_MODELING_SKILL', 'DATA_LITERACY'],
      recommendedSkills: ['COMMUNICATION', 'UX_PLANNING'],
      assigneeAllocations: [{ employeeId: 4, allocationPercent: 40, role: 'LEAD' }],
      deliverables: ['분류 체계 문서', '프로토타입 화면'],
    },
    {
      id: 'w105-ax-3',
      name: 'QA/검수 업무 (정확도 평가)',
      progress: 20,
      techStack: ['Excel', 'Notion'],
      estimatedHours: 50,
      startDate: "2026-01-15",
      endDate: "2026-02-10",
      assignees: [2, 4],
      taskType: 'QA_REVIEW',
      requiredSkills: ['REQUIREMENTS_ANALYSIS', 'COMMUNICATION', 'PRD_WRITING'],
      recommendedSkills: ['DATA_LITERACY', 'FASHION_DOMAIN'],
      assigneeAllocations: [
        { employeeId: 2, allocationPercent: 30, role: 'MEMBER' },
        { employeeId: 4, allocationPercent: 30, role: 'LEAD' },
      ],
      deliverables: ['검수 체크리스트', '정확도 평가 보고서'],
    },
    {
      id: 'w105-ax-4',
      name: '교육/온보딩 업무',
      progress: 0,
      techStack: ['Notion', 'Loom'],
      estimatedHours: 25,
      startDate: "2026-02-05",
      endDate: "2026-02-15",
      assignees: [2],
      taskType: 'TRAINING_ONBOARDING',
      requiredSkills: ['COMMUNICATION', 'PRD_WRITING', 'PRESENTATION'],
      recommendedSkills: ['STAKEHOLDER_MANAGEMENT', 'AI_TOOL_USAGE'],
      assigneeAllocations: [{ employeeId: 2, allocationPercent: 20, role: 'LEAD' }],
      deliverables: ['교육 자료', '사용자 매뉴얼'],
    },
    // --- AI팀 Tasks ---
    {
      id: 'w105-ai-1',
      name: '프롬프트 엔지니어링 (이미지 분석)',
      progress: 45,
      techStack: ['OpenAI Vision API', 'Python'],
      estimatedHours: 80,
      startDate: "2025-11-20",
      endDate: "2026-01-15",
      assignees: [6],
      taskType: 'PROMPT_ENGINEERING',
      requiredSkills: ['PYTHON', 'LLM_API', 'PROMPT_ENGINEERING_SKILL'],
      recommendedSkills: ['LANGCHAIN_LLAMAINDEX', 'TECH_DOCUMENTATION', 'CODE_REVIEW'],
      assigneeAllocations: [{ employeeId: 6, allocationPercent: 60, role: 'LEAD' }],
      deliverables: ['프롬프트 템플릿', '성능 평가 리포트'],
    },
    {
      id: 'w105-ai-2',
      name: '태깅 API 설계/개발',
      progress: 35,
      techStack: ['FastAPI', 'PostgreSQL'],
      estimatedHours: 90,
      startDate: "2025-12-01",
      endDate: "2026-01-31",
      assignees: [1],
      taskType: 'API_DEVELOPMENT',
      requiredSkills: ['PYTHON', 'FASTAPI_DJANGO', 'GIT', 'TECH_DOCUMENTATION'],
      recommendedSkills: ['SQL', 'DOCKER', 'AWS_GCP', 'CODE_REVIEW'],
      assigneeAllocations: [{ employeeId: 1, allocationPercent: 80, role: 'LEAD' }],
      deliverables: ['API 명세서', 'Swagger 문서', '태깅 API 서버'],
    },
    {
      id: 'w105-ai-3',
      name: 'ETL 프로세스 구축 (배치 처리)',
      progress: 25,
      techStack: ['Python', 'Airflow', 'S3'],
      estimatedHours: 60,
      startDate: "2026-01-01",
      endDate: "2026-02-01",
      assignees: [7],
      taskType: 'ETL_PROCESS',
      requiredSkills: ['PYTHON', 'SQL', 'AIRFLOW', 'PANDAS_POLARS'],
      recommendedSkills: ['GIT', 'DOCKER', 'SNOWFLAKE_BIGQUERY', 'DBT'],
      assigneeAllocations: [{ employeeId: 7, allocationPercent: 40, role: 'LEAD' }],
      deliverables: ['배치 ETL 파이프라인', 'DAG 문서'],
    },
    {
      id: 'w105-ai-4',
      name: '관리자 대시보드 UI 구현',
      progress: 15,
      techStack: ['Next.js', 'TypeScript', 'Recharts'],
      estimatedHours: 70,
      startDate: "2026-01-15",
      endDate: "2026-02-15",
      assignees: [3],
      taskType: 'UI_UX_IMPLEMENTATION',
      requiredSkills: ['JAVASCRIPT_TYPESCRIPT', 'REACT_NEXTJS', 'GIT'],
      recommendedSkills: ['TECH_DOCUMENTATION', 'CODE_REVIEW'],
      assigneeAllocations: [{ employeeId: 3, allocationPercent: 60, role: 'LEAD' }],
      deliverables: ['관리자 대시보드 UI', 'UI 컴포넌트'],
    },
  ],
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatusBadge = ({ status }) => {
  const colors = {
    "Focusing": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "Meeting": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Working": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Idle": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Away": "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status] || colors["Idle"]}`}>
      {status}
    </span>
  );
};

const LoadBar = ({ value, risk }) => {
  let color = "bg-emerald-500";
  if (value > 60) color = "bg-amber-500";
  if (value > 80) color = "bg-red-500";
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">Capacity Load</span>
        <span className={`${risk === "High" ? "text-red-400 animate-pulse font-bold" : "text-slate-400"}`}>
          {value}% {risk === "High" && "(Burnout Warning)"}
        </span>
      </div>
      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`} 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
};

// --- Views ---

// Node-based Interactive Dashboard
const DraggableNode = ({ node, onDragStart, isDragging }) => {
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    onDragStart(node.id);
  };

  const getNodeStyle = () => {
    const baseStyle = "absolute cursor-move transition-shadow hover:shadow-2xl";
    
    if (node.type === 'project') {
      return `${baseStyle} bg-gradient-to-br from-indigo-600 to-purple-600 border-2 border-indigo-400 shadow-lg shadow-indigo-500/50`;
    } else if (node.type === 'person') {
      return `${baseStyle} bg-gradient-to-br from-emerald-600 to-teal-600 border-2 border-emerald-400 shadow-lg shadow-emerald-500/30`;
    } else if (node.type === 'work') {
      return `${baseStyle} bg-gradient-to-br from-amber-600 to-orange-600 border-2 border-amber-400 shadow-lg shadow-amber-500/30`;
    }
    return baseStyle;
  };

  const getTypeIcon = () => {
    if (node.type === 'project') return <Briefcase size={16} />;
    if (node.type === 'person') return <Users size={16} />;
    if (node.type === 'work') return <Layers size={16} />;
    return null;
  };

  const renderNodeContent = () => {
    if (node.type === 'project') {
      return (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getTypeIcon()}
              <span className="text-xs font-bold uppercase tracking-wide text-white">Project</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${node.data.status === 'OnTrack' ? 'bg-emerald-400/20 text-emerald-200' : 'bg-red-400/20 text-red-200'}`}>
              {node.data.status === 'OnTrack' ? 'On Track' : 'Delayed'}
            </span>
          </div>
          <h3 className="font-bold text-white mb-2 text-sm">{node.data.name}</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-white/70">Progress</span>
              <span className="text-white font-bold">{node.data.progress}%</span>
            </div>
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div className="bg-white h-full" style={{ width: `${node.data.progress}%` }}></div>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-white/70">Phase</span>
              <span className="text-white">{node.data.phase}</span>
            </div>
          </div>
        </>
      );
    } else if (node.type === 'person') {
      return (
        <>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
              {node.data.avatar}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-xs">{node.data.name}</h4>
              <p className="text-[10px] text-white/70">{node.data.role}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-white/70">Load</span>
              <span className={`font-bold ${node.data.load > 80 ? 'text-red-200' : 'text-white'}`}>{node.data.load}%</span>
            </div>
            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
              <div className={`h-full ${node.data.load > 80 ? 'bg-red-300' : node.data.load > 60 ? 'bg-amber-300' : 'bg-emerald-300'}`} style={{ width: `${node.data.load}%` }}></div>
            </div>
          </div>
        </>
      );
    } else if (node.type === 'work') {
      return (
        <>
          <div className="flex items-center gap-2 mb-2">
            {getTypeIcon()}
            <span className="text-xs font-bold text-white">{node.data.name}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-white/70">Progress</span>
              <span className="text-white font-bold">{node.data.progress}%</span>
            </div>
            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
              <div className="bg-white h-full transition-all" style={{ width: `${node.data.progress}%` }}></div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {node.data.techStack.map((tech, idx) => (
                <span key={idx} className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded">
                  {tech}
                </span>
              ))}
            </div>
            <div className="text-[9px] text-white/60">
              Est. {node.data.estimatedHours}h
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div
      className={`${getNodeStyle()} rounded-xl p-4 ${isDragging ? 'opacity-50 scale-105' : 'opacity-100'} ${node.type === 'project' ? 'w-64' : node.type === 'work' ? 'w-56' : 'w-48'}`}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        zIndex: isDragging ? 1000 : node.type === 'project' ? 100 : 50
      }}
      onMouseDown={handleMouseDown}
    >
      {renderNodeContent()}
      <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
        <Move size={12} className="text-white" />
      </div>
    </div>
  );
};

const ConnectionLine = ({ from, to, color = "rgba(139, 92, 246, 0.3)" }) => {
  return (
    <g>
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.5"
      />
      <circle cx={from.x} cy={from.y} r="4" fill={color} opacity="0.7" />
      <circle cx={to.x} cy={to.y} r="4" fill={color} opacity="0.7" />
    </g>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, icon, color, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'indigo' | 'amber' | 'emerald' | 'blue' | 'red';
  subtitle?: string;
}) => {
  const colorClasses = {
    indigo: 'from-indigo-600 to-indigo-700 shadow-indigo-500/20',
    amber: 'from-amber-600 to-amber-700 shadow-amber-500/20',
    emerald: 'from-emerald-600 to-emerald-700 shadow-emerald-500/20',
    blue: 'from-blue-600 to-blue-700 shadow-blue-500/20',
    red: 'from-red-600 to-red-700 shadow-red-500/20',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/80 text-sm font-medium">{title}</span>
        <div className="text-white/60">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-white/60 mt-1">{subtitle}</div>}
    </div>
  );
};

// Employee Card for Dashboard
const EmployeeStatusCard = ({ employee, onClick }: { employee: typeof EMPLOYEES[0]; onClick?: () => void }) => {
  const statusColors = {
    "Focusing": "bg-emerald-500",
    "Meeting": "bg-amber-500",
    "Working": "bg-blue-500",
    "Idle": "bg-slate-500",
    "Away": "bg-red-500",
  };

  const loadColor = employee.load > 80 ? 'bg-red-500' : employee.load > 60 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div
      className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
          {employee.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-medium truncate">{employee.name}</h4>
            <span className={`w-2 h-2 rounded-full ${statusColors[employee.status]}`}></span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getTeamBadgeStyle(employee.teamType)}`}>
            {getTeamLabel(employee.teamType)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">업무 부하</span>
          <span className={`font-medium ${employee.load > 80 ? 'text-red-400' : 'text-slate-300'}`}>
            {employee.load}%
            {employee.risk === "High" && " ⚠️"}
          </span>
        </div>
        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div className={`h-full ${loadColor} transition-all`} style={{ width: `${employee.load}%` }}></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {employee.skills.slice(0, 3).map((skill, idx) => (
          <span key={idx} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
};

// Project Card for Dashboard
const ProjectStatusCard = ({ project, employees, isNew }: {
  project: typeof PROJECTS[0];
  employees: typeof EMPLOYEES;
  isNew?: boolean;
}) => {
  const phaseColors = {
    "Planning": "bg-slate-600 text-slate-200",
    "Design": "bg-purple-600 text-purple-100",
    "Development": "bg-blue-600 text-blue-100",
  };

  const memberData = project.members.map(id => employees.find(e => e.id === id)).filter(Boolean);

  return (
    <div className={`bg-slate-900/50 rounded-xl p-4 border transition-all ${
      isNew
        ? 'border-indigo-500/50 bg-indigo-900/20'
        : 'border-slate-700 hover:border-slate-600'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isNew && (
              <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium animate-pulse">
                NEW
              </span>
            )}
            <h4 className="text-white font-medium">{project.name}</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded ${phaseColors[project.phase] || 'bg-slate-600 text-slate-200'}`}>
              {project.phase}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded ${
              project.status === 'OnTrack'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {project.status === 'OnTrack' ? '정상 진행' : '지연'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{project.progress}%</div>
          <div className="text-[10px] text-slate-500">진척률</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${project.status === 'OnTrack' ? 'bg-indigo-500' : 'bg-amber-500'}`}
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2">
            {memberData.slice(0, 3).map((emp, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[10px] font-medium text-white"
                title={emp?.name}
              >
                {emp?.avatar}
              </div>
            ))}
          </div>
          {memberData.length > 3 && (
            <span className="text-xs text-slate-500 ml-1">+{memberData.length - 3}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Calendar size={12} />
          <span>{project.predictiveEnd}</span>
        </div>
      </div>
    </div>
  );
};

interface DashboardViewProps {
  employees: typeof EMPLOYEES;
  projects: typeof PROJECTS;
  workModules: typeof WORK_MODULES;
  onEmployeeClick: (employee: ExtendedEmployee) => void;
}

const DashboardView = ({ employees, projects, workModules, onEmployeeClick }: DashboardViewProps) => {
  // 통계 계산
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter(p => p.progress < 100).length;
  const availableEmployees = employees.filter(e => e.load < 80 && e.status !== 'Away').length;
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
    : 0;
  const highRiskEmployees = employees.filter(e => e.risk === 'High').length;

  // 신규 프로젝트 감지 (오늘 날짜와 같은 startDate)
  const today = new Date().toISOString().split('T')[0];
  const recentProjects = projects.filter(p => p.startDate === today);

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="text-indigo-400" />
            HR Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">인력 및 프로젝트 현황 모니터링</p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
          마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          title="총 프로젝트"
          value={totalProjects}
          icon={<Briefcase size={20} />}
          color="indigo"
          subtitle={`${recentProjects.length}개 신규`}
        />
        <SummaryCard
          title="진행 중"
          value={inProgressProjects}
          icon={<Clock size={20} />}
          color="amber"
          subtitle="활성 프로젝트"
        />
        <SummaryCard
          title="가용 인력"
          value={`${availableEmployees}/${employees.length}`}
          icon={<Users size={20} />}
          color="emerald"
          subtitle={highRiskEmployees > 0 ? `${highRiskEmployees}명 번아웃 위험` : '정상'}
        />
        <SummaryCard
          title="평균 진척률"
          value={`${avgProgress}%`}
          icon={<TrendingUp size={20} />}
          color="blue"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
        {/* 인력 가용 현황 */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="text-emerald-400" size={20} />
              인력 가용 현황
            </h2>
            <span className="text-xs text-slate-500">{employees.length}명</span>
          </div>

          <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1">
            {employees.map(emp => (
              <EmployeeStatusCard
                key={emp.id}
                employee={emp}
                onClick={() => onEmployeeClick(emp)}
              />
            ))}
          </div>
        </div>

        {/* 프로젝트 진척률 */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="text-indigo-400" size={20} />
              프로젝트 진척률
            </h2>
            <span className="text-xs text-slate-500">{projects.length}개 프로젝트</span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {/* 신규 프로젝트 우선 표시 */}
            {recentProjects.map(project => (
              <ProjectStatusCard
                key={project.id}
                project={project}
                employees={employees}
                isNew={true}
              />
            ))}

            {/* 기존 프로젝트 */}
            {projects
              .filter(p => p.startDate !== today)
              .sort((a, b) => b.progress - a.progress)
              .map(project => (
                <ProjectStatusCard
                  key={project.id}
                  project={project}
                  employees={employees}
                />
              ))
            }
          </div>
        </div>
      </div>

      {/* 신규 프로젝트 알림 배너 (있을 경우에만) */}
      {recentProjects.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Plus size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">새로운 프로젝트가 추가되었습니다!</h3>
              <p className="text-sm text-indigo-300">
                {recentProjects.map(p => p.name).join(', ')} - Projects 탭에서 AI 팀 구성이 승인되었습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ProjectViewProps {
  employees: typeof EMPLOYEES;
  projects: typeof PROJECTS;
  workModules: typeof WORK_MODULES;
  onAddProject: (project: typeof PROJECTS[0], workModules?: typeof WORK_MODULES[number]) => void;
  onEmployeeClick: (employee: ExtendedEmployee) => void;
}

const ProjectView = ({ employees, projects, workModules, onAddProject, onEmployeeClick }: ProjectViewProps) => {
  const [showAiProposal, setShowAiProposal] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'gantt'>('gantt');

  // AI Team Composition States
  const [managerInput, setManagerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiProposal, setAiProposal] = useState<TeamProposal | null>(null);

  // Notion Archive States
  const [archivingProjectId, setArchivingProjectId] = useState<number | null>(null);
  const [archivedProjects, setArchivedProjects] = useState<Set<number>>(new Set());

  // Notion 아카이브 핸들러
  const handleArchiveToNotion = async (project: typeof projects[0]) => {
    setArchivingProjectId(project.id);

    const archiveData: ProjectArchiveData = {
      name: project.name,
      status: project.status,
      progress: project.progress,
      startDate: project.startDate,
      endDate: project.endDate,
      teamType: project.teamType || 'Unknown',
      members: project.members.map(id => employees.find(e => e.id === id)?.name || `ID:${id}`),
      category: project.category,
    };

    // Notion API 호출 시도
    const result = await archiveProjectToNotion(archiveData);

    if (result.success) {
      setArchivedProjects(prev => new Set(prev).add(project.id));
    } else {
      // Notion 실패 시 로컬 스토리지에 저장
      saveToLocalStorage(archiveData);
      setArchivedProjects(prev => new Set(prev).add(project.id));
      console.log('Notion 연결 실패, 로컬에 저장됨:', result.error);
    }

    setArchivingProjectId(null);
  };

  // 3개월 후 날짜 계산 함수
  const calculateEndDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  };

  // 팀 구성 승인 핸들러
  const handleApproveTeam = () => {
    if (!aiProposal || aiProposal.error) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const endDate = calculateEndDate();
    const projectId = Date.now();

    const newProject: typeof PROJECTS[0] = {
      id: projectId,
      name: aiProposal.projectName,
      phase: "Planning",
      progress: 0,
      status: "OnTrack",
      members: aiProposal.team.map(m => m.employeeId),
      predictiveEnd: endDate.replace(/-/g, '.'),
      contributionToOrg: 20,
      startDate: todayStr,
      endDate: endDate,
      category: "AI Generated"
    };

    // AI가 추천한 workModules를 앱 형식으로 변환
    const newWorkModules: typeof WORK_MODULES[number] = aiProposal.workModules?.map((module, idx) => {
      // 각 모듈의 시작/종료일 계산 (순차적으로 배치)
      const moduleStart = new Date(today);
      moduleStart.setDate(moduleStart.getDate() + idx * 21); // 3주 간격
      const moduleEnd = new Date(moduleStart);
      moduleEnd.setDate(moduleEnd.getDate() + 28); // 4주 기간

      return {
        id: `w-${projectId}-${idx + 1}`,
        name: module.name,
        progress: 0,
        techStack: module.techStack,
        estimatedHours: module.estimatedHours,
        startDate: moduleStart.toISOString().split('T')[0],
        endDate: moduleEnd.toISOString().split('T')[0],
        assignees: module.assigneeIds
      };
    }) || [];

    onAddProject(newProject, newWorkModules);
    setShowAiProposal(false);
    setManagerInput('');
    setAiProposal(null);
  };

  // API 호출 핸들러
  const handleAiRequest = async () => {
    if (!managerInput.trim()) return;

    setIsLoading(true);
    setShowAiProposal(false);

    // employees와 projects를 Gemini API 형식으로 변환
    const employeesForApi: GeminiEmployee[] = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      skills: emp.skills,
      load: emp.load,
      status: emp.status
    }));

    const projectsForApi: GeminiProject[] = projects.map(proj => ({
      id: proj.id,
      name: proj.name,
      category: proj.category,
      members: proj.members.map(m => employees.find(e => e.id === m)?.name || ''),
      startDate: proj.startDate,
      endDate: proj.endDate
    }));

    const result = await requestTeamComposition(managerInput, employeesForApi, projectsForApi);

    setAiProposal(result);
    setShowAiProposal(true);
    setIsLoading(false);
  };

  // Gantt Chart States
  const [zoomLevel, setZoomLevel] = useState<'week' | 'month' | 'quarter'>('month');
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set([103]));
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Gantt Chart Helpers
  // 타임라인 범위: 프로젝트 103 시작일(2025-11-01)부터 표시
  const timelineStart = new Date('2025-11-01');
  const timelineEnd = new Date('2026-05-31');

  const getDaysBetween = (start: Date, end: Date) => {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const totalDays = getDaysBetween(timelineStart, timelineEnd);

  const getBarPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startOffset = getDaysBetween(timelineStart, start);
    const duration = getDaysBetween(start, end);

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`
    };
  };

  const generateMonthGrid = () => {
    const months: { name: string; start: Date; width: number }[] = [];
    const current = new Date(timelineStart);

    while (current < timelineEnd) {
      const monthStart = new Date(current);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      const effectiveEnd = monthEnd > timelineEnd ? timelineEnd : monthEnd;
      const effectiveStart = monthStart < timelineStart ? timelineStart : monthStart;

      const daysInMonth = getDaysBetween(effectiveStart, effectiveEnd) + 1;
      const widthPercent = (daysInMonth / totalDays) * 100;

      months.push({
        name: `${current.getFullYear()}.${String(current.getMonth() + 1).padStart(2, '0')}`,
        start: effectiveStart,
        width: widthPercent
      });

      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }

    return months;
  };

  const getTodayPosition = () => {
    const today = new Date();
    if (today < timelineStart || today > timelineEnd) return null;
    const offset = getDaysBetween(timelineStart, today);
    return `${(offset / totalDays) * 100}%`;
  };

  const toggleProject = (projectId: number) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const months = generateMonthGrid();
  const todayPosition = getTodayPosition();

  return (
    <div className="h-full flex gap-6">
      {/* 메인 컨텐츠: Timeline/Gantt */}
      <div className="flex-1 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
        {/* Header with View Toggle */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">Project Timeline</h2>
            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
              {projects.length} projects • {Object.values(workModules).flat().length} modules
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="bg-slate-900 p-1 rounded-lg flex border border-slate-700">
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart2 size={14} />
                Timeline
              </button>
              <button
                onClick={() => setViewMode('gantt')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'gantt'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GanttChart size={14} />
                Gantt
              </button>
            </div>

            {/* Zoom Control for Gantt */}
            {viewMode === 'gantt' && (
              <>
                <div className="h-6 w-px bg-slate-700"></div>
                <div className="bg-slate-900 p-1 rounded-lg flex border border-slate-700">
                  {(['week', 'month', 'quarter'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setZoomLevel(level)}
                      className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                        zoomLevel === level
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {level === 'week' ? '주간' : level === 'month' ? '월간' : '분기'}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Legend */}
            <div className="h-6 w-px bg-slate-700"></div>
            <div className="flex items-center gap-3 text-xs">
              {viewMode === 'timeline' ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-indigo-500 rounded-sm"></span>
                    <span className="text-slate-400">Current</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 border border-dashed border-indigo-500 rounded-sm"></span>
                    <span className="text-slate-400">AI Prediction</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-sm"></div>
                    <span className="text-slate-400">프로젝트</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-sm"></div>
                    <span className="text-slate-400">업무</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-sm"></div>
                    <span className="text-slate-400">담당자</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'timeline' ? (
          /* Timeline View */
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {projects.map(project => (
                <div key={project.id}>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <h4 className="text-white font-medium">{project.name}</h4>
                      <p className="text-xs text-slate-400">{project.phase} Phase • {project.members.length} Members</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${project.status === 'OnTrack' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {project.status === 'OnTrack' ? '정상 진행' : '지연 예상'}
                    </span>
                  </div>

                  <div className="relative w-full h-8 bg-slate-900 rounded-lg overflow-hidden flex">
                    <div
                      className={`h-full flex items-center justify-center text-[10px] text-white/80 font-medium transition-all ${project.status === 'OnTrack' ? 'bg-indigo-600' : 'bg-amber-600'}`}
                      style={{ width: `${project.progress}%` }}
                    >
                      Current {project.progress}%
                    </div>

                    <div
                       className={`h-full border-t-2 border-b-2 border-r-2 border-dashed flex items-center justify-center text-[10px] ${project.status === 'OnTrack' ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}
                       style={{ width: `${30}%` }}
                    >
                      예상 종료: {project.predictiveEnd}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Gantt Chart View */
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Timeline Header */}
            <div className="flex border-b border-slate-700 flex-shrink-0">
              <div className="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-700 px-4 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">프로젝트 / 업무 / 담당자</span>
              </div>
              <div className="flex-1 flex relative bg-slate-900/50">
                {months.map((month, idx) => (
                  <div
                    key={idx}
                    className="border-r border-slate-700/50 px-2 py-3 text-center"
                    style={{ width: `${month.width}%` }}
                  >
                    <span className="text-xs font-medium text-slate-300">{month.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt Body - 동적 높이 */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="flex min-h-full">
                {/* Left Panel - Names */}
                <div className="w-72 flex-shrink-0 bg-slate-900/50 border-r border-slate-700 flex flex-col">
                  {projects.map(project => (
                    <React.Fragment key={project.id}>
                      <div
                        className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer"
                        onClick={() => toggleProject(project.id)}
                      >
                        {expandedProjects.has(project.id) ? (
                          <ChevronDown size={14} className="text-indigo-400" />
                        ) : (
                          <ChevronRight size={14} className="text-indigo-400" />
                        )}
                        <Briefcase size={14} className="text-indigo-400" />
                        <span className="text-sm font-medium text-white truncate flex-1">{project.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          project.status === 'OnTrack' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {project.progress}%
                        </span>
                        {/* Notion 아카이브 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!archivedProjects.has(project.id) && archivingProjectId !== project.id) {
                              handleArchiveToNotion(project);
                            }
                          }}
                          className={`p-1 rounded transition-all ${
                            archivedProjects.has(project.id)
                              ? 'text-emerald-400 cursor-default'
                              : archivingProjectId === project.id
                              ? 'text-amber-400 animate-pulse'
                              : 'text-slate-500 hover:text-white hover:bg-slate-700'
                          }`}
                          title={archivedProjects.has(project.id) ? '저장됨' : 'Notion에 저장'}
                        >
                          {archivedProjects.has(project.id) ? (
                            <CheckCircle2 size={12} />
                          ) : archivingProjectId === project.id ? (
                            <Upload size={12} className="animate-bounce" />
                          ) : (
                            <Upload size={12} />
                          )}
                        </button>
                      </div>

                      {expandedProjects.has(project.id) && workModules[project.id]?.map(module => (
                        <React.Fragment key={module.id}>
                          <div
                            className="flex items-center gap-2 px-4 py-2.5 pl-8 border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer"
                            onClick={() => toggleModule(module.id)}
                          >
                            {expandedModules.has(module.id) ? (
                              <ChevronDown size={12} className="text-amber-400" />
                            ) : (
                              <ChevronRight size={12} className="text-amber-400" />
                            )}
                            <Layers size={12} className="text-amber-400" />
                            <span className="text-xs text-slate-300 truncate">{module.name}</span>
                            <span className="text-[10px] text-slate-500 ml-auto">{module.progress}%</span>
                          </div>

                          {expandedModules.has(module.id) && module.assignees?.map(assigneeId => {
                            const employee = employees.find(e => e.id === assigneeId);
                            if (!employee) return null;
                            return (
                              <div
                                key={`${module.id}-${assigneeId}`}
                                className="flex items-center gap-2 px-4 py-2 pl-14 border-b border-slate-800/30 bg-slate-900/30 cursor-pointer hover:bg-slate-800/50"
                                onClick={(e) => { e.stopPropagation(); onEmployeeClick(employee); }}
                              >
                                <div className="w-5 h-5 rounded-full bg-emerald-600/30 flex items-center justify-center">
                                  <User size={10} className="text-emerald-400" />
                                </div>
                                <span className="text-[11px] text-slate-400 hover:text-white transition-colors">{employee.name}</span>
                                <span
                                  className={`text-[9px] px-1 py-0.5 rounded ml-auto ${getTeamBadgeStyle(employee.teamType)}`}
                                >
                                  {employee.teamType === 'AX' ? 'AX' : 'AI-E'}
                                </span>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                  {/* 빈 공간 채우기 */}
                  <div className="flex-1 bg-slate-900/30"></div>
                </div>

                {/* Right Panel - Timeline Bars */}
                <div className="flex-1 relative flex flex-col">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {months.map((month, idx) => (
                      <div
                        key={idx}
                        className="border-r border-slate-700/30 h-full"
                        style={{ width: `${month.width}%` }}
                      />
                    ))}
                  </div>

                  {/* Today Line */}
                  {todayPosition && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500/70 z-10"
                      style={{ left: todayPosition }}
                    >
                      <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-b">
                        Today
                      </div>
                    </div>
                  )}

                  {/* Bars */}
                  {projects.map(project => {
                    const projectBar = getBarPosition(project.startDate, project.endDate);

                    return (
                      <React.Fragment key={project.id}>
                        <div className="relative h-[46px] border-b border-slate-800 flex-shrink-0 overflow-hidden">
                          <div
                            className="absolute top-2 h-7 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20 flex items-center px-2 group cursor-pointer hover:shadow-indigo-500/40 transition-shadow"
                            style={{ left: projectBar.left, width: projectBar.width }}
                          >
                            <div
                              className="absolute inset-y-0 left-0 bg-white/20 rounded-l-md"
                              style={{ width: `${project.progress}%` }}
                            />
                            <span className="relative text-[10px] font-medium text-white truncate">
                              {project.name}
                            </span>

                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 w-48">
                              <div className="text-xs font-bold text-white mb-2">{project.name}</div>
                              <div className="space-y-1 text-[10px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">진행률</span>
                                  <span className="text-white">{project.progress}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">시작일</span>
                                  <span className="text-white">{project.startDate}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">종료일</span>
                                  <span className="text-white">{project.endDate}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">상태</span>
                                  <span className={project.status === 'OnTrack' ? 'text-emerald-400' : 'text-red-400'}>
                                    {project.status === 'OnTrack' ? '정상' : '지연'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {expandedProjects.has(project.id) && workModules[project.id]?.map(module => {
                          const moduleBar = getBarPosition(module.startDate, module.endDate);

                          return (
                            <React.Fragment key={module.id}>
                              <div className="relative h-[38px] border-b border-slate-800/50 flex-shrink-0 overflow-hidden">
                                <div
                                  className="absolute top-1.5 h-5 rounded bg-gradient-to-r from-amber-600 to-orange-600 shadow-md shadow-amber-500/10 flex items-center px-1.5 group cursor-pointer hover:shadow-amber-500/30 transition-shadow"
                                  style={{ left: moduleBar.left, width: moduleBar.width }}
                                >
                                  <div
                                    className="absolute inset-y-0 left-0 bg-white/20 rounded-l"
                                    style={{ width: `${module.progress}%` }}
                                  />
                                  <span className="relative text-[9px] font-medium text-white truncate">
                                    {module.name}
                                  </span>

                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 w-44">
                                    <div className="text-xs font-bold text-white mb-2">{module.name}</div>
                                    <div className="space-y-1 text-[10px]">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">진행률</span>
                                        <span className="text-white">{module.progress}%</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">예상 시간</span>
                                        <span className="text-white">{module.estimatedHours}h</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {module.techStack.slice(0, 2).map((tech, i) => (
                                          <span key={i} className="text-[8px] bg-slate-700 text-slate-300 px-1 py-0.5 rounded">
                                            {tech}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {expandedModules.has(module.id) && module.assignees?.map(assigneeId => {
                                const employee = employees.find(e => e.id === assigneeId);
                                if (!employee) return null;

                                return (
                                  <div key={`${module.id}-${assigneeId}`} className="relative h-[34px] border-b border-slate-800/30 bg-slate-900/20 flex-shrink-0 overflow-hidden">
                                    <div
                                      className="absolute top-1 h-4 rounded bg-gradient-to-r from-emerald-600 to-teal-600 shadow-sm flex items-center px-1 group"
                                      style={{ left: moduleBar.left, width: moduleBar.width }}
                                    >
                                      <span className="text-[8px] font-medium text-white truncate">
                                        {employee.name}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  {/* 빈 공간 채우기 - 그리드 라인과 함께 */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-0 flex pointer-events-none">
                      {months.map((month, idx) => (
                        <div
                          key={`fill-${idx}`}
                          className="border-r border-slate-700/30 h-full"
                          style={{ width: `${month.width}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 사이드 패널: Manager Override + AI Proposal */}
      <div className="w-80 flex-shrink-0 flex flex-col space-y-4">
        {/* Manager Override Mode */}
        <div className="bg-gradient-to-b from-indigo-900/40 to-slate-800 p-4 rounded-xl border border-indigo-500/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <MessageSquare size={16} className="text-white" />
            </div>
            <span className="text-sm font-medium text-indigo-300">Manager Override</span>
          </div>
          <textarea
            placeholder="예: '다음 달 런칭할 마케팅 캠페인 팀 구성해줘'"
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 resize-none h-20"
            value={managerInput}
            onChange={(e) => setManagerInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={handleAiRequest}
            disabled={isLoading || !managerInput.trim()}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <ArrowRight size={14} />
                AI 팀 구성 요청
              </>
            )}
          </button>
        </div>

        {/* AI Auto-Staffing Proposal */}
        {showAiProposal && aiProposal && (
          <div className="flex-1 bg-slate-800 border border-indigo-500/50 rounded-xl p-4 overflow-y-auto relative">
            <div className="absolute top-2 right-2 opacity-5">
              <Cpu size={60} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"/>
                    AI Auto-Staffing
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">{aiProposal.projectName}</p>
                </div>
                <button onClick={() => setShowAiProposal(false)} className="text-slate-500 hover:text-white text-sm">✕</button>
              </div>

              {/* 에러 표시 */}
              {aiProposal.error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                  <p className="text-xs text-red-400">{aiProposal.summary}</p>
                </div>
              )}

              {/* 팀 구성 카드 (동적 렌더링) */}
              {!aiProposal.error && aiProposal.team.length > 0 && (
                <div className="space-y-2 mb-4">
                  {aiProposal.team.map((member, idx) => (
                    <div
                      key={idx}
                      className={`bg-slate-900/50 p-3 rounded-lg border ${
                        member.role === 'Leader' ? 'border-indigo-500/30' : 'border-slate-700'
                      }`}
                    >
                      <div className={`text-[10px] mb-1 ${
                        member.role === 'Leader' ? 'text-indigo-400' : 'text-slate-400'
                      }`}>
                        {member.role === 'Leader' ? 'Recommended Leader' : 'Member'}
                      </div>
                      <div className={`font-bold text-sm ${
                        member.role === 'Leader' ? 'text-white' : 'text-slate-200'
                      }`}>
                        {member.employeeName}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{member.reason}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI 요약 */}
              {!aiProposal.error && aiProposal.summary && (
                <div className="bg-slate-900/30 rounded-lg p-3 mb-4 border border-slate-700/50">
                  <div className="text-[10px] text-indigo-400 mb-1 flex items-center gap-1">
                    <Zap size={10} />
                    AI 분석 요약
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{aiProposal.summary}</p>
                </div>
              )}

              {/* 버튼들 */}
              {!aiProposal.error && (
                <div className="space-y-2">
                  <button
                    onClick={handleApproveTeam}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    팀 구성 승인
                  </button>
                  <button className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg text-xs font-medium transition-colors">
                    수동 조정
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface AnalyticsViewProps {
  employees: typeof EMPLOYEES;
  projects: typeof PROJECTS;
  workModules: Record<number, ProjectTask[]>;
}

const AnalyticsView = ({ employees, projects, workModules }: AnalyticsViewProps) => {
  const [viewMode, setViewMode] = useState<'project' | 'person' | 'performance' | 'salary'>('project');

  const ORG_PERFORMANCE = 78;

  const MEMBER_CONTRIBUTIONS = [
    { id: 1, name: "김철수", role: "Backend Lead", totalOrgImpact: 28, projects: [{ name: "AI 챗봇", val: 80 }, { name: "기타 유지보수", val: 20 }] },
    { id: 2, name: "이영희", role: "PM", totalOrgImpact: 22, projects: [{ name: "마케팅 대시보드", val: 90 }, { name: "기획 회의", val: 10 }] },
    { id: 4, name: "최수민", role: "UI Designer", totalOrgImpact: 18, projects: [{ name: "마케팅 대시보드", val: 100 }] },
    { id: 3, name: "박지성", role: "Frontend Dev", totalOrgImpact: 15, projects: [{ name: "AI 챗봇", val: 60 }, { name: "사내 시스템", val: 40 }] },
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target className="text-indigo-400" /> 
            Performance & Contribution
          </h2>
          <p className="text-sm text-slate-400 mt-1">조직 성과 기여도 분석 리포트</p>
        </div>
        
        <div className="bg-slate-800 p-1 rounded-lg flex border border-slate-700">
          <button 
            onClick={() => setViewMode('project')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'project' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Briefcase size={16} /> By Project
          </button>
          <button
            onClick={() => setViewMode('person')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'person' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Users size={16} /> By Person
          </button>
          <button
            onClick={() => setViewMode('performance')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'performance' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <Award size={16} /> 성과 평가
          </button>
          <button
            onClick={() => setViewMode('salary')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'salary' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <DollarSign size={16} /> 연봉 비교
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 h-full overflow-hidden">
        
        <div className="col-span-1 bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Organization Goal</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-700" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                  strokeDasharray={2 * Math.PI * 88} 
                  strokeDashoffset={2 * Math.PI * 88 * (1 - ORG_PERFORMANCE / 100)} 
                  className="text-indigo-500 transition-all duration-1000 ease-out" 
                />
              </svg>
              <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{ORG_PERFORMANCE}%</span>
                <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Achieved</span>
              </div>
            </div>
            
            <div className="mt-8 w-full space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Revenue</span>
                <span className="text-white font-bold">$4.2M / $5.0M</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-emerald-500 h-full w-[84%]"></div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Product Velocity</span>
                <span className="text-white font-bold">12 Sprints</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-blue-500 h-full w-[92%]"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-4 overflow-y-auto pr-2">
          
          {viewMode === 'project' ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">HIERARCHY</span>
                <span className="text-xs text-slate-500">Org Goal &gt; Project Portion &gt; Member Contribution</span>
              </div>

              {projects.map(project => (
                <div key={project.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">{project.name}</h4>
                      <p className="text-xs text-slate-400">Contribution to Org Goal</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-indigo-400">{project.contributionToOrg}%</span>
                      <div className="text-[10px] text-slate-500">Impact Score</div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-700/50 h-2 rounded-full mb-6 overflow-hidden">
                    <div className="bg-indigo-500 h-full relative" style={{ width: `${project.contributionToOrg}%` }}>
                       <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50"></div>
                    </div>
                  </div>

                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                    <Users size={12} /> Team Contribution Breakdown
                  </h5>
                  <div className="space-y-3 pl-4 border-l border-slate-700">
                    {project.members.map(memId => {
                      const member = employees.find(e => e.id === memId);
                      const contribution = memId === 1 ? 65 : memId === 2 ? 80 : 45;

                      return (
                        <div key={memId} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                            {member?.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-300">{member?.name}</span>
                              <span className="text-white font-bold">{contribution}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-indigo-600 to-purple-500 h-full" style={{ width: `${contribution}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : viewMode === 'person' ? (
            <>
               <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">RANKING</span>
                <span className="text-xs text-slate-500">Individual Impact to Entire Organization</span>
              </div>

              <div className="space-y-4">
                {MEMBER_CONTRIBUTIONS.sort((a,b) => b.totalOrgImpact - a.totalOrgImpact).map((person, idx) => (
                  <div key={person.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-6 relative overflow-hidden group">
                    <div className="absolute -left-4 -top-4 w-16 h-16 bg-slate-700/50 rounded-full flex items-end justify-end p-4 text-2xl font-bold text-slate-600 group-hover:text-emerald-500/50 transition-colors">
                      #{idx + 1}
                    </div>

                    <div className="ml-8 w-12 h-12 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-sm font-bold text-white z-10">
                      {person.name[0]}
                    </div>

                    <div className="flex-1 z-10">
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-white">{person.name}</h4>
                          <p className="text-xs text-slate-400">{person.role}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-emerald-400">{person.totalOrgImpact}%</span>
                          <span className="text-xs text-slate-500 block">Total Org Share</span>
                        </div>
                      </div>

                      <div className="w-full h-3 bg-slate-900 rounded-full flex overflow-hidden">
                        {person.projects.map((proj, pIdx) => (
                          <div
                            key={pIdx}
                            className={`h-full ${pIdx === 0 ? 'bg-emerald-500' : 'bg-emerald-800'} hover:opacity-80 transition-opacity cursor-help`}
                            style={{ width: `${proj.val}%` }}
                            title={`${proj.name}: ${proj.val}% of their effort`}
                          ></div>
                        ))}
                      </div>
                      <div className="flex gap-4 mt-2">
                        {person.projects.map((proj, pIdx) => (
                           <div key={pIdx} className="flex items-center gap-1 text-[10px] text-slate-400">
                             <div className={`w-2 h-2 rounded-full ${pIdx === 0 ? 'bg-emerald-500' : 'bg-emerald-800'}`}></div>
                             {proj.name} ({proj.val}%)
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : viewMode === 'performance' ? (
            // Performance Evaluation View
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">성과 평가</span>
                <span className="text-xs text-slate-500">직무체계 기반 3요소 가중치 평가 (프로젝트 40% + Task 35% + Skill 25%)</span>
              </div>

              <div className="space-y-4">
                {employees.map(emp => {
                  const score = calculatePerformanceScore(emp, projects, workModules, '2025-Q4');
                  return (
                    <div key={emp.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 hover:border-amber-500/30 transition-all">
                      {/* 헤더: 이름, 팀, 등급 */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                            {emp.avatar}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">{emp.name}</h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getTeamBadgeStyle(emp.teamType)}`}>
                              {getTeamLabel(emp.teamType)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getGradeColor(score.grade)}`}>{score.grade}</div>
                          <span className="text-lg font-semibold text-white">{score.totalScore}점</span>
                        </div>
                      </div>

                      {/* 3가지 평가 요소 바 */}
                      <div className="space-y-3">
                        {/* 프로젝트 Output (40%) */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">프로젝트 Output <span className="text-slate-500">(40%)</span></span>
                            <span className="text-indigo-400 font-medium">{score.projectScore.raw}점 → {score.projectScore.weighted}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full transition-all" style={{ width: `${score.projectScore.raw}%` }} />
                          </div>
                          <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                            <span>완료: {score.projectScore.completedProjects}/{score.projectScore.totalProjects}</span>
                            <span>평균 진행률: {score.projectScore.averageProgress}%</span>
                            <span>기한 준수: {score.projectScore.onTimeDelivery}%</span>
                          </div>
                        </div>

                        {/* Task Output (35%) */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Task Output <span className="text-slate-500">(35%)</span></span>
                            <span className="text-emerald-400 font-medium">{score.taskScore.raw}점 → {score.taskScore.weighted}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${score.taskScore.raw}%` }} />
                          </div>
                          <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                            <span>완료: {score.taskScore.completedTasks}/{score.taskScore.totalTasks}</span>
                            <span>다양성: {score.taskScore.taskDiversity}개 영역</span>
                            <span>평균 투입률: {score.taskScore.averageAllocation}%</span>
                          </div>
                        </div>

                        {/* Skill 현황 (25%) */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Skill 현황 <span className="text-slate-500">(25%)</span></span>
                            <span className="text-cyan-400 font-medium">{score.skillScore.raw}점 → {score.skillScore.weighted}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full transition-all" style={{ width: `${score.skillScore.raw}%` }} />
                          </div>
                          <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                            <span>보유: {score.skillScore.totalSkills}개</span>
                            <span>필수 커버리지: {score.skillScore.requiredSkillCoverage}%</span>
                            <span>매칭률: {score.skillScore.skillMatchRate}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 등급 기준 안내 */}
              <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <div className="flex gap-6 justify-center text-xs">
                  <span><span className="text-amber-400 font-bold">S</span> 90점 이상</span>
                  <span><span className="text-emerald-400 font-bold">A</span> 80~89점</span>
                  <span><span className="text-cyan-400 font-bold">B</span> 70~79점</span>
                  <span><span className="text-slate-400 font-bold">C</span> 60~69점</span>
                  <span><span className="text-red-400 font-bold">D</span> 60점 미만</span>
                </div>
              </div>
            </>
          ) : (
            // Salary Comparison View (연봉 비교)
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2 py-1 rounded border border-pink-500/20">연봉 비교</span>
                <span className="text-xs text-slate-500">LinkedIn Salary Insights 기준 시장 데이터 비교</span>
              </div>

              <div className="space-y-4">
                {employees.map(emp => {
                  const benchmark = getSalaryBenchmark(emp.teamType, emp.experienceLevel || 'mid');
                  const salary = emp.salary || 0;
                  const diff = salary - benchmark.median;
                  const percentile = salary <= benchmark.p25 ? 25 : salary >= benchmark.p75 ? 75 : Math.round(25 + (salary - benchmark.p25) / (benchmark.p75 - benchmark.p25) * 50);
                  const comparison = diff > 500 ? 'above' : diff < -500 ? 'below' : 'at';

                  return (
                    <div key={emp.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 hover:border-pink-500/30 transition-all">
                      {/* 헤더: 이름, 팀, 연봉 */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                            {emp.avatar}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">{emp.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getTeamBadgeStyle(emp.teamType)}`}>
                                {getTeamLabel(emp.teamType)}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {emp.experienceLevel === 'junior' ? '주니어' : emp.experienceLevel === 'mid' ? '미드레벨' : '시니어'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">{salary.toLocaleString()}만원</div>
                          <span className={`text-sm font-medium ${
                            comparison === 'above' ? 'text-emerald-400' : comparison === 'below' ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            {comparison === 'above' ? '시장 상위' : comparison === 'below' ? '시장 하위' : '시장 평균'}
                            <span className="ml-1 text-xs opacity-70">({percentile}%ile)</span>
                          </span>
                        </div>
                      </div>

                      {/* 시장 비교 바 */}
                      <div className="relative h-8 bg-slate-700/50 rounded-lg overflow-hidden mb-2">
                        {/* P25-P75 범위 영역 */}
                        <div
                          className="absolute h-full bg-slate-600/50"
                          style={{
                            left: `${(benchmark.p25 / (benchmark.p75 * 1.3)) * 100}%`,
                            width: `${((benchmark.p75 - benchmark.p25) / (benchmark.p75 * 1.3)) * 100}%`
                          }}
                        />
                        {/* 중위값 라인 */}
                        <div
                          className="absolute w-0.5 h-full bg-white/50"
                          style={{ left: `${(benchmark.median / (benchmark.p75 * 1.3)) * 100}%` }}
                        />
                        {/* 현재 연봉 마커 */}
                        <div
                          className={`absolute w-3 h-3 rounded-full top-1/2 -translate-y-1/2 border-2 border-white ${
                            comparison === 'above' ? 'bg-emerald-500' : comparison === 'below' ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ left: `calc(${Math.min((salary / (benchmark.p75 * 1.3)) * 100, 100)}% - 6px)` }}
                        />
                        {/* 현재 연봉 텍스트 */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 text-[10px] font-medium text-white bg-slate-900/80 px-1 rounded"
                          style={{ left: `calc(${Math.min((salary / (benchmark.p75 * 1.3)) * 100, 100)}% + 10px)` }}
                        >
                          {salary.toLocaleString()}
                        </div>
                      </div>

                      {/* 범례 */}
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>P25: {benchmark.p25.toLocaleString()}만</span>
                        <span>중위: {benchmark.median.toLocaleString()}만</span>
                        <span>P75: {benchmark.p75.toLocaleString()}만</span>
                      </div>

                      {/* 차이 표시 */}
                      <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                        <span className="text-xs text-slate-400">시장 중위값 대비</span>
                        <span className={`text-sm font-bold ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          {diff > 0 ? '+' : ''}{diff.toLocaleString()}만원 ({diff > 0 ? '+' : ''}{((diff / benchmark.median) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 데이터 출처 안내 */}
              <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <div className="text-xs text-slate-500 text-center">
                  * 시장 데이터: LinkedIn Salary Insights, Glassdoor 기준 (2024년 하반기)
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

// --- Simulation View ---

interface SimulationViewProps {
  employees: typeof EMPLOYEES;
  projects: typeof PROJECTS;
}

// Step 1: 음성 녹음 씬
const VoiceRecordingScene = ({ isActive }: { isActive: boolean }) => {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState('');
  const fullText = "마케팅 캠페인 분석 시스템을 만들어주세요. 3개월 내 완료 희망합니다.";

  useEffect(() => {
    if (!isActive) {
      setPhase(0);
      setTypedText('');
      return;
    }
    const timer1 = setTimeout(() => setPhase(1), 500);
    const timer2 = setTimeout(() => setPhase(2), 2000);
    const timer3 = setTimeout(() => setPhase(3), 4000);
    return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
  }, [isActive]);

  useEffect(() => {
    if (phase === 2 && typedText.length < fullText.length) {
      const timer = setTimeout(() => {
        setTypedText(fullText.slice(0, typedText.length + 1));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [phase, typedText, fullText]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <Mic className="text-red-400" /> 음성 녹음 시스템
      </h2>

      <div className="flex items-center gap-12">
        {/* 녹음 영역 */}
        <div className={`w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500 ${
          phase >= 1 ? 'border-red-500 bg-red-500/10' : 'border-slate-600 bg-slate-800'
        }`}>
          <Mic size={48} className={phase >= 1 ? 'text-red-400 animate-pulse' : 'text-slate-500'} />
          {phase >= 1 && phase < 2 && (
            <div className="flex gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-400 rounded-full animate-pulse"
                  style={{
                    height: `${20 + Math.random() * 20}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
          {phase >= 2 && <span className="text-xs text-emerald-400 mt-2">변환 완료</span>}
        </div>

        {/* 화살표 */}
        <ArrowRight size={32} className={`transition-all duration-500 ${phase >= 2 ? 'text-indigo-400' : 'text-slate-600'}`} />

        {/* 텍스트 변환 결과 */}
        <div className={`w-80 p-6 rounded-xl border transition-all duration-500 ${
          phase >= 2 ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={16} className="text-indigo-400" />
            <span className="text-sm text-slate-400">음성 → 텍스트</span>
          </div>
          <p className="text-white min-h-[60px]">
            {phase >= 2 ? typedText : ''}
            {phase === 2 && typedText.length < fullText.length && <span className="animate-pulse">|</span>}
          </p>
        </div>
      </div>

      {/* 프로젝트 생성 카드 */}
      {phase >= 3 && (
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-pulse">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-400" />
            <span className="text-emerald-300">프로젝트 자동 생성 완료: "마케팅 캠페인 분석 시스템"</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Step 2: 발주 승인 씬
const ApprovalScene = ({ isActive }: { isActive: boolean }) => {
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!isActive) { setApproved(false); return; }
    const timer = setTimeout(() => setApproved(true), 3000);
    return () => clearTimeout(timer);
  }, [isActive]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <CheckCircle className="text-emerald-400" /> 프로젝트 발주 승인
      </h2>

      <div className={`w-[500px] p-6 rounded-xl border transition-all duration-500 ${
        approved ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-800'
      }`}>
        <h3 className="text-xl font-bold text-white mb-4">마케팅 캠페인 분석 시스템</h3>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div><span className="text-slate-400">예상 기간:</span> <span className="text-white">3개월</span></div>
          <div><span className="text-slate-400">필요 인력:</span> <span className="text-white">4명</span></div>
          <div><span className="text-slate-400">예상 비용:</span> <span className="text-white">₩45,000,000</span></div>
          <div><span className="text-slate-400">카테고리:</span> <span className="text-white">Marketing</span></div>
        </div>

        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">추천 팀:</div>
          <div className="flex gap-2">
            {['김철수 (Lead)', '박지성', '최수민', '이영희'].map((name, i) => (
              <div key={i} className="px-3 py-1 bg-slate-700 rounded-full text-xs text-white">
                {name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600">
            거절
          </button>
          <button className={`flex-1 py-2 rounded-lg transition-all ${
            approved
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}>
            {approved ? '✓ 승인됨' : '승인'}
          </button>
        </div>
      </div>

      {approved && (
        <div className="text-emerald-400 animate-pulse flex items-center gap-2">
          <CheckCircle size={20} />
          프로젝트가 승인되었습니다!
        </div>
      )}
    </div>
  );
};

// Step 3: 대시보드 업데이트 씬
const DashboardUpdateScene = ({ isActive }: { isActive: boolean }) => {
  const [projectCount, setProjectCount] = useState(2);
  const [loads, setLoads] = useState({ kim: 85, park: 30 });

  useEffect(() => {
    if (!isActive) { setProjectCount(2); setLoads({ kim: 85, park: 30 }); return; }
    const timer1 = setTimeout(() => setProjectCount(3), 1000);
    const timer2 = setTimeout(() => setLoads({ kim: 100, park: 45 }), 1500);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [isActive]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <LayoutDashboard className="text-indigo-400" /> 대시보드 실시간 업데이트
      </h2>

      <div className="grid grid-cols-2 gap-6 w-[600px]">
        {/* 프로젝트 수 */}
        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
          <div className="text-sm text-slate-400 mb-2">총 프로젝트</div>
          <div className="text-4xl font-bold text-white flex items-center gap-2">
            {projectCount}
            {projectCount > 2 && <TrendingUp className="text-emerald-400" size={24} />}
          </div>
        </div>

        {/* 신규 프로젝트 알림 */}
        {projectCount > 2 && (
          <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/30 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="text-indigo-400" size={16} />
              <span className="text-xs text-indigo-400">NEW</span>
            </div>
            <div className="text-white font-medium">마케팅 캠페인 분석</div>
          </div>
        )}

        {/* 김철수 부하율 */}
        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-white">김철수</span>
            <span className={`text-sm ${loads.kim >= 100 ? 'text-red-400' : 'text-slate-400'}`}>
              {loads.kim}% {loads.kim >= 100 && '⚠️'}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${loads.kim >= 100 ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${loads.kim}%` }}
            />
          </div>
        </div>

        {/* 박지성 부하율 */}
        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-white">박지성</span>
            <span className="text-sm text-slate-400">{loads.park}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-1000"
              style={{ width: `${loads.park}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 4: 챗봇 알람 씬
const ChatbotAlertScene = ({ isActive }: { isActive: boolean }) => {
  const [visibleMessages, setVisibleMessages] = useState(0);

  const messages = [
    { time: '10:32', type: 'info', text: '📢 [마케팅 캠페인 분석] 프로젝트 시작!\n담당: 김철수, 박지성, 최수민, 이영희' },
    { time: '15:45', type: 'warning', text: '⚠️ 유관 업체 답변 딜레이 1일째\n@김철수 확인 부탁드립니다.' },
    { time: '09:00', type: 'success', text: '✅ 1단계 완료! 다음 단계: UI 디자인\n예상 소요: 2주' },
  ];

  useEffect(() => {
    if (!isActive) { setVisibleMessages(0); return; }
    const timers = messages.map((_, i) =>
      setTimeout(() => setVisibleMessages(i + 1), (i + 1) * 1500)
    );
    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <MessageSquare className="text-blue-400" /> Teams/Notion 자동 알림
      </h2>

      <div className="w-[500px] space-y-4">
        {messages.slice(0, visibleMessages).map((msg, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border transition-all duration-300 ${
              msg.type === 'warning' ? 'border-amber-500/30 bg-amber-500/10' :
              msg.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10' :
              'border-slate-600 bg-slate-800'
            }`}
            style={{ animation: 'slideIn 0.3s ease-out' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                <Cpu size={12} className="text-white" />
              </div>
              <span className="text-sm font-medium text-indigo-400">HR Bot</span>
              <span className="text-xs text-slate-500 ml-auto">{msg.time}</span>
            </div>
            <p className="text-white whitespace-pre-line text-sm">{msg.text}</p>
          </div>
        ))}

        {visibleMessages < messages.length && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            타이핑 중...
          </div>
        )}
      </div>
    </div>
  );
};

// Step 5: 인력 수급 씬
const TalentAcquisitionScene = ({ isActive }: { isActive: boolean }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isActive) { setPhase(0); return; }
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <UserPlus className="text-purple-400" /> 자동 인력 수급 시스템
      </h2>

      <div className="text-amber-400 mb-4">
        ⚠️ 부족 감지: "데이터 엔지니어"
      </div>

      <div className="flex flex-col items-center gap-4 w-[500px]">
        {/* 사내 검색 */}
        <div className="flex items-center gap-4 w-full">
          <div className={`flex-1 p-4 rounded-xl border text-center transition-all ${
            phase >= 1 ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800'
          }`}>
            <Users size={24} className="mx-auto mb-2 text-indigo-400" />
            <div className="text-white">사내 검색</div>
            {phase === 1 && <div className="text-xs text-slate-400 mt-1">검색 중...</div>}
          </div>
          <ArrowRight className={phase >= 2 ? 'text-indigo-400' : 'text-slate-600'} />
          <div className={`flex-1 p-4 rounded-xl border text-center transition-all ${
            phase >= 2 ? 'border-red-500 bg-red-500/10' : 'border-slate-700 bg-slate-800'
          }`}>
            <AlertTriangle size={24} className={`mx-auto mb-2 ${phase >= 2 ? 'text-red-400' : 'text-slate-500'}`} />
            <div className={phase >= 2 ? 'text-red-400' : 'text-slate-500'}>매칭 없음</div>
          </div>
        </div>

        {/* 용역 검색 */}
        {phase >= 2 && (
          <div className="flex items-center gap-4 w-full">
            <div className={`flex-1 p-4 rounded-xl border text-center transition-all ${
              phase >= 3 ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800'
            }`}>
              <Database size={24} className="mx-auto mb-2 text-purple-400" />
              <div className="text-white">용역 업체 연동</div>
              {phase === 2 && <div className="text-xs text-slate-400 mt-1">검색 중...</div>}
            </div>
            <ArrowRight className={phase >= 3 ? 'text-purple-400' : 'text-slate-600'} />
            <div className={`flex-1 p-4 rounded-xl border text-center transition-all ${
              phase >= 3 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800'
            }`}>
              <CheckCircle size={24} className={`mx-auto mb-2 ${phase >= 3 ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div className={phase >= 3 ? 'text-emerald-400' : 'text-slate-500'}>후보 3명 발견!</div>
            </div>
          </div>
        )}

        {/* 배정 완료 */}
        {phase >= 4 && (
          <div className="w-full p-4 rounded-xl border border-emerald-500 bg-emerald-500/10 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                HG
              </div>
              <div>
                <div className="text-white font-medium">홍길동 (용역)</div>
                <div className="text-xs text-slate-400">Python, Airflow, BigQuery</div>
              </div>
              <div className="ml-auto text-emerald-400">배정 완료 ✓</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Step 6: 성과 평가 씬
const PerformanceEvalScene = ({ isActive }: { isActive: boolean }) => {
  const [progress, setProgress] = useState(0);

  const performanceData = [
    { name: '김철수', contribution: 80, color: 'bg-indigo-500' },
    { name: '박지성', contribution: 70, color: 'bg-purple-500' },
    { name: '최수민', contribution: 60, color: 'bg-pink-500' },
    { name: '이영희', contribution: 90, color: 'bg-emerald-500' },
  ];

  useEffect(() => {
    if (!isActive) { setProgress(0); return; }
    const timer = setTimeout(() => setProgress(100), 500);
    return () => clearTimeout(timer);
  }, [isActive]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
        <BarChart2 className="text-emerald-400" /> 자동 성과 평가
      </h2>

      <div className="text-slate-400">
        프로젝트: 마케팅 캠페인 분석 (진행률 75%)
      </div>

      <div className="w-[500px] p-6 rounded-xl border border-slate-700 bg-slate-800">
        <div className="text-sm text-slate-400 mb-4">개인별 기여도</div>

        <div className="space-y-4">
          {performanceData.map((person, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className="text-white">{person.name}</span>
                <span className="text-slate-400">{progress > 0 ? person.contribution : 0}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${person.color} transition-all duration-1000`}
                  style={{
                    width: progress > 0 ? `${person.contribution}%` : '0%',
                    transitionDelay: `${i * 200}ms`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {progress > 0 && (
        <div className="flex gap-4 mt-4">
          <div className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            🏆 MVP: 이영희 (90%)
          </div>
          <div className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
            ⚡ 평균 기여도: 75%
          </div>
        </div>
      )}
    </div>
  );
};

// 메인 SimulationView 컴포넌트
const SimulationView = ({ employees, projects }: SimulationViewProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const steps = [
    { id: 1, name: "음성 녹음", icon: Mic, description: "F&F 포털/노션에서 음성으로 프로젝트 요청" },
    { id: 2, name: "발주 승인", icon: CheckCircle, description: "관리자가 프로젝트 내용 확인 후 승인" },
    { id: 3, name: "대시보드 업데이트", icon: LayoutDashboard, description: "프로젝트/인력 현황 실시간 반영" },
    { id: 4, name: "챗봇 알람", icon: MessageSquare, description: "Teams/Notion으로 자동 알림 전송" },
    { id: 5, name: "인력 수급", icon: UserPlus, description: "부족 인력 자동 검색 및 배정" },
    { id: 6, name: "성과 평가", icon: BarChart2, description: "프로젝트 완료 시 자동 평가" },
  ];

  useEffect(() => {
    if (isPlaying && currentStep < 6) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 6000);
      return () => clearTimeout(timer);
    }
    if (currentStep >= 6) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep]);

  const handleStart = () => {
    if (currentStep === 0) setCurrentStep(1);
    setIsPlaying(true);
  };

  const handlePause = () => setIsPlaying(false);

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(prev => prev + 1);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Zap className="text-amber-400" />
            시스템 시뮬레이션
          </h1>
          <p className="text-sm text-slate-400 mt-1">HR 오케스트레이션 시스템 데모</p>
        </div>

        {/* 컨트롤 패널 */}
        <div className="flex items-center gap-3">
          {!isPlaying ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              <Play size={18} /> {currentStep === 0 ? '시작' : '재생'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
            >
              <Pause size={18} /> 일시정지
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={currentStep >= 6}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <SkipForward size={18} /> 다음
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RotateCcw size={18} /> 처음부터
          </button>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  currentStep >= step.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  <step.icon size={18} />
                </div>
                <span className={`text-xs mt-2 ${currentStep >= step.id ? 'text-white' : 'text-slate-500'}`}>
                  {step.name}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 transition-all ${
                  currentStep > step.id ? 'bg-indigo-600' : 'bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 현재 단계 설명 */}
      {currentStep > 0 && currentStep <= 6 && (
        <div className="text-center mb-4 text-slate-400">
          Step {currentStep}/6: {steps[currentStep - 1]?.description}
        </div>
      )}

      {/* 메인 시뮬레이션 영역 */}
      <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {currentStep === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Zap size={64} className="text-slate-600 mb-4" />
            <p className="text-lg">시작 버튼을 눌러 시뮬레이션을 시작하세요</p>
          </div>
        )}
        {currentStep === 1 && <VoiceRecordingScene isActive={true} />}
        {currentStep === 2 && <ApprovalScene isActive={true} />}
        {currentStep === 3 && <DashboardUpdateScene isActive={true} />}
        {currentStep === 4 && <ChatbotAlertScene isActive={true} />}
        {currentStep === 5 && <TalentAcquisitionScene isActive={true} />}
        {currentStep === 6 && <PerformanceEvalScene isActive={true} />}
      </div>
    </div>
  );
};

// ============================================
// Phase 3: 팀별 인력 현황 및 Task-Skill 매트릭스 컴포넌트
// ============================================

// TeamOverviewPanel - 팀별 인력 현황 패널
interface TeamOverviewPanelProps {
  employees: ExtendedEmployee[];
  selectedTeam: TeamType | 'ALL';
  onTeamChange: (team: TeamType | 'ALL') => void;
}

const TeamOverviewPanel = ({ employees, selectedTeam, onTeamChange }: TeamOverviewPanelProps) => {
  const axTeam = employees.filter(e => e.teamType === 'AX');
  const aiTeam = employees.filter(e => e.teamType === 'AI_ENGINEERING');

  const filteredEmployees = selectedTeam === 'ALL'
    ? employees
    : employees.filter(e => e.teamType === selectedTeam);

  // 팀 평균 투입률 계산
  const avgAllocation = (team: ExtendedEmployee[]) => {
    if (team.length === 0) return 0;
    return Math.round(team.reduce((sum, e) => sum + e.totalAllocation, 0) / team.length);
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Users className="text-indigo-400" size={20} />
        팀별 인력 현황
      </h2>

      {/* 팀 탭 */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'ALL' as const, label: '전체', count: employees.length },
          { id: 'AX' as const, label: 'AX팀', count: axTeam.length },
          { id: 'AI_ENGINEERING' as const, label: 'AI 엔지니어링팀', count: aiTeam.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => onTeamChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedTeam === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* 팀 요약 통계 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">전체 인원</div>
          <div className="text-xl font-bold text-white">{filteredEmployees.length}명</div>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">평균 투입률</div>
          <div className={`text-xl font-bold ${avgAllocation(filteredEmployees) > 80 ? 'text-red-400' : avgAllocation(filteredEmployees) > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {avgAllocation(filteredEmployees)}%
          </div>
        </div>
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">고위험 인원</div>
          <div className="text-xl font-bold text-red-400">
            {filteredEmployees.filter(e => e.risk === 'High').length}명
          </div>
        </div>
      </div>

      {/* 직원별 투입률 바 */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {filteredEmployees.map(emp => (
          <div key={emp.id} className="flex items-center gap-3 bg-slate-900/30 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-slate-700 text-white flex-shrink-0">
              {emp.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-white truncate">{emp.name}</span>
                <span className={`text-xs font-bold ${
                  emp.totalAllocation > 80 ? 'text-red-400' :
                  emp.totalAllocation > 60 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {emp.totalAllocation}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    emp.totalAllocation > 80 ? 'bg-red-500' :
                    emp.totalAllocation > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(emp.totalAllocation, 100)}%` }}
                />
                {emp.totalAllocation > 100 && (
                  <div
                    className="h-full bg-red-600 animate-pulse"
                    style={{ width: `${emp.totalAllocation - 100}%`, marginTop: '-6px' }}
                  />
                )}
              </div>
              <div className="flex gap-1 mt-1 flex-wrap">
                {emp.skillSet.slice(0, 3).map((skill, i) => {
                  const skillDef = SKILL_DEFINITIONS.find(s => s.id === skill);
                  return (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                      {skillDef?.name || skill}
                    </span>
                  );
                })}
                {emp.skillSet.length > 3 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-600 text-slate-300">
                    +{emp.skillSet.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// TaskSkillMatrixView - Task-Skill 매트릭스 시각화
interface TaskSkillMatrixViewProps {
  employees: ExtendedEmployee[];
  selectedTeam: TeamType | 'ALL';
}

const TaskSkillMatrixView = ({ employees, selectedTeam }: TaskSkillMatrixViewProps) => {
  const [selectedTask, setSelectedTask] = useState<TaskCategory | null>(null);

  // 선택된 팀의 Tasks 가져오기
  const tasks = selectedTeam === 'ALL'
    ? TASK_DEFINITIONS.slice(0, 12)  // 전체일 때 주요 12개만 표시
    : getTasksByTeam(selectedTeam);

  // 선택된 Task의 스킬 보유자 찾기
  const getSkillHolders = (skillId: SkillType) => {
    return employees.filter(e => e.skillSet.includes(skillId));
  };

  const selectedTaskDef = selectedTask ? TASK_DEFINITIONS.find(t => t.id === selectedTask) : null;

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Layers className="text-purple-400" size={20} />
        Task-Skill 매트릭스
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Task 목록 */}
        <div>
          <h3 className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Tasks</h3>
          <div className="space-y-1 max-h-[250px] overflow-y-auto">
            {tasks.slice(0, 10).map(task => {
              const taskDef = TASK_DEFINITIONS.find(t => t.id === task.id);
              const requiredSkillCount = taskDef?.requiredSkills.length || 0;

              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task.id)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                    selectedTask === task.id
                      ? 'bg-purple-600/30 border border-purple-500/50 text-white'
                      : 'bg-slate-900/50 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{task.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      task.team === 'AX' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {task.team === 'AX' ? 'AX' : 'AI'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    필수 스킬 {requiredSkillCount}개
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택된 Task의 스킬 요구사항 */}
        <div>
          <h3 className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Required Skills</h3>
          {selectedTaskDef ? (
            <div className="space-y-2">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <div className="text-sm font-medium text-white mb-2">{selectedTaskDef.name}</div>
                <div className="text-xs text-slate-400 mb-3">{selectedTaskDef.description}</div>

                {/* 필수 스킬 */}
                <div className="mb-3">
                  <div className="text-[10px] text-red-400 uppercase tracking-wide mb-1">● 필수</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTaskDef.requiredSkills.map(skillId => {
                      const skillDef = SKILL_DEFINITIONS.find(s => s.id === skillId);
                      const holders = getSkillHolders(skillId);
                      return (
                        <span
                          key={skillId}
                          className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30"
                          title={`보유자: ${holders.map(h => h.name).join(', ') || '없음'}`}
                        >
                          {skillDef?.name || skillId}
                          <span className="ml-1 text-red-400">({holders.length})</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 권장 스킬 */}
                <div>
                  <div className="text-[10px] text-amber-400 uppercase tracking-wide mb-1">○ 권장</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTaskDef.recommendedSkills.map(skillId => {
                      const skillDef = SKILL_DEFINITIONS.find(s => s.id === skillId);
                      const holders = getSkillHolders(skillId);
                      return (
                        <span
                          key={skillId}
                          className="text-[10px] px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          title={`보유자: ${holders.map(h => h.name).join(', ') || '없음'}`}
                        >
                          {skillDef?.name || skillId}
                          <span className="ml-1 text-amber-400">({holders.length})</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 적합 인력 추천 */}
              <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                <div className="text-xs text-emerald-400 font-medium mb-2">✓ 적합 인력</div>
                <div className="flex flex-wrap gap-2">
                  {employees
                    .filter(e => {
                      const matchCount = selectedTaskDef.requiredSkills.filter(s => e.skillSet.includes(s)).length;
                      return matchCount >= Math.ceil(selectedTaskDef.requiredSkills.length / 2);
                    })
                    .slice(0, 4)
                    .map(emp => (
                      <div key={emp.id} className="flex items-center gap-1 bg-slate-900/50 px-2 py-1 rounded">
                        <span className="w-5 h-5 rounded-full bg-slate-700 text-[9px] flex items-center justify-center text-white">
                          {emp.avatar}
                        </span>
                        <span className="text-[10px] text-white">{emp.name}</span>
                        <span className={`text-[9px] ${emp.totalAllocation > 80 ? 'text-red-400' : 'text-slate-400'}`}>
                          ({emp.totalAllocation}%)
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 text-center">
              <Layers size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Task를 선택하면 필요 스킬을 확인할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TalentViewProps {
  employees: ExtendedEmployee[];
  onEmployeeClick: (employee: ExtendedEmployee) => void;
}

const TalentView = ({ employees, onEmployeeClick }: TalentViewProps) => {
  const [selectedTeam, setSelectedTeam] = useState<TeamType | 'ALL'>('ALL');

  // 팀 필터링된 직원 목록
  const filteredEmployees = selectedTeam === 'ALL'
    ? employees
    : employees.filter(emp => emp.teamType === selectedTeam);

  return (
  <div className="grid grid-cols-2 gap-6 h-full overflow-hidden">
    {/* 왼쪽: 팀별 인력 현황 (통합 - Live Personas 제거) */}
    <div className="flex flex-col h-full overflow-hidden">
      {/* 팀 선택 탭 */}
      <div className="flex gap-2 mb-4 flex-shrink-0">
        {(['ALL', 'AX', 'AI_ENGINEERING'] as const).map(team => (
          <button
            key={team}
            onClick={() => setSelectedTeam(team)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              selectedTeam === team
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {team === 'ALL' ? '전체' : team === 'AX' ? 'AX팀' : 'AI 엔지니어링팀'}
            <span className="ml-1 text-[10px] opacity-70">
              ({team === 'ALL' ? employees.length : employees.filter(e => e.teamType === team).length})
            </span>
          </button>
        ))}
      </div>

      {/* 직원 목록 (스크롤 가능) */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex-1 overflow-y-auto min-h-0">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 sticky top-0 bg-slate-800 pb-2">
          <Users size={18} className="text-cyan-400" />
          팀 인력 현황
          <span className="ml-auto text-xs text-slate-400 font-normal">{filteredEmployees.length}명</span>
        </h2>
        <div className="space-y-3">
          {filteredEmployees.map(emp => (
            <div
              key={emp.id}
              className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:bg-slate-900 hover:border-slate-600 transition-all cursor-pointer group"
              onClick={() => onEmployeeClick(emp)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow">
                    {emp.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-bold group-hover:text-cyan-400 transition-colors">{emp.name}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getTeamBadgeStyle(emp.teamType)}`}>
                      {getTeamLabel(emp.teamType)}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  emp.totalAllocation > 100
                    ? 'bg-red-500/20 text-red-400'
                    : emp.totalAllocation >= 80
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {emp.totalAllocation}%
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {emp.skillSet.slice(0, 4).map((skillId) => {
                  const skillDef = SKILL_DEFINITIONS.find(s => s.id === skillId);
                  return (
                    <span key={skillId} className="text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded">
                      {skillDef?.name || skillId}
                    </span>
                  );
                })}
                {emp.skillSet.length > 4 && (
                  <span className="text-[10px] text-slate-500">+{emp.skillSet.length - 4}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* 오른쪽: Task-Skill 매트릭스 + Auto-Hiring + Skill Gap */}
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <TaskSkillMatrixView
        employees={employees}
        selectedTeam={selectedTeam}
      />

      {/* Auto-Hiring + Skill Gap 스크롤 영역 */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="text-emerald-400" size={16} />
              Auto-Hiring Agent
            </h2>
            <span className="text-[10px] text-emerald-400 animate-pulse">● Active</span>
          </div>

          <div className="space-y-2">
            {[
              { label: "Sourced", count: 142 },
              { label: "Screened", count: 45 },
              { label: "Interview", count: 12 },
              { label: "Offer", count: 3 },
            ].map((step, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded-lg">
                <span className="text-xs text-slate-400">{step.label}</span>
                <span className="text-xs font-bold text-white">{step.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex-shrink-0">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <ShieldAlert className="text-amber-400" size={16} />
            Skill Gap Analysis
          </h2>

          {/* 여러 스킬 갭 표시 */}
          <div className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
              <p className="text-xs text-amber-200 font-medium mb-1">React Native 역량 부족 감지</p>
              <p className="text-[10px] text-amber-400/80 mb-2">모바일 프로젝트를 위해 2명의 숙련자가 필요합니다.</p>
              <button className="w-full bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-[10px] py-1.5 rounded border border-amber-500/30 transition-colors">
                교육 커리큘럼 생성
              </button>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-lg">
              <p className="text-xs text-cyan-200 font-medium mb-1">Kubernetes 전문가 필요</p>
              <p className="text-[10px] text-cyan-400/80 mb-2">인프라 확장을 위해 1명의 전문가가 필요합니다.</p>
              <button className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-[10px] py-1.5 rounded border border-cyan-500/30 transition-colors">
                채용 제안 보기
              </button>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg">
              <p className="text-xs text-purple-200 font-medium mb-1">프롬프트 엔지니어링 역량 강화</p>
              <p className="text-[10px] text-purple-400/80 mb-2">AI 프로젝트 확대를 위해 3명 추가 교육 권장</p>
              <button className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[10px] py-1.5 rounded border border-purple-500/30 transition-colors">
                교육 일정 확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

// 초기 데이터를 상수로 유지 (참조용)
const INITIAL_EMPLOYEES = EMPLOYEES;
const INITIAL_PROJECTS = PROJECTS;
const INITIAL_WORK_MODULES = WORK_MODULES;

// ============================================
// 인사 카드 모달 컴포넌트
// ============================================
interface EmployeeModalProps {
  employee: ExtendedEmployee | null;
  onClose: () => void;
  projects: typeof PROJECTS;
}

const EmployeeModal = ({ employee, onClose, projects }: EmployeeModalProps) => {
  if (!employee) return null;

  // 해당 직원이 참여 중인 프로젝트/Task 추출
  const activeAllocations = employee.allocations;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-6 border-b border-slate-700 flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-xl font-bold text-white shadow-lg">
            {employee.avatar}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{employee.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded border ${getTeamBadgeStyle(employee.teamType)}`}>
                {getTeamLabel(employee.teamType)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                employee.totalAllocation > 100
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : employee.totalAllocation >= 80
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                투입률 {employee.totalAllocation}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* 스킬 섹션 */}
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            보유 역량 ({employee.skillSet.length}개)
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {employee.skillSet.map(skillId => {
              const skillDef = SKILL_DEFINITIONS.find(s => s.id === skillId);
              return (
                <span
                  key={skillId}
                  className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  {skillDef?.name || skillId}
                </span>
              );
            })}
          </div>
        </div>

        {/* 참여 Task 섹션 */}
        <div className="p-6 max-h-[40vh] overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Briefcase size={14} className="text-cyan-400" />
            참여 중인 Task ({activeAllocations.length}개)
          </h3>
          <div className="space-y-3">
            {activeAllocations.map((alloc, idx) => {
              const project = projects.find(p => p.id === alloc.projectId);
              const taskDef = TASK_DEFINITIONS.find(t => t.id === alloc.taskId);
              return (
                <div key={idx} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white font-medium">{taskDef?.name || alloc.taskId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      alloc.allocationPercent >= 80
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {alloc.allocationPercent}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Briefcase size={10} />
                    {project?.name || `프로젝트 ${alloc.projectId}`}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar size={10} />
                    {alloc.startDate} ~ {alloc.endDate}
                  </div>
                </div>
              );
            })}
            {activeAllocations.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">배정된 Task가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrchestratorApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // 동적 데이터 상태 관리
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [workModules, setWorkModules] = useState(INITIAL_WORK_MODULES);

  // 인사 카드 모달 상태
  const [selectedEmployee, setSelectedEmployee] = useState<ExtendedEmployee | null>(null);

  // ============================================
  // Notion 동기화 상태 관리
  // ============================================
  const [notionSyncStatus, setNotionSyncStatus] = useState<NotionSyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [notionProjects, setNotionProjects] = useState<NotionProject[]>([]);
  const [notionTasks, setNotionTasks] = useState<NotionTask[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Notion 데이터 동기화 함수
  const syncFromNotion = async () => {
    setNotionSyncStatus('syncing');
    setSyncError(null);

    try {
      const result = await syncAllFromNotion();

      if (result.success) {
        setNotionProjects(result.projects || []);
        setNotionTasks(result.tasks || []);
        setLastSyncTime(new Date());
        setNotionSyncStatus('success');
        console.log(`[Notion Sync] 성공 - 프로젝트: ${result.projects?.length || 0}, Task: ${result.tasks?.length || 0}`);
      } else {
        setSyncError(result.error || '알 수 없는 오류');
        setNotionSyncStatus('error');
        console.error('[Notion Sync] 실패:', result.error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '동기화 실패';
      setSyncError(errorMsg);
      setNotionSyncStatus('error');
      console.error('[Notion Sync] 예외:', error);
    }
  };

  // 초기 동기화 및 자동 동기화 (60초 간격)
  useEffect(() => {
    // 초기 동기화
    syncFromNotion();

    // 60초마다 자동 동기화
    const interval = setInterval(syncFromNotion, 60000);

    return () => clearInterval(interval);
  }, []);

  // 직원 부하율 업데이트 함수
  const updateEmployeeLoads = (memberIds: number[], loadIncrease: number = 15) => {
    setEmployees(prev => prev.map(emp => {
      if (memberIds.includes(emp.id)) {
        const newLoad = Math.min(emp.load + loadIncrease, 100);
        const newRisk = newLoad >= 85 ? "High" : newLoad >= 60 ? "Medium" : "Low";
        return {
          ...emp,
          load: newLoad,
          risk: newRisk,
          status: emp.status === "Idle" ? "Working" : emp.status
        };
      }
      return emp;
    }));
  };

  // 새 프로젝트 추가 함수 (workModules도 함께 추가 + 직원 부하율 업데이트)
  const addProject = (
    newProject: typeof INITIAL_PROJECTS[0],
    newWorkModules?: typeof INITIAL_WORK_MODULES[number]
  ) => {
    setProjects(prev => [...prev, newProject]);
    if (newWorkModules && newWorkModules.length > 0) {
      setWorkModules(prev => ({
        ...prev,
        [newProject.id]: newWorkModules
      }));
    }
    // 새 프로젝트에 배정된 멤버들의 부하율 증가
    if (newProject.members && newProject.members.length > 0) {
      updateEmployeeLoads(newProject.members);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4">
        <div className="mb-8 px-2 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Cpu size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ORCHESTRATOR</span>
        </div>

        <div className="space-y-2 flex-1">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <SidebarItem
            icon={Briefcase}
            label="Projects"
            active={activeTab === "projects"}
            onClick={() => setActiveTab("projects")}
          />
          <SidebarItem
            icon={Users}
            label="Talent & HR"
            active={activeTab === "talent"}
            onClick={() => setActiveTab("talent")}
          />
          <SidebarItem
            icon={BarChart2}
            label="Analytics"
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
          />
          <SidebarItem
            icon={Zap}
            label="Simulation"
            active={activeTab === "simulation"}
            onClick={() => setActiveTab("simulation")}
          />
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800">
           <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
              MG
            </div>
            <div>
              <div className="text-sm font-medium text-white">Manager</div>
              <div className="text-xs text-slate-500">System Admin</div>
            </div>
           </div>
           <button className="w-full flex items-center space-x-3 px-4 py-2 text-slate-500 hover:text-white transition-colors">
            <Settings size={18} />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex justify-between items-center px-6">
          <div className="flex items-center gap-4 w-1/3">
            <Search className="text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search people, projects, or ask AI..." 
              className="bg-transparent border-none focus:outline-none text-sm w-full placeholder-slate-600"
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Notion 동기화 상태 표시 */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <Cloud
                size={16}
                className={`${
                  notionSyncStatus === 'syncing' ? 'animate-pulse text-blue-400' :
                  notionSyncStatus === 'success' ? 'text-emerald-400' :
                  notionSyncStatus === 'error' ? 'text-red-400' :
                  'text-slate-500'
                }`}
              />
              <span className="text-xs text-slate-400">
                {notionSyncStatus === 'syncing' ? '동기화 중...' :
                 lastSyncTime ? `${lastSyncTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 동기화` :
                 'Notion 대기'}
              </span>
              <button
                onClick={syncFromNotion}
                disabled={notionSyncStatus === 'syncing'}
                className="p-1 hover:bg-slate-700/50 rounded transition-colors disabled:opacity-50"
                title="수동 동기화"
              >
                <RefreshCw size={14} className={`text-slate-400 hover:text-white ${notionSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              </button>
              {notionProjects.length > 0 && (
                <span className="text-xs text-indigo-400 font-medium">
                  {notionProjects.length}개 프로젝트
                </span>
              )}
            </div>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
            </button>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">System Status: Optimal</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
           <div className="max-w-7xl mx-auto h-full">
            {activeTab === "dashboard" && (
              <DashboardView
                employees={employees}
                projects={projects}
                workModules={workModules}
                onEmployeeClick={setSelectedEmployee}
              />
            )}
            {activeTab === "projects" && (
              <ProjectView
                employees={employees}
                projects={projects}
                workModules={workModules}
                onAddProject={addProject}
                onEmployeeClick={setSelectedEmployee}
              />
            )}
            {activeTab === "talent" && (
              <TalentView
                employees={employees}
                onEmployeeClick={setSelectedEmployee}
              />
            )}
            {activeTab === "analytics" && (
              <AnalyticsView
                employees={employees}
                projects={projects}
                workModules={workModules}
              />
            )}
            {activeTab === "simulation" && (
              <SimulationView
                employees={employees}
                projects={projects}
              />
            )}
           </div>
        </div>
      </main>

      {/* 인사 카드 모달 */}
      {selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          projects={projects}
        />
      )}
    </div>
  );
};

export default OrchestratorApp;