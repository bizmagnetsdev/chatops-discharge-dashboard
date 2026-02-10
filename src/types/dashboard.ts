export interface TimelineItem {
  ticketId: number;
  patientName: string;
  uhid: string;
  wardBed: string;
  paymentType: string;
  dischargeStart: string;
  // Dynamic structure fields
  firstDeptAck?: string | null;
  firstDeptDone?: string | null;
  firstDeptAckSuccess?: string | null;
  departmentCompletionTimes: Record<string, string | null>;
  departmentInitiatedTimes?: Record<string, string>;
  departmentMoreTimeClicks?: Record<string, string>;
  targetTotalTat: string;
  actualTotalTat: string;
  configuredDepartments: string[];
}

export interface SLAItem {
  ticketId: number;
  patientName: string;
  uhid: string;
  wardBed: string;
  paymentType: string;
  // Dynamic structure fields
  firstDeptDelay: string;
  billReceivedDelay: string;
  departmentDelays: Record<string, string>;
  overallDelay: string;
  configuredDepartments: string[];
}

export interface Workflow {
  workflowName: string;
  reportDate: string;
  configuredDepartments: string[];
  departmentSlaConfig?: Record<string, number>;
  timeline: TimelineItem[];
  sla: SLAItem[];
  pendingCounts: Record<string, number> | null;
}

export interface DashboardResponse {
  date: string;
  count?: number;
  workflows?: Workflow[];
  status: string;
  message?: string;
}
