// Notion API 연동 서비스
// 프로젝트/Task Output을 Notion 데이터베이스에 아카이빙

// 환경 변수에서 API 키 로드 (Vite 방식)
const NOTION_API_KEY = import.meta.env.VITE_NOTION_API_KEY || '';
const NOTION_DATABASE_ID = import.meta.env.VITE_NOTION_DATABASE_ID || '';

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
