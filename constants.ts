import { Task } from './types';

export const INITIAL_DATA: Task[] = [
  // PRE-PROJECT PHASE
  { id: 1, phase: 'Pre-Project', task: 'Make contact with client', duration: 7, start: '2026-04-15', status: 'Completed' },
  { id: 2, phase: 'Pre-Project', task: 'Culture Kick-off', duration: 5, start: '2026-04-22', status: 'Not Started' },
  { id: 3, phase: 'Pre-Project', task: 'Make Top Leadership Appointment', duration: 5, start: '2026-04-27', status: 'Not Started' },
  { id: 4, phase: 'Pre-Project', task: 'Meeting with Top Leadership', duration: 1, start: '2026-05-02', status: 'Not Started' },
  { id: 5, phase: 'Pre-Project', task: 'Organogram (Template & Reporting Lines)', duration: 14, start: '2026-05-03', status: 'Not Started' },
  { id: 6, phase: 'Pre-Project', task: 'Schedule Project Launch', duration: 7, start: '2026-05-17', status: 'Not Started' },
  
  // DURING PROJECT PHASE
  { id: 7, phase: 'During Project', task: 'Quant Data: Send Survey Links', duration: 10, start: '2026-05-24', status: 'Not Started' },
  { id: 8, phase: 'During Project', task: 'Follow-up on Responses', duration: 5, start: '2026-06-03', status: 'Not Started' },
  { id: 9, phase: 'During Project', task: 'Data Analysis', duration: 14, start: '2026-06-08', status: 'Not Started' },
  { id: 10, phase: 'During Project', task: 'Qual Data: Interviews/Focus Groups', duration: 14, start: '2026-06-22', status: 'Not Started' },
  
  // POST PROJECT PHASE
  { id: 11, phase: 'Post-Project', task: 'Report Writing', duration: 14, start: '2026-07-06', status: 'Not Started' },
  { id: 12, phase: 'Post-Project', task: 'Top-Leadership Feedback Sessions', duration: 1, start: '2026-07-20', status: 'Not Started' },
  { id: 13, phase: 'Post-Project', task: 'Suggested Interventions', duration: 7, start: '2026-07-21', status: 'Not Started' },
];

export const PHASES = ['Pre-Project', 'During Project', 'Post-Project'];

export interface StatusStyle {
  badge: string;
  timeline: string;
  dot: string;
}

export const STATUS_STYLES: Record<string, StatusStyle> = {
  'Not Started': {
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    timeline: 'bg-slate-400',
    dot: 'bg-slate-400'
  },
  'In Progress': {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    timeline: 'bg-blue-500',
    dot: 'bg-blue-500'
  },
  'Completed': {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    timeline: 'bg-emerald-500',
    dot: 'bg-emerald-500'
  },
  'Delayed': {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    timeline: 'bg-rose-500',
    dot: 'bg-rose-500'
  },
};