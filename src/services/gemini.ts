// Gemini API Service for HR Dashboard
// AI 팀 구성 추천 기능 - F&F AI 직무체계 기반

import {
  TeamType,
  TaskCategory,
  SkillType,
  TaskDefinition,
  SkillDefinition
} from '../types/organization';
import { TASK_DEFINITIONS, SKILL_DEFINITIONS } from '../data/masterData';

// gemini-2.0-flash가 안정적인 최신 모델입니다
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// 타입 정의 (레거시 호환)
export interface Employee {
  id: number;
  name: string;
  role: string;
  skills: string[];
  load: number;
  status: string;
}

// 확장된 직원 타입 (새 직무체계 반영)
export interface ExtendedEmployeeInput extends Employee {
  teamType?: TeamType;
  skillSet?: SkillType[];
  totalAllocation?: number;
}

export interface Project {
  id: number;
  name: string;
  category: string;
  members: string[];
  startDate: string;
  endDate: string;
}

export interface TeamMember {
  employeeId: number;
  employeeName: string;
  role: string;
  reason: string;
}

// Work Module 타입 추가
export interface WorkModule {
  name: string;
  techStack: string[];
  estimatedHours: number;
  assigneeIds: number[];
}

export interface TeamProposal {
  projectName: string;
  team: TeamMember[];
  workModules: WorkModule[];  // 업무 모듈 추가
  summary: string;
  error?: string;
}

// 직원 정보를 프롬프트용 텍스트로 변환 (기본)
function formatEmployeesForPrompt(employees: Employee[]): string {
  return employees.map(emp =>
    `- ${emp.name} (ID: ${emp.id}): ${emp.role}, 스킬: ${emp.skills.join(', ')}, 현재 부하율: ${emp.load}%, 상태: ${emp.status}`
  ).join('\n');
}

// 확장된 직원 정보 포맷팅 (Task-Skill 매트릭스 기반)
export function formatExtendedEmployeesForPrompt(employees: ExtendedEmployeeInput[]): string {
  return employees.map(emp => {
    const teamLabel = emp.teamType === 'AX' ? 'AX팀(PM/기획)' : emp.teamType === 'AI_ENGINEERING' ? 'AI엔지니어링팀' : '미정';
    const skillNames = emp.skillSet
      ? emp.skillSet.map((s: SkillType) => SKILL_DEFINITIONS.find((d: SkillDefinition) => d.id === s)?.name || s).slice(0, 5).join(', ')
      : emp.skills.join(', ');
    const allocation = emp.totalAllocation ?? emp.load;
    return `- ${emp.name} (ID: ${emp.id}): ${emp.role} [${teamLabel}]
    스킬: ${skillNames}${emp.skillSet && emp.skillSet.length > 5 ? ` 외 ${emp.skillSet.length - 5}개` : ''}
    현재 투입률: ${allocation}%, 상태: ${emp.status}`;
  }).join('\n');
}

// Task 정의를 프롬프트용 텍스트로 변환
export function formatTasksForPrompt(taskIds: TaskCategory[]): string {
  return taskIds.map((taskId: TaskCategory) => {
    const task = TASK_DEFINITIONS.find((t: TaskDefinition) => t.id === taskId);
    if (!task) return '';
    const reqSkills = task.requiredSkills.map((s: SkillType) => SKILL_DEFINITIONS.find((d: SkillDefinition) => d.id === s)?.name || s).join(', ');
    const recSkills = task.recommendedSkills.map((s: SkillType) => SKILL_DEFINITIONS.find((d: SkillDefinition) => d.id === s)?.name || s).join(', ');
    return `- ${task.name}: 필수(${reqSkills}), 권장(${recSkills})`;
  }).filter(Boolean).join('\n');
}

// Gemini API 호출
export async function requestTeamComposition(
  userRequest: string,
  employees: Employee[],
  projects: Project[]
): Promise<TeamProposal> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      projectName: '오류',
      team: [],
      workModules: [],
      summary: 'Gemini API 키가 설정되지 않았습니다. .env.local 파일에 VITE_GEMINI_API_KEY를 설정해주세요.',
      error: 'API_KEY_MISSING'
    };
  }

  const prompt = `당신은 전문 HR 매니저입니다. 다음 직원 목록과 정보를 바탕으로 사용자의 요청에 맞는 최적의 팀을 구성하고, 업무 모듈도 함께 설계해주세요.

## 직원 목록
${formatEmployeesForPrompt(employees)}

## 현재 진행 중인 프로젝트
${projects.map(p => `- ${p.name} (${p.category}): 멤버 ${p.members.length}명`).join('\n')}

## 사용자 요청
"${userRequest}"

## 팀 구성 기준
1. 요청된 프로젝트/업무에 적합한 스킬을 가진 직원 우선
2. 현재 부하율이 낮은 직원 우선 (80% 이상은 피하기)
3. 팀 리더와 팀원을 구분하여 구성
4. 최소 2명, 최대 5명으로 구성

## 업무 모듈 설계 기준
1. 프로젝트를 2~4개의 주요 업무 모듈로 분류
2. 각 모듈에 필요한 기술 스택 명시
3. 예상 소요 시간(시간 단위) 산정
4. 적합한 담당자 ID 배정 (팀 멤버 중에서)

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
{
  "projectName": "프로젝트/업무 이름",
  "team": [
    { "employeeId": 숫자, "employeeName": "직원이름", "role": "Leader 또는 Member", "reason": "선정 이유 한 문장" }
  ],
  "workModules": [
    { "name": "모듈명", "techStack": ["기술1", "기술2"], "estimatedHours": 40, "assigneeIds": [1, 2] }
  ],
  "summary": "전체 팀 구성에 대한 설명 2-3문장"
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      return {
        projectName: '오류',
        team: [],
        workModules: [],
        summary: `API 호출 실패: ${response.status} ${response.statusText}`,
        error: 'API_ERROR'
      };
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return {
        projectName: '오류',
        team: [],
        workModules: [],
        summary: 'AI 응답을 받지 못했습니다.',
        error: 'NO_RESPONSE'
      };
    }

    // JSON 파싱 (더 강력한 추출 로직)
    let jsonStr = textResponse.trim();

    // 코드블록 제거
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    // JSON 객체 부분만 추출 (정규식으로 { } 사이 내용 찾기)
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('JSON not found in response:', textResponse);
      return {
        projectName: '오류',
        team: [],
        workModules: [],
        summary: 'AI 응답에서 JSON을 찾을 수 없습니다.',
        error: 'JSON_NOT_FOUND'
      };
    }
    jsonStr = jsonMatch[0];

    let proposal: TeamProposal;
    try {
      proposal = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, '\nJSON String:', jsonStr);
      return {
        projectName: '오류',
        team: [],
        workModules: [],
        summary: `JSON 파싱 오류: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`,
        error: 'JSON_PARSE_ERROR'
      };
    }

    // workModules가 없으면 빈 배열로 초기화
    if (!proposal.workModules) {
      proposal.workModules = [];
    }

    return proposal;

  } catch (error) {
    console.error('Gemini API Request Failed:', error);
    return {
      projectName: '오류',
      team: [],
      workModules: [],
      summary: `요청 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      error: 'REQUEST_FAILED'
    };
  }
}
