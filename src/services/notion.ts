// Notion API 연동 서비스
// 프로젝트/Task Output을 Notion 데이터베이스에 아카이빙
// Notion → Dashboard 동기화 지원

// 환경 변수에서 API 키 로드 (Vite 방식)
const NOTION_API_KEY = import.meta.env.VITE_NOTION_API_KEY || '';
const NOTION_DATABASE_ID = import.meta.env.VITE_NOTION_DATABASE_ID || '';

// 신규: 여러 데이터베이스 ID 지원
const NOTION_DB_PROJECT = import.meta.env.VITE_NOTION_DB_PROJECT || '';
const NOTION_DB_TASK = import.meta.env.VITE_NOTION_DB_TASK || '';
const NOTION_DB_SPRINT = import.meta.env.VITE_NOTION_DB_SPRINT || '';

// Notion API 기본 URL (프록시 사용 시 변경)
const NOTION_API_BASE = '/api/notion'; // Vite 프록시 경로

// ============================================
// 타입 정의
// ============================================

export interface NotionPage {
  id: string;
  properties: Record<string, unknown>;
  url?: string;
}

export interface ProjectArchiveData {
  name: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  teamType: string;
  members: string[];
  category?: string;
}

export interface TaskArchiveData {
  name: string;
  projectName: string;
  taskType: string;
  progress: number;
  assignees: string[];
  requiredSkills: string[];
  startDate: string;
  endDate: string;
}

// ============================================
// API 호출 함수
// ============================================

/**
 * Notion API 호출을 위한 헬퍼 함수
 * CORS 이슈로 인해 프록시 서버를 통해 호출
 */
async function notionFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${NOTION_API_BASE}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // 프록시 서버가 Authorization 헤더를 추가하도록 설정
  // 또는 서버리스 함수에서 API 키를 사용
  if (NOTION_API_KEY) {
    (headers as Record<string, string>)['X-Notion-Token'] = NOTION_API_KEY;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * 프로젝트를 Notion 데이터베이스에 아카이빙
 */
export async function archiveProjectToNotion(
  project: ProjectArchiveData
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  try {
    const response = await notionFetch('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          'Name': {
            title: [{ text: { content: project.name } }]
          },
          'Status': {
            select: { name: project.status }
          },
          'Progress': {
            number: project.progress
          },
          'Start Date': {
            date: { start: project.startDate }
          },
          'End Date': {
            date: { start: project.endDate }
          },
          'Team': {
            select: { name: project.teamType }
          },
          'Members': {
            multi_select: project.members.map(m => ({ name: m }))
          },
          'Category': {
            select: { name: project.category || 'General' }
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Notion API 호출 실패');
    }

    const data = await response.json();
    return { success: true, pageId: data.id };
  } catch (error) {
    console.error('Notion 아카이빙 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * Task를 Notion 데이터베이스에 아카이빙
 */
export async function archiveTaskToNotion(
  task: TaskArchiveData
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  try {
    const response = await notionFetch('/pages', {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          'Name': {
            title: [{ text: { content: `[${task.projectName}] ${task.name}` } }]
          },
          'Task Type': {
            select: { name: task.taskType }
          },
          'Progress': {
            number: task.progress
          },
          'Assignees': {
            multi_select: task.assignees.map(a => ({ name: a }))
          },
          'Required Skills': {
            multi_select: task.requiredSkills.slice(0, 10).map(s => ({ name: s }))
          },
          'Start Date': {
            date: { start: task.startDate }
          },
          'End Date': {
            date: { start: task.endDate }
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Notion API 호출 실패');
    }

    const data = await response.json();
    return { success: true, pageId: data.id };
  } catch (error) {
    console.error('Task 아카이빙 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * Notion 데이터베이스에서 데이터 조회
 */
export async function fetchFromNotion(
  databaseId: string = NOTION_DATABASE_ID,
  filter?: Record<string, unknown>
): Promise<{ success: boolean; results?: NotionPage[]; error?: string }> {
  try {
    const response = await notionFetch(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({ filter }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Notion 조회 실패');
    }

    const data = await response.json();
    return { success: true, results: data.results };
  } catch (error) {
    console.error('Notion 조회 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * Notion 연결 상태 확인
 */
export async function checkNotionConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return {
      connected: false,
      error: 'Notion API 키 또는 데이터베이스 ID가 설정되지 않았습니다.',
    };
  }

  try {
    const response = await notionFetch(`/databases/${NOTION_DATABASE_ID}`, {
      method: 'GET',
    });

    if (!response.ok) {
      return { connected: false, error: 'Notion 데이터베이스 접근 실패' };
    }

    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : '연결 실패',
    };
  }
}

// ============================================
// 로컬 스토리지 기반 폴백 (Notion 연결 불가 시)
// ============================================

const LOCAL_STORAGE_KEY = 'hr_dash_archived_projects';

export function saveToLocalStorage(data: ProjectArchiveData | TaskArchiveData): void {
  try {
    const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
    const archives = existing ? JSON.parse(existing) : [];
    archives.push({
      ...data,
      archivedAt: new Date().toISOString(),
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(archives));
  } catch (error) {
    console.error('로컬 스토리지 저장 실패:', error);
  }
}

export function getFromLocalStorage(): Array<ProjectArchiveData | TaskArchiveData> {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('로컬 스토리지 조회 실패:', error);
    return [];
  }
}

// ============================================
// Notion → Dashboard 동기화 (아이디어 2번)
// ============================================

/**
 * Notion에서 조회한 프로젝트 데이터 타입
 */
export interface NotionProject {
  id: string;
  notionId: string;
  name: string;
  phase: string;
  progress: number;
  status: string;
  startDate: string;
  endDate: string;
  teamType: string;
  members: number[];
  category: string;
  _source: 'notion';
}

/**
 * Notion에서 조회한 Task 데이터 타입
 */
export interface NotionTask {
  id: string;
  notionId: string;
  name: string;
  projectId: number;
  taskType: string;
  progress: number;
  assignees: number[];
  startDate: string;
  endDate: string;
  techStack: string[];
  estimatedHours: number;
  _source: 'notion';
  // 추가 필드 (Notion에서 직접 가져올 수 있는 경우)
  status?: string;           // 상태 (진행중, 리뷰, 완료 등)
  storyPoints?: number;      // 스토리포인트
  assignee?: string;         // 담당자 이름 (단일)
}

/**
 * Notion Property 값 추출 헬퍼 함수들
 */
function extractTitle(property: unknown): string {
  if (!property || typeof property !== 'object') return '';
  const prop = property as { title?: Array<{ plain_text?: string }> };
  return prop.title?.[0]?.plain_text || '';
}

function extractSelect(property: unknown): string {
  if (!property || typeof property !== 'object') return '';
  const prop = property as { select?: { name?: string } };
  return prop.select?.name || '';
}

function extractNumber(property: unknown): number {
  if (!property || typeof property !== 'object') return 0;
  const prop = property as { number?: number };
  return prop.number || 0;
}

function extractDate(property: unknown): string {
  if (!property || typeof property !== 'object') return '';
  const prop = property as { date?: { start?: string } };
  return prop.date?.start || '';
}

function extractMultiSelect(property: unknown): string[] {
  if (!property || typeof property !== 'object') return [];
  const prop = property as { multi_select?: Array<{ name?: string }> };
  return prop.multi_select?.map(item => item.name || '') || [];
}

function extractRichText(property: unknown): string {
  if (!property || typeof property !== 'object') return '';
  const prop = property as { rich_text?: Array<{ plain_text?: string }> };
  return prop.rich_text?.[0]?.plain_text || '';
}

function extractPerson(property: unknown): string | undefined {
  if (!property || typeof property !== 'object') return undefined;
  const prop = property as { people?: Array<{ name?: string }> };
  return prop.people?.[0]?.name || undefined;
}

/**
 * Notion 페이지를 Dashboard 프로젝트 형식으로 변환
 */
export function transformNotionToProject(notionPage: NotionPage): NotionProject | null {
  try {
    const props = notionPage.properties as Record<string, unknown>;

    // Notion DB 스키마에 맞춰 매핑 (IT 스타트업 워크스페이스 기준)
    // 프로젝트명, 담당 팀, 마감일, 상태, 시작일, 우선순위, 진행률
    const name = extractTitle(props['프로젝트명'] || props['이름'] || props['Name'] || props['제목']);
    if (!name) return null;

    const phase = extractSelect(props['상태'] || props['Status'] || props['Phase']) || 'Planning';
    const progress = extractNumber(props['진행률'] || props['Progress'] || props['진행도']) || 0;
    const status = phase === 'Complete' ? 'Complete' : (progress > 50 ? 'OnTrack' : 'AtRisk');

    return {
      id: notionPage.id.replace(/-/g, '').substring(0, 8), // 짧은 ID 생성
      notionId: notionPage.id,
      name,
      phase,
      progress,
      status,
      startDate: extractDate(props['시작일'] || props['Start Date'] || props['시작']) || '2025-01-01',
      endDate: extractDate(props['마감일'] || props['종료일'] || props['End Date'] || props['마감']) || '2025-12-31',
      teamType: extractSelect(props['담당 팀'] || props['팀'] || props['Team'] || props['담당팀']) || 'COLLABORATION',
      members: [], // Relation은 별도 처리 필요
      category: extractSelect(props['카테고리'] || props['Category'] || props['분류']) || 'General',
      _source: 'notion',
    };
  } catch (error) {
    console.error('프로젝트 변환 실패:', error, notionPage);
    return null;
  }
}

/**
 * Notion 페이지를 Dashboard Task 형식으로 변환
 */
export function transformNotionToTask(notionPage: NotionPage): NotionTask | null {
  try {
    const props = notionPage.properties as Record<string, unknown>;

    const name = extractTitle(props['이름'] || props['Name'] || props['태스크명'] || props['제목']);
    if (!name) return null;

    // 상태 추출 (Notion DB의 '상태' 필드)
    const status = extractSelect(props['상태'] || props['Status'] || props['State']) || '백로그';

    // 스토리포인트 추출
    const storyPoints = extractNumber(props['스토리 포인트'] || props['Story Points'] || props['포인트']) || 0;

    // 담당자 이름 추출 (Person 타입은 별도 처리 필요, 일단 텍스트로)
    const assignee = extractPerson(props['담당자'] || props['Assignee'] || props['담당']);

    return {
      id: `notion-${notionPage.id.replace(/-/g, '').substring(0, 8)}`,
      notionId: notionPage.id,
      name,
      projectId: 0, // Relation에서 추출 필요
      taskType: extractSelect(props['유형'] || props['Type'] || props['Task Type']) || 'GENERAL',
      progress: extractNumber(props['진행률'] || props['Progress'] || props['진행도']) || 0,
      assignees: [], // Relation에서 추출 필요
      startDate: extractDate(props['시작일'] || props['Start Date']) || '2025-01-01',
      endDate: extractDate(props['종료일'] || props['End Date'] || props['마감일']) || '2025-12-31',
      techStack: extractMultiSelect(props['기술스택'] || props['Tech Stack'] || props['스킬'] || props['기술 스택']),
      estimatedHours: extractNumber(props['예상시간'] || props['Estimated Hours']) || 40,
      _source: 'notion',
      // 추가 필드
      status,
      storyPoints,
      assignee,
    };
  } catch (error) {
    console.error('Task 변환 실패:', error, notionPage);
    return null;
  }
}

/**
 * Notion에서 프로젝트 목록 조회
 */
export async function fetchProjectsFromNotion(): Promise<{
  success: boolean;
  projects?: NotionProject[];
  error?: string;
}> {
  const databaseId = NOTION_DB_PROJECT || NOTION_DATABASE_ID;

  if (!databaseId) {
    return {
      success: false,
      error: 'NOTION_DB_PROJECT가 설정되지 않았습니다.',
    };
  }

  try {
    const response = await notionFetch(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        page_size: 100,
        sorts: [
          { property: '시작일', direction: 'descending' },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const projects = (data.results || [])
      .map((page: NotionPage) => transformNotionToProject(page))
      .filter((p: NotionProject | null): p is NotionProject => p !== null);

    console.log(`[Notion] ${projects.length}개 프로젝트 조회 완료`);
    return { success: true, projects };
  } catch (error) {
    console.error('Notion 프로젝트 조회 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * Notion에서 Task 목록 조회
 */
export async function fetchTasksFromNotion(): Promise<{
  success: boolean;
  tasks?: NotionTask[];
  error?: string;
}> {
  const databaseId = NOTION_DB_TASK;

  if (!databaseId) {
    return {
      success: false,
      error: 'NOTION_DB_TASK가 설정되지 않았습니다.',
    };
  }

  try {
    const response = await notionFetch(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        page_size: 100,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const tasks = (data.results || [])
      .map((page: NotionPage) => transformNotionToTask(page))
      .filter((t: NotionTask | null): t is NotionTask => t !== null);

    console.log(`[Notion] ${tasks.length}개 Task 조회 완료`);
    return { success: true, tasks };
  } catch (error) {
    console.error('Notion Task 조회 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * Notion 동기화 상태 타입
 */
export type NotionSyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * 전체 Notion 데이터 동기화
 */
export async function syncAllFromNotion(): Promise<{
  success: boolean;
  projects?: NotionProject[];
  tasks?: NotionTask[];
  error?: string;
}> {
  console.log('[Notion] 전체 동기화 시작...');

  const [projectsResult, tasksResult] = await Promise.all([
    fetchProjectsFromNotion(),
    fetchTasksFromNotion(),
  ]);

  if (!projectsResult.success && !tasksResult.success) {
    return {
      success: false,
      error: `프로젝트: ${projectsResult.error}, Task: ${tasksResult.error}`,
    };
  }

  console.log('[Notion] 전체 동기화 완료');
  return {
    success: true,
    projects: projectsResult.projects || [],
    tasks: tasksResult.tasks || [],
  };
}

/**
 * DB ID 내보내기 (외부에서 접근 가능)
 */
export const NotionDBIds = {
  PROJECT: NOTION_DB_PROJECT,
  TASK: NOTION_DB_TASK,
  SPRINT: NOTION_DB_SPRINT,
};

// ============================================================
// Phase 6: 프로젝트 상세 모달용 함수들
// ============================================================

/**
 * 태스크 상태별 통계 타입
 */
export interface TaskStats {
  completed: number;
  inProgress: number;
  review: number;
  backlog: number;
  total: number;
}

/**
 * 프로젝트 상세 정보 타입 (모달 표시용)
 */
export interface NotionProjectDetail extends NotionProject {
  tasks: NotionTask[];
  totalStoryPoints: number;
  completedStoryPoints: number;
  taskStats: TaskStats;
  daysRemaining: number;
  progressPercentage: number;
}

/**
 * 태스크 상태를 카테고리로 분류
 */
function categorizeTaskStatus(status: string): keyof Omit<TaskStats, 'total'> {
  const statusLower = status.toLowerCase();

  if (statusLower.includes('완료') || statusLower === 'done' || statusLower === 'complete') {
    return 'completed';
  }
  if (statusLower.includes('진행') || statusLower === 'in progress' || statusLower === 'doing') {
    return 'inProgress';
  }
  if (statusLower.includes('리뷰') || statusLower === 'review' || statusLower === 'in review') {
    return 'review';
  }
  // 백로그, 대기, todo 등
  return 'backlog';
}

/**
 * 프로젝트에 연결된 태스크 목록 조회
 * 현재는 모든 태스크를 반환 (Notion relation 매핑은 추후 구현)
 */
export function getTasksForProject(
  project: NotionProject,
  allTasks: NotionTask[]
): NotionTask[] {
  // TODO: Notion relation 기반 필터링 구현
  // 현재는 프로젝트 이름이나 ID로 매칭할 수 없어 모든 태스크 반환
  // 실제 연결은 Notion DB의 "소속 프로젝트" relation 필드 활용 필요
  return allTasks;
}

/**
 * 프로젝트 상세 정보 생성 (모달 표시용)
 */
export function buildProjectDetail(
  project: NotionProject,
  allTasks: NotionTask[]
): NotionProjectDetail {
  const tasks = getTasksForProject(project, allTasks);

  // 태스크 상태별 통계
  const taskStats: TaskStats = {
    completed: 0,
    inProgress: 0,
    review: 0,
    backlog: 0,
    total: tasks.length,
  };

  let totalStoryPoints = 0;
  let completedStoryPoints = 0;

  tasks.forEach(task => {
    const category = categorizeTaskStatus(task.status || 'backlog');
    taskStats[category]++;

    const points = task.storyPoints || 0;
    totalStoryPoints += points;

    if (category === 'completed') {
      completedStoryPoints += points;
    }
  });

  // 남은 일수 계산
  const today = new Date();
  const endDate = new Date(project.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // 진행률 계산 우선순위:
  // 1. 프로젝트에 직접 설정된 진행률 (Notion에서 수동 입력한 값)
  // 2. 스토리포인트 기반 계산
  // 3. 태스크 완료 개수 기반 계산
  let progressPercentage = 0;

  if (project.progress && project.progress > 0) {
    // Notion에서 직접 설정한 프로젝트 진행률 우선 사용
    progressPercentage = project.progress;
  } else if (totalStoryPoints > 0) {
    progressPercentage = Math.round((completedStoryPoints / totalStoryPoints) * 100);
  } else if (tasks.length > 0) {
    progressPercentage = Math.round((taskStats.completed / tasks.length) * 100);
  }

  return {
    ...project,
    tasks,
    totalStoryPoints,
    completedStoryPoints,
    taskStats,
    daysRemaining,
    progressPercentage,
  };
}

/**
 * 태스크 상태에 따른 아이콘 반환
 */
export function getTaskStatusIcon(status: string): string {
  const category = categorizeTaskStatus(status);
  switch (category) {
    case 'completed': return '✅';
    case 'inProgress': return '🔄';
    case 'review': return '👀';
    case 'backlog': return '⏳';
    default: return '📋';
  }
}

/**
 * 태스크 상태에 따른 색상 클래스 반환
 */
export function getTaskStatusColor(status: string): string {
  const category = categorizeTaskStatus(status);
  switch (category) {
    case 'completed': return 'text-emerald-400 bg-emerald-500/20';
    case 'inProgress': return 'text-blue-400 bg-blue-500/20';
    case 'review': return 'text-amber-400 bg-amber-500/20';
    case 'backlog': return 'text-slate-400 bg-slate-500/20';
    default: return 'text-slate-400 bg-slate-500/20';
  }
}
