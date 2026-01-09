import React, { useState, useEffect, useRef } from 'react';
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
  User
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

const DashboardView = () => {
  const [viewMode, setViewMode] = useState('view'); // 'view' or 'edit'
  const [nodes, setNodes] = useState([]);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const initialNodes = [];
    
    PROJECTS.forEach((project, idx) => {
      initialNodes.push({
        id: `project-${project.id}`,
        type: 'project',
        x: 150 + idx * 500,
        y: 80,
        data: project,
        connections: []
      });
      
      const works = WORK_MODULES[project.id] || [];
      works.forEach((work, workIdx) => {
        const workNode = {
          id: `work-${work.id}`,
          type: 'work',
          x: 80 + idx * 500 + workIdx * 140,
          y: 280,
          data: work,
          parentId: `project-${project.id}`
        };
        initialNodes.push(workNode);
      });
      
      project.members.forEach((memberId, memIdx) => {
        const employee = EMPLOYEES.find(e => e.id === memberId);
        if (employee) {
          const personNode = {
            id: `person-${employee.id}-proj-${project.id}`,
            type: 'person',
            x: 150 + idx * 500 + memIdx * 200,
            y: 520,
            data: employee,
            parentId: `project-${project.id}`
          };
          initialNodes.push(personNode);
        }
      });
    });
    
    setNodes(initialNodes);
  }, []);

  const handleMouseMove = (e) => {
    if (draggingNodeId && viewMode === 'edit') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setNodes(prev => prev.map(node => 
        node.id === draggingNodeId 
          ? { ...node, x: x - 100, y: y - 50 }
          : node
      ));
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const getNodeCenter = (node) => {
    const widthMap = { project: 256, work: 224, person: 192 };
    const width = widthMap[node.type] || 192;
    const height = 140;
    return {
      x: node.x + width / 2,
      y: node.y + height / 2
    };
  };

  const renderConnections = () => {
    const connections = [];
    
    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
          const fromCenter = getNodeCenter(parent);
          const toCenter = getNodeCenter(node);
          
          let color = "rgba(139, 92, 246, 0.3)";
          if (node.type === 'person') color = "rgba(16, 185, 129, 0.3)";
          if (node.type === 'work') color = "rgba(245, 158, 11, 0.3)";
          
          connections.push(
            <ConnectionLine
              key={`${parent.id}-${node.id}`}
              from={fromCenter}
              to={toCenter}
              color={color}
            />
          );
        }
      }
    });
    
    return connections;
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handlePanStart = (e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePanMove = (e) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Control Bar */}
      <div className="flex justify-between items-center bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link2 className="text-indigo-400" size={20} />
            <h2 className="text-lg font-bold text-white">Project Hierarchy Canvas</h2>
          </div>
          <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
            {nodes.length} nodes • Figma Jam Style
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'view' ? 'edit' : 'view')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'edit' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {viewMode === 'edit' ? <Edit3 size={16} /> : <Eye size={16} />}
            {viewMode === 'edit' ? 'Edit Mode' : 'View Mode'}
          </button>
          
          <div className="h-6 w-px bg-slate-700"></div>
          
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-sm"></div>
              <span className="text-slate-400">Projects</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-br from-amber-600 to-orange-600 rounded-sm"></div>
              <span className="text-slate-400">Work Modules</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-sm"></div>
              <span className="text-slate-400">People</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 bg-slate-900 rounded-xl border border-slate-700 relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(100, 116, 139, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          cursor: viewMode === 'edit' ? 'grab' : 'default'
        }}
      >
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {renderConnections()}
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <DraggableNode
            key={node.id}
            node={node}
            isDragging={draggingNodeId === node.id}
            onDragStart={(id) => viewMode === 'edit' && setDraggingNodeId(id)}
          />
        ))}
      </div>

      {/* Zoom and Pan Controls */}
      <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 text-xs text-slate-400 flex items-center gap-2">
        <ZoomIn size={14} className="text-indigo-400 cursor-pointer" onClick={handleZoomIn} />
        <ZoomOut size={14} className="text-indigo-400 cursor-pointer" onClick={handleZoomOut} />
        <div className="h-4 w-[1px] bg-slate-700"></div>
        <Maximize2 size={14} className="text-indigo-400 cursor-pointer" onClick={() => setPanOffset({ x: 0, y: 0 })} />
      </div>

      {/* Pan Area */}
      <div
        ref={contentRef}
        className="absolute inset-0 pointer-events-none"
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      ></div>
    </div>
  );
};

const ProjectView = () => {
  const [showAiProposal, setShowAiProposal] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'gantt'>('timeline');

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
              {PROJECTS.length} projects • {Object.values(WORK_MODULES).flat().length} modules
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
              {PROJECTS.map(project => (
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
                  {PROJECTS.map(project => (
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

                      {expandedProjects.has(project.id) && WORK_MODULES[project.id]?.map(module => (
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
                            const employee = EMPLOYEES.find(e => e.id === assigneeId);
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
                  {PROJECTS.map(project => {
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

                        {expandedProjects.has(project.id) && WORK_MODULES[project.id]?.map(module => {
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
                                const employee = EMPLOYEES.find(e => e.id === assigneeId);
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
          />
          <button className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <ArrowRight size={14} />
            AI 팀 구성 요청
          </button>
        </div>

        {/* AI Auto-Staffing Proposal */}
        {showAiProposal && (
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
                  <p className="text-[11px] text-slate-400 mt-1">2026 비전 수립 프로젝트</p>
                </div>
                <button onClick={() => setShowAiProposal(false)} className="text-slate-500 hover:text-white text-sm">✕</button>
              </div>

              {/* 팀 구성 카드 (1열 리스트) */}
              <div className="space-y-2 mb-4">
                <div className="bg-slate-900/50 p-3 rounded-lg border border-indigo-500/30">
                  <div className="text-[10px] text-indigo-400 mb-1">Recommended Leader</div>
                  <div className="font-bold text-white text-sm">이영희 (PM)</div>
                  <div className="text-[10px] text-slate-500 mt-1">유사 프로젝트 경험 3회</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 mb-1">Member</div>
                  <div className="font-bold text-slate-200 text-sm">김철수 (Dev)</div>
                  <div className="text-[10px] text-slate-500 mt-1">가용성 85%</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 mb-1">Member</div>
                  <div className="font-bold text-slate-200 text-sm">최수민 (Des)</div>
                  <div className="text-[10px] text-slate-500 mt-1">UI/UX 최적합</div>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="space-y-2">
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-medium transition-colors">
                  팀 구성 승인
                </button>
                <button className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg text-xs font-medium transition-colors">
                  수동 조정
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsView = () => {
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

              {PROJECTS.map(project => (
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
                      const member = EMPLOYEES.find(e => e.id === memId);
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

const TalentView = () => (
  <div className="grid grid-cols-2 gap-6 h-full">
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 overflow-y-auto">
      <h2 className="text-lg font-bold text-white mb-4">Live Personas</h2>
      <div className="space-y-4">
        {EMPLOYEES.map(emp => (
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

const OrchestratorApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

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
            {activeTab === "dashboard" && <DashboardView />}
            {activeTab === "projects" && <ProjectView />}
            {activeTab === "talent" && <TalentView />}
            {activeTab === "analytics" && <AnalyticsView />}
           </div>
        </div>
      </main>
    </div>
  );
};

export default OrchestratorApp;