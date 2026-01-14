/**
 * HR Master Data Export Script
 *
 * 이 스크립트는 hrMasterData.json을 Excel 형식으로 내보냅니다.
 *
 * 사용법:
 *   1. npm install xlsx 설치
 *   2. npx ts-node scripts/exportToExcel.ts
 *
 * 출력:
 *   - HR_dash/exports/hr_master_data_{timestamp}.xlsx
 */

import * as fs from 'fs';
import * as path from 'path';

// JSON 데이터 로드
const dataPath = path.join(__dirname, '../src/data/hrMasterData.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const masterData = JSON.parse(rawData);

interface Employee {
  id: number;
  name: string;
  role: string;
  teamType: string;
  experienceLevel: string;
  salary: number;
  skills: string[];
}

interface Project {
  id: number;
  name: string;
  phase: string;
  teamType: string;
  members: number[];
  startDate: string;
  endDate: string;
  category: string;
  difficulty: string;
  description: string;
}

interface Task {
  id: string;
  projectId: number;
  name: string;
  taskType: string;
  teamOwner: string;
  assignees: number[];
  startDate: string;
  endDate: string;
  progress: number;
  allocationPercent: number;
}

// Excel 호환 CSV 생성 함수
function exportToCSV(): void {
  const exportDir = path.join(__dirname, '../exports');

  // exports 디렉토리 생성
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];

  // 1. Employees CSV
  const employeesCSV = [
    ['ID', 'Name', 'Role', 'TeamType', 'ExperienceLevel', 'Salary', 'Skills'].join(','),
    ...masterData.employees.map((e: Employee) =>
      [e.id, e.name, e.role, e.teamType, e.experienceLevel, e.salary, `"${e.skills.join('; ')}"`].join(',')
    )
  ].join('\n');

  fs.writeFileSync(
    path.join(exportDir, `employees_${timestamp}.csv`),
    '\uFEFF' + employeesCSV,  // BOM for Excel UTF-8 support
    'utf-8'
  );

  // 2. Projects CSV
  const projectsCSV = [
    ['ID', 'Name', 'Phase', 'TeamType', 'Members', 'StartDate', 'EndDate', 'Category', 'Difficulty', 'Description'].join(','),
    ...masterData.projects.map((p: Project) =>
      [p.id, `"${p.name}"`, p.phase, p.teamType, `"${p.members.join('; ')}"`, p.startDate, p.endDate, p.category, p.difficulty, `"${p.description}"`].join(',')
    )
  ].join('\n');

  fs.writeFileSync(
    path.join(exportDir, `projects_${timestamp}.csv`),
    '\uFEFF' + projectsCSV,
    'utf-8'
  );

  // 3. Tasks CSV
  const tasksCSV = [
    ['ID', 'ProjectID', 'Name', 'TaskType', 'TeamOwner', 'Assignees', 'StartDate', 'EndDate', 'Progress', 'AllocationPercent'].join(','),
    ...masterData.tasks.map((t: Task) =>
      [t.id, t.projectId, `"${t.name}"`, t.taskType, t.teamOwner, `"${t.assignees.join('; ')}"`, t.startDate, t.endDate, t.progress, t.allocationPercent].join(',')
    )
  ].join('\n');

  fs.writeFileSync(
    path.join(exportDir, `tasks_${timestamp}.csv`),
    '\uFEFF' + tasksCSV,
    'utf-8'
  );

  console.log(`CSV files exported to ${exportDir}`);
  console.log(`- employees_${timestamp}.csv`);
  console.log(`- projects_${timestamp}.csv`);
  console.log(`- tasks_${timestamp}.csv`);
}

// 요약 정보 출력
function printSummary(): void {
  console.log('\n========================================');
  console.log('HR Master Data Summary');
  console.log('========================================');
  console.log(`Version: ${masterData.metadata.version}`);
  console.log(`Last Updated: ${masterData.metadata.lastUpdated}`);
  console.log(`Source: ${masterData.metadata.source}`);
  console.log('');
  console.log(`Employees: ${masterData.employees.length}`);
  console.log(`  - AX Team: ${masterData.employees.filter((e: Employee) => e.teamType === 'AX').length}`);
  console.log(`  - AI Engineering: ${masterData.employees.filter((e: Employee) => e.teamType === 'AI_ENGINEERING').length}`);
  console.log('');
  console.log(`Projects: ${masterData.projects.length}`);
  console.log(`  - Collaboration: ${masterData.projects.filter((p: Project) => p.teamType === 'COLLABORATION').length}`);
  console.log('');
  console.log(`Tasks: ${masterData.tasks.length}`);
  console.log(`  - Project 103 Tasks: ${masterData.tasks.filter((t: Task) => t.projectId === 103).length}`);
  console.log(`  - Project 104 Tasks: ${masterData.tasks.filter((t: Task) => t.projectId === 104).length}`);
  console.log('========================================\n');
}

// 실행
printSummary();
exportToCSV();
