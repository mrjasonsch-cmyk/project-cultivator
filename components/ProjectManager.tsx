import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Download, 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  ExternalLink, 
  FileSpreadsheet,
  Palette,
  Check
} from 'lucide-react';
import { Task, TimelineStats } from '../types';
import { INITIAL_DATA, PHASES, STATUS_STYLES } from '../constants';
import { 
  addDays, 
  formatDateDisplay, 
  formatDateForInput, 
  getDiffInDays, 
  parseDate 
} from '../utils';

type ThemeKey = 'light' | 'dark' | 'cayman';

interface ThemeStyles {
  name: string;
  bg: string;
  text: string;
  muted: string;
  border: string;
  card: string;
  cardHeader: string;
  gridLine: string;
  input: string;
  hover: string;
  buttonPrimary: string;
  buttonSecondary: string;
  headerStyle: 'standard' | 'gradient';
}

const THEMES: Record<ThemeKey, ThemeStyles> = {
  light: {
    name: 'Standard',
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    muted: 'text-slate-500',
    border: 'border-slate-200',
    card: 'bg-white',
    cardHeader: 'bg-slate-50',
    gridLine: 'border-slate-100',
    input: 'bg-transparent hover:border-slate-300 focus:border-indigo-500',
    hover: 'hover:bg-slate-50',
    buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    buttonSecondary: 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700',
    headerStyle: 'standard'
  },
  dark: {
    name: 'GitHub Dark',
    bg: 'bg-[#0d1117]',
    text: 'text-[#c9d1d9]',
    muted: 'text-[#8b949e]',
    border: 'border-[#30363d]',
    card: 'bg-[#161b22]',
    cardHeader: 'bg-[#161b22] border-b border-[#30363d]',
    gridLine: 'border-[#30363d]',
    input: 'bg-[#0d1117] border border-[#30363d] focus:border-[#58a6ff] text-[#c9d1d9]',
    hover: 'hover:bg-[#21262d]',
    buttonPrimary: 'bg-[#238636] hover:bg-[#2ea043] text-white border border-[rgba(240,246,252,0.1)]',
    buttonSecondary: 'bg-[#21262d] border-[#30363d] hover:bg-[#30363d] text-[#c9d1d9]',
    headerStyle: 'standard'
  },
  cayman: {
    name: 'Cayman',
    bg: 'bg-white',
    text: 'text-slate-700',
    muted: 'text-slate-500',
    border: 'border-slate-200',
    card: 'bg-white shadow-lg',
    cardHeader: 'bg-slate-50',
    gridLine: 'border-slate-100',
    input: 'bg-transparent hover:border-slate-300 focus:border-[#159957]',
    hover: 'hover:bg-slate-50',
    buttonPrimary: 'bg-gradient-to-r from-[#155799] to-[#159957] hover:opacity-90 text-white shadow-md',
    buttonSecondary: 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700',
    headerStyle: 'gradient'
  }
};

const ProjectManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_DATA);
  const [copyStep, setCopyStep] = useState<'idle' | 'copied'>('idle');
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('light');
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const theme = THEMES[currentTheme];

  // --- Derived State for Timeline ---
  const timelineStats = useMemo<TimelineStats>(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return { minDate: now, maxDate: now, totalDays: 1 };
    }

    const startDates = tasks.map(t => parseDate(t.start).getTime());
    const endDates = tasks.map(t => addDays(t.start, t.duration).getTime());
    
    const minDateTimestamp = Math.min(...startDates);
    const maxDateTimestamp = Math.max(...endDates);
    
    const minDate = new Date(minDateTimestamp);
    const maxDate = new Date(maxDateTimestamp);
    
    // Add buffer
    minDate.setDate(minDate.getDate() - 5);
    maxDate.setDate(maxDate.getDate() + 10);

    const totalDays = getDiffInDays(minDate, maxDate);

    return { minDate, maxDate, totalDays };
  }, [tasks]);

  // --- Handlers ---
  
  const handleUpdateTask = (id: number, field: keyof Task, value: string | number) => {
    setTasks(prev => {
      const index = prev.findIndex(t => t.id === id);
      if (index === -1) return prev;

      let updatedTasks = [...prev];
      updatedTasks[index] = { ...updatedTasks[index], [field]: value };

      // GROUPING LOGIC: If Phase changes, re-sort the list
      if (field === 'phase') {
        const phaseOrder = PHASES.reduce((acc, p, i) => ({...acc, [p]: i}), {} as Record<string, number>);
        
        updatedTasks.sort((a, b) => {
           const pA = phaseOrder[a.phase as string] ?? 999;
           const pB = phaseOrder[b.phase as string] ?? 999;
           // If phases differ, sort by phase order
           if (pA !== pB) return pA - pB;
           // If phases are same, try to maintain original relative order or ID
           return a.id - b.id; 
        });

        // After resort, we MUST update dates to maintain continuity across the whole chain
        for (let i = 1; i < updatedTasks.length; i++) {
           const prevTask = updatedTasks[i - 1];
           const prevTaskStart = parseDate(prevTask.start);
           const newStartDate = addDays(prevTaskStart, prevTask.duration);
           updatedTasks[i] = { ...updatedTasks[i], start: formatDateForInput(newStartDate) };
        }
      }
      // CASCADE LOGIC: If Date or Duration changes, update all subsequent tasks
      else if (field === 'start' || field === 'duration') {
        for (let i = index + 1; i < updatedTasks.length; i++) {
          const prevTask = updatedTasks[i - 1];
          // Logic: Next task starts exactly when previous task ends
          // Note: using parseDate ensures we handle the date string correctly
          const prevTaskStart = parseDate(prevTask.start);
          const newStartDate = addDays(prevTaskStart, prevTask.duration);
          
          updatedTasks[i] = {
            ...updatedTasks[i],
            start: formatDateForInput(newStartDate)
          };
        }
      }

      return updatedTasks;
    });
  };

  const handleDeleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTask = () => {
    const lastTask = tasks[tasks.length - 1];
    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    
    // Determine default phase based on last task or default to Post-Project
    const defaultPhase = lastTask ? lastTask.phase : 'Post-Project';

    let startDate = formatDateForInput(new Date());
    if (lastTask) {
       startDate = formatDateForInput(addDays(lastTask.start, lastTask.duration));
    }

    const newTask: Task = {
      id: newId,
      phase: defaultPhase,
      task: 'New Task',
      duration: 1,
      start: startDate,
      status: 'Not Started'
    };
    setTasks([...tasks, newTask]);
  };

  const exportToCSV = () => {
    const headers = ['Phase', 'Task', 'Start Date', 'Duration (Days)', 'End Date', 'Status'];
    const rows = tasks.map(t => {
      const endDate = formatDateForInput(addDays(t.start, t.duration));
      const safePhase = `"${(t.phase || '').replace(/"/g, '""')}"`;
      const safeTask = `"${(t.task || '').replace(/"/g, '""')}"`;
      const safeStatus = `"${(t.status || '').replace(/"/g, '""')}"`;
      return [safePhase, safeTask, t.start, t.duration, endDate, safeStatus].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cultivator_project_timeline.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyForSheets = async () => {
    if (copyStep === 'copied') {
      window.open('https://sheets.new', '_blank');
      setCopyStep('idle');
      return;
    }

    // TSV Header
    const headers = ['Phase', 'Task', 'Start Date', 'Duration (Days)', 'End Date', 'Status'];

    // Map tasks to rows with Tab separation
    const rows = tasks.map(t => {
      const endDate = formatDateForInput(addDays(t.start, t.duration));
      // Remove tabs from content to prevent breaking columns
      const safePhase = (t.phase || '').replace(/\t/g, ' ');
      const safeTask = (t.task || '').replace(/\t/g, ' ');
      const safeStatus = (t.status || '').replace(/\t/g, ' ');
      
      return [safePhase, safeTask, t.start, t.duration, endDate, safeStatus].join('\t');
    });

    const tsvContent = [headers.join('\t'), ...rows].join('\n');
    
    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(tsvContent);
        setCopyStep('copied');
        setTimeout(() => setCopyStep('idle'), 10000);
        return;
      } catch (err) {
        console.warn('Clipboard API failed, trying fallback', err);
      }
    }

    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = tsvContent;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopyStep('copied');
        // Reset after 10 seconds if they don't click
        setTimeout(() => setCopyStep('idle'), 10000);
      } else {
        alert("Unable to copy to clipboard automatically. Please use the CSV download.");
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      alert("Unable to copy to clipboard. Please use the CSV download.");
    }
    
    document.body.removeChild(textArea);
  };

  // --- Components ---

  const TimelineView = () => {
    // Calculate Today's position
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Normalize time
    
    const showToday = today >= timelineStats.minDate && today <= timelineStats.maxDate;
    const todayOffset = getDiffInDays(timelineStats.minDate, today);
    const todayPct = (todayOffset / timelineStats.totalDays) * 100;

    return (
      <div className={`w-full overflow-x-auto border rounded-lg shadow-sm mb-6 ${theme.card} ${theme.border}`}>
        <div className={`p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center sticky left-0 min-w-[800px] gap-2 ${theme.cardHeader} ${theme.border}`}>
          <div className="flex flex-col">
            <h3 className={`font-semibold flex items-center gap-2 ${theme.text}`}>
              <Calendar className="w-4 h-4" /> Visual Timeline
            </h3>
            <div className={`text-xs ${theme.muted}`}>
              {formatDateDisplay(timelineStats.minDate)} - {formatDateDisplay(timelineStats.maxDate)}
            </div>
          </div>
          
          {/* Status Legend */}
          <div className={`flex items-center gap-3 text-xs p-1.5 rounded-lg border ${currentTheme === 'dark' ? 'bg-[#21262d] border-[#30363d]' : 'bg-gray-50/50 border-gray-100'} ${theme.muted}`}>
            {Object.entries(STATUS_STYLES).map(([status, style]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`}></div>
                <span>{status}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="relative min-w-[800px] p-6">
          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none flex pl-6 pr-6">
             {[...Array(10)].map((_, i) => (
               <div key={i} className={`flex-1 border-r first:border-l ${theme.gridLine}`}></div>
             ))}
          </div>

          {/* Today Marker */}
          {showToday && (
            <div 
              className="absolute top-0 bottom-0 border-l-2 border-red-500 border-dashed z-20 pointer-events-none"
              style={{ left: `calc(${todayPct}% + 1.5rem)` }} // +1.5rem compensates for parent padding (pl-6) roughly
            >
              <div className="absolute -top-3 -left-6 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap shadow-sm">
                Today
              </div>
            </div>
          )}

          <div className="space-y-4 relative z-10">
            {PHASES.map(phase => {
              const phaseTasks = tasks.filter(t => t.phase === phase);
              if (phaseTasks.length === 0) return null;

              return (
                <div key={phase} className="space-y-2">
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1 sticky left-0 inline-block px-1 ${theme.muted} ${currentTheme === 'dark' ? 'bg-[#0d1117]/80' : 'bg-white/80'} backdrop-blur-sm`}>
                    {phase}
                  </div>
                  {phaseTasks.map(task => {
                    const startOffset = getDiffInDays(timelineStats.minDate, task.start);
                    const widthDays = task.duration;
                    const totalTimelineDays = timelineStats.totalDays;
                    
                    const leftPct = (startOffset / totalTimelineDays) * 100;
                    const widthPct = Math.max((widthDays / totalTimelineDays) * 100, 1); 

                    // Status-based coloring
                    const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES['Not Started'];
                    const colorClass = statusStyle.timeline;

                    return (
                      <div key={task.id} className="relative w-full mb-1 group">
                        <div 
                          className={`rounded-md shadow-sm opacity-90 hover:opacity-100 transition-all cursor-pointer flex items-center px-2 text-xs text-white min-h-[1.5rem] py-1 break-words leading-tight ${colorClass}`}
                          style={{ marginLeft: `${leftPct}%`, width: `${widthPct}%` }}
                          title={`${task.task}\nDuration: ${task.duration} days\nStatus: ${task.status}`}
                        >
                          {task.task}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 font-sans transition-colors duration-300 ${theme.bg}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className={`mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${theme.headerStyle === 'gradient' ? 'bg-gradient-to-r from-[#155799] to-[#159957] p-8 rounded-xl shadow-lg text-white' : ''}`}>
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${theme.headerStyle === 'gradient' ? 'text-white' : theme.text}`}>Project Cultivator Timeline</h1>
            <p className={`text-sm mt-1 ${theme.headerStyle === 'gradient' ? 'text-blue-100' : theme.muted}`}>Culture Gap Analysis & Intervention Plan</p>
          </div>
          
          {/* Actions & Theme Toggle */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
            
            {/* Theme Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className={`flex items-center justify-center w-10 h-10 rounded-lg shadow-sm transition-colors ${theme.headerStyle === 'gradient' ? 'bg-white/20 hover:bg-white/30 text-white border-transparent' : theme.buttonSecondary}`}
                title="Change Theme"
              >
                <Palette className="w-4 h-4" />
              </button>
              
              {showThemeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)}></div>
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border z-50 overflow-hidden ${theme.card} ${theme.border}`}>
                    <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b ${theme.cardHeader} ${theme.muted}`}>
                      Select Theme
                    </div>
                    {Object.keys(THEMES).map((key) => {
                      const tKey = key as ThemeKey;
                      const isActive = currentTheme === tKey;
                      return (
                        <button
                          key={tKey}
                          onClick={() => {
                            setCurrentTheme(tKey);
                            setShowThemeMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between ${theme.text} ${theme.hover} transition-colors`}
                        >
                          {THEMES[tKey].name}
                          {isActive && <Check className="w-4 h-4 text-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Main Google Sheets Action */}
            <button 
              onClick={handleCopyForSheets} 
              className={`flex-1 lg:flex-none justify-center lg:justify-start flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm text-sm font-medium transition-all ${
                copyStep === 'copied' 
                  ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' 
                  : theme.buttonSecondary
              }`}
            >
              {copyStep === 'copied' ? (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Copied! Open New Sheet ↗ 
                </>
              ) : (
                <>
                  <FileSpreadsheet className={`w-4 h-4 ${theme.headerStyle !== 'gradient' ? 'text-green-600' : ''}`} />
                  Copy for Google Sheets
                </>
              )}
            </button>
            
            {/* Fallback CSV */}
            <button 
              onClick={exportToCSV} 
              className={`flex items-center justify-center w-10 h-10 rounded-lg shadow-sm transition-colors border ${theme.headerStyle === 'gradient' ? 'bg-white/20 hover:bg-white/30 text-white border-transparent' : theme.buttonSecondary}`}
              title="Download CSV Backup"
            >
              <Download className="w-4 h-4" />
            </button>

            <button onClick={handleAddTask} className={`flex-1 lg:flex-none justify-center lg:justify-start flex items-center gap-2 px-4 py-2 rounded-lg shadow-md text-sm font-medium transition-colors ${theme.buttonPrimary}`}>
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>

        <div className="space-y-6">

          {/* Timeline Visualization */}
          <TimelineView />

          {/* Data Table */}
          <div className={`rounded-xl shadow-sm border overflow-hidden ${theme.card} ${theme.border}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className={`text-xs uppercase border-b ${theme.cardHeader} ${theme.muted} ${theme.border}`}>
                  <tr>
                    <th className="px-6 py-4 font-semibold">Phase</th>
                    <th className="px-6 py-4 font-semibold">Task Name</th>
                    <th className="px-6 py-4 font-semibold w-32">Start Date</th>
                    <th className="px-6 py-4 font-semibold w-24">Days</th>
                    <th className="px-6 py-4 font-semibold w-32">End Date</th>
                    <th className="px-6 py-4 font-semibold w-32">Status</th>
                    <th className="px-6 py-4 font-semibold w-10">Delete</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${currentTheme === 'dark' ? 'divide-[#30363d]' : 'divide-slate-100'}`}>
                  {tasks.map((task, index) => {
                    const endDate = addDays(task.start, task.duration);
                    const isLinked = index > 0;
                    const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES['Not Started'];

                    return (
                      <tr key={task.id} className={`transition-colors group ${theme.hover}`}>
                        <td className="px-6 py-3">
                          <select 
                            value={task.phase}
                            onChange={(e) => handleUpdateTask(task.id, 'phase', e.target.value)}
                            className={`bg-transparent border-none text-xs font-medium focus:ring-0 cursor-pointer transition-colors ${theme.muted} ${currentTheme === 'dark' ? 'hover:text-[#58a6ff]' : 'hover:text-indigo-600'}`}
                          >
                            {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-3">
                          <input 
                            type="text" 
                            value={task.task}
                            onChange={(e) => handleUpdateTask(task.id, 'task', e.target.value)}
                            className={`w-full bg-transparent border-b border-transparent font-medium py-1 focus:outline-none transition-all ${theme.text} ${currentTheme === 'dark' ? 'hover:border-[#30363d] focus:border-[#58a6ff]' : 'hover:border-slate-300 focus:border-indigo-500'}`}
                          />
                        </td>
                        <td className="px-6 py-3 relative">
                          {isLinked && (
                            <div className={`absolute left-2 top-1/2 -translate-y-1/2 ${currentTheme === 'dark' ? 'text-[#30363d]' : 'text-slate-300'}`} title="Linked to previous task">
                              <LinkIcon className="w-3 h-3" />
                            </div>
                          )}
                          <input 
                            type="date"
                            value={task.start}
                            onChange={(e) => handleUpdateTask(task.id, 'start', e.target.value)}
                            className={`w-full p-1 rounded text-xs transition-all ${theme.input} ${theme.text}`}
                          />
                        </td>
                        <td className="px-6 py-3">
                          <input 
                            type="number" 
                            min="1"
                            value={task.duration}
                            onChange={(e) => handleUpdateTask(task.id, 'duration', parseInt(e.target.value) || 1)}
                            className={`w-16 rounded px-2 py-1 text-center text-xs font-semibold transition-all ${theme.input}`}
                          />
                        </td>
                        <td className={`px-6 py-3 text-xs ${theme.muted}`}>
                          {formatDateDisplay(endDate)}
                        </td>
                        <td className="px-6 py-3">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTask(task.id, 'status', e.target.value)}
                            className={`text-xs rounded-full px-2.5 py-1 border font-medium cursor-pointer focus:ring-2 focus:ring-offset-1 outline-none transition-all ${statusStyle.badge} ${currentTheme === 'dark' ? 'ring-offset-[#0d1117]' : ''}`}
                          >
                            {Object.keys(STATUS_STYLES).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className={`p-2 rounded-full transition-all ${currentTheme === 'dark' ? 'text-[#8b949e] hover:text-red-400 hover:bg-[rgba(248,81,73,0.1)]' : 'text-slate-300 hover:text-red-600 hover:bg-red-50'}`}
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Empty State / Footer */}
            {tasks.length === 0 && (
              <div className={`p-12 text-center border-t flex flex-col items-center gap-2 ${theme.muted} ${currentTheme === 'dark' ? 'border-[#30363d]' : 'border-slate-100'}`}>
                <Calendar className="w-8 h-8 opacity-20" />
                <p>No tasks found. Click "Add Task" to start planning.</p>
              </div>
            )}
            <div className={`border-t p-4 text-xs flex justify-between items-center ${theme.cardHeader} ${theme.muted} ${theme.border}`}>
              <span>Showing {tasks.length} tasks</span>
              <span className="flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> 
                Tasks are linked: Changing a date or duration will automatically update subsequent tasks.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManager;