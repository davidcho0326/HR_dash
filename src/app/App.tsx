import React, { useState, useEffect, useRef } from 'react';
import { requestTeamComposition, TeamProposal, Employee as GeminiEmployee, Project as GeminiProject, WorkModule as GeminiWorkModule } from '../services/gemini';
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
  Volume2
} from 'lucide-react';

// --- Mock Data ---

const EMPLOYEES = [
  { id: 1, name: "김철수", role: "Backend Lead", status: "Focusing", statusDetail: "GitHub - API 최적화 커밋 중", load: 85, risk: "High", skills: ["Python", "AWS", "System Design"], avatar: "KC" },
  { id: 2, name: "이영희", role: "Product Manager", status: "Meeting", statusDetail: "Zoom - 주간 기획 회의", load: 60, risk: "Low", skills: ["Jira", "Figma", "Data Analysis"], avatar: "LY" },
  { id: 3, name: "박지성", role: "Frontend Dev", status: "Idle", statusDetail: "Slack - 대기 중", load: 30, risk: "Low", skills: ["React", "TypeScript", "Three.js"], avatar: "PJ" },
  { id: 4, name: "최수민", role: "UI Designer", status: "Working", statusDetail: "Figma - 대시보드 시안 작업", load: 75, risk: "Medium", skills: ["UI/UX", "Prototyping"], avatar: "CS" },
  { id: 5, name: "정민우", role: "DevOps", status: "Away", statusDetail: "연차", load: 0, risk: "Low", skills: ["Docker", "Kubernetes"], avatar: "JM" },
];

const PROJECTS = [
  {
    id: 101, name: "AI 챗봇 고도화", phase: "Development", progress: 65, status: "OnTrack",
    members: [1, 3], predictiveEnd: "2026.03.15", contributionToOrg: 45,
    startDate: "2025-12-01", endDate: "2026-03-15", category: "AI/ML"
  },
  {
    id: 102, name: "글로벌 마케팅 대시보드", phase: "Design", progress: 40, status: "Delayed",
    members: [2, 4], predictiveEnd: "2026.04.10", contributionToOrg: 30,
    startDate: "2025-12-15", endDate: "2026-04-10", category: "Marketing"
  },
];

// Work modules for projects (업무 단위)
const WORK_MODULES = {
  101: [
    { id: 'w1', name: '가설 검증 & PM', progress: 80, techStack: ['Notion', 'Jira'], estimatedHours: 40, startDate: "2025-12-01", endDate: "2026-01-15", assignees: [2] },
    { id: 'w2', name: 'LLM Prompt Engineering', progress: 70, techStack: ['OpenAI API', 'LangChain', 'Python'], estimatedHours: 60, startDate: "2025-12-15", endDate: "2026-02-15", assignees: [1] },
    { id: 'w3', name: 'Backend API 개발', progress: 65, techStack: ['FastAPI', 'PostgreSQL'], estimatedHours: 80, startDate: "2026-01-01", endDate: "2026-02-28", assignees: [1] },
    { id: 'w4', name: 'Frontend 구현', progress: 50, techStack: ['React', 'TypeScript'], estimatedHours: 70, startDate: "2026-01-15", endDate: "2026-03-15", assignees: [3] },
  ],
  102: [
    { id: 'w5', name: 'UI/UX 디자인', progress: 60, techStack: ['Figma', 'Design System'], estimatedHours: 50, startDate: "2025-12-15", endDate: "2026-02-01", assignees: [4, 2] },
    { id: 'w6', name: 'Data Pipeline 구축', progress: 30, techStack: ['Python', 'Airflow'], estimatedHours: 60, startDate: "2026-01-15", endDate: "2026-03-15", assignees: [1] },
    { id: 'w7', name: 'Dashboard Frontend', progress: 35, techStack: ['Next.js', 'Recharts'], estimatedHours: 90, startDate: "2026-02-01", endDate: "2026-04-10", assignees: [3] },
  ]
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
const EmployeeStatusCard = ({ employee }: { employee: typeof EMPLOYEES[0] }) => {
  const statusColors = {
    "Focusing": "bg-emerald-500",
    "Meeting": "bg-amber-500",
    "Working": "bg-blue-500",
    "Idle": "bg-slate-500",
    "Away": "bg-red-500",
  };

  const loadColor = employee.load > 80 ? 'bg-red-500' : employee.load > 60 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
          {employee.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-medium truncate">{employee.name}</h4>
            <span className={`w-2 h-2 rounded-full ${statusColors[employee.status]}`}></span>
          </div>
          <p className="text-xs text-slate-400 truncate">{employee.role}</p>
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
}

const DashboardView = ({ employees, projects, workModules }: DashboardViewProps) => {
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
              <EmployeeStatusCard key={emp.id} employee={emp} />
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
}

const ProjectView = ({ employees, projects, workModules, onAddProject }: ProjectViewProps) => {
  const [showAiProposal, setShowAiProposal] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'gantt'>('timeline');

  // AI Team Composition States
  const [managerInput, setManagerInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiProposal, setAiProposal] = useState<TeamProposal | null>(null);

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
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set([101, 102]));
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Gantt Chart Helpers
  const timelineStart = new Date('2025-12-01');
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
                        <span className="text-sm font-medium text-white truncate">{project.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ml-auto ${
                          project.status === 'OnTrack' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {project.progress}%
                        </span>
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
                                className="flex items-center gap-2 px-4 py-2 pl-14 border-b border-slate-800/30 bg-slate-900/30"
                              >
                                <div className="w-5 h-5 rounded-full bg-emerald-600/30 flex items-center justify-center">
                                  <User size={10} className="text-emerald-400" />
                                </div>
                                <span className="text-[11px] text-slate-400">{employee.name}</span>
                                <span className="text-[10px] text-slate-600 ml-auto">{employee.role}</span>
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
                        <div className="relative h-[46px] border-b border-slate-800 flex-shrink-0">
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
                              <div className="relative h-[38px] border-b border-slate-800/50 flex-shrink-0">
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
                                  <div key={`${module.id}-${assigneeId}`} className="relative h-[34px] border-b border-slate-800/30 bg-slate-900/20 flex-shrink-0">
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
}

const AnalyticsView = ({ employees, projects }: AnalyticsViewProps) => {
  const [viewMode, setViewMode] = useState('project');

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
          ) : (
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

interface TalentViewProps {
  employees: typeof EMPLOYEES;
}

const TalentView = ({ employees }: TalentViewProps) => (
  <div className="grid grid-cols-2 gap-6 h-full">
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 overflow-y-auto">
      <h2 className="text-lg font-bold text-white mb-4">Live Personas</h2>
      <div className="space-y-4">
        {employees.map(emp => (
          <div key={emp.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:bg-slate-900 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-slate-700 text-white`}>
                    {emp.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{emp.name}</h4>
                    <p className="text-xs text-slate-400">{emp.role}</p>
                  </div>
              </div>
              <button className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700">Detail</button>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {emp.skills.map((skill, i) => (
                <span key={i} className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/20">
                  {skill}
                </span>
              ))}
               <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full border border-purple-500/20 flex items-center gap-1">
                 <TrendingUp size={10} />
                 최근 급성장
               </span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="text-emerald-400" size={20} />
            Auto-Hiring Agent
          </h2>
          <span className="text-xs text-emerald-400 animate-pulse">● Active Sourcing</span>
        </div>

        <div className="space-y-4">
          <div className="relative pt-6">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700"></div>
            
            {[
              { label: "Sourced (LinkedIn/GitHub)", count: 142, color: "bg-slate-600" },
              { label: "AI Screened Passed", count: 45, color: "bg-indigo-600" },
              { label: "Interview Proposed", count: 12, color: "bg-purple-600" },
              { label: "Offer Stage", count: 3, color: "bg-emerald-600" },
            ].map((step, idx) => (
              <div key={idx} className="relative flex items-center mb-4 last:mb-0 pl-8">
                <div className={`absolute left-[13px] w-2 h-2 rounded-full ${idx === 3 ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`}></div>
                 <div className="flex-1 bg-slate-900/80 p-3 rounded-lg flex justify-between items-center border border-slate-700/50">
                   <span className="text-sm text-slate-300">{step.label}</span>
                   <span className="font-bold text-white">{step.count}</span>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>

       <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
         <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="text-amber-400" size={20} />
            Skill Gap Analysis
          </h2>
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
            <p className="text-sm text-amber-200 font-medium mb-1">React Native 역량 부족 감지</p>
            <p className="text-xs text-amber-400/80 mb-3">차기 모바일 프로젝트를 위해 최소 2명의 숙련자가 더 필요합니다.</p>
            <button className="w-full bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs py-2 rounded-lg border border-amber-500/30 transition-colors">
              내부 교육 커리큘럼 생성 및 전송
            </button>
          </div>
       </div>
    </div>
  </div>
);

// 초기 데이터를 상수로 유지 (참조용)
const INITIAL_EMPLOYEES = EMPLOYEES;
const INITIAL_PROJECTS = PROJECTS;
const INITIAL_WORK_MODULES = WORK_MODULES;

const OrchestratorApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // 동적 데이터 상태 관리
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [workModules, setWorkModules] = useState(INITIAL_WORK_MODULES);

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
              />
            )}
            {activeTab === "projects" && (
              <ProjectView
                employees={employees}
                projects={projects}
                workModules={workModules}
                onAddProject={addProject}
              />
            )}
            {activeTab === "talent" && (
              <TalentView employees={employees} />
            )}
            {activeTab === "analytics" && (
              <AnalyticsView
                employees={employees}
                projects={projects}
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
    </div>
  );
};

export default OrchestratorApp;