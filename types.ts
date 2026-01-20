export type Phase = 'Pre-Project' | 'During Project' | 'Post-Project';

export type Status = 'Not Started' | 'In Progress' | 'Completed' | 'Delayed' | string;

export interface Task {
  id: number;
  phase: Phase | string;
  task: string;
  duration: number;
  start: string; // ISO Date string YYYY-MM-DD
  status: Status;
}

export interface TimelineStats {
  minDate: Date;
  maxDate: Date;
  totalDays: number;
}