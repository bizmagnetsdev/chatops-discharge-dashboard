'use client';

import React from 'react';
import { Workflow } from '@/types/dashboard';
import { formatTime, getStatusColor, parseDelayMinutes, calculateCompletionTime, formatDuration, formatDelayString, calculateBillDelay } from '@/utils/dateUtils';
import clsx from 'clsx';
import LiveTimer from './LiveTimer';
import { isBefore, startOfDay, parseISO } from 'date-fns';

const TAT_MS_REGEX = /^\d/; // Matches "1 mins" etc which start with digit

interface DischargeTableProps {
    workflow: Workflow;
    filterStatus?: 'all' | 'delayed' | 'ontime' | 'inprogress';
    isDemo?: boolean;
}

const DischargeTable: React.FC<DischargeTableProps> = ({ workflow, filterStatus = 'all', isDemo = false }) => {
    const { timeline, sla, configuredDepartments = [] } = workflow;
    const tableContainerRef = React.useRef<HTMLDivElement>(null);

    const [isPastDate, setIsPastDate] = React.useState(false);

    React.useEffect(() => {
        const reportDate = workflow.reportDate ? parseISO(workflow.reportDate) : new Date();
        const today = startOfDay(new Date());
        setIsPastDate(isBefore(startOfDay(reportDate), today));
    }, [workflow.reportDate]);


    const [showGif, setShowGif] = React.useState(isDemo);

    React.useEffect(() => {
        if (isDemo) {
            setShowGif(true); // Always show GIF in Demo mode
            return;
        }

        // Toggle between GIF and Seconds every 3 seconds in Normal Mode
        const interval = setInterval(() => {
            setShowGif(prev => !prev);
        }, 3000);

        return () => clearInterval(interval);
    }, [isDemo]);

    const [sortConfig, setSortConfig] = React.useState<{ key: string | null }>({ key: null });
    const [pendingSortDept, setPendingSortDept] = React.useState<string | null>(isDemo ? 'House Keeping' : null);

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current.key === key) {
                return { key: null }; // Reset to default
            }
            return { key }; // Set sort
        });
        setPendingSortDept(null); // Reset pending sort when column sort is used
    };

    const handlePendingSort = (dept: string) => {
        setPendingSortDept(prev => prev === dept ? null : dept);
        setSortConfig({ key: null }); // Reset column sort when pending sort is used
    };

    const getSortValue = (row: any, key: string) => {
        let valStr = '';
        if (key === 'Overall Time') {
            valStr = row.sla?.overallDelay || '';
        } else if (key === 'Bill Received') {
            // Better to parse row data directly for Bill Received Delay or rely on row.sla?.firstDeptDelay if reliable.
            // Actually, based on logic below:
            const isInitiated = !!row.firstDeptAck;
            const isCompleted = !!row.firstDeptAckSuccess;
            if (isInitiated && !isCompleted) {
                // Pending - treat as low priority or infinity?
                return -Infinity;
            }
            // For completed, get delay string
            if (isCompleted) {
                const billDelay = calculateBillDelay(row.firstDeptAck, row.firstDeptAckSuccess);
                valStr = billDelay;
            }
        } else {
            // Department
            const deptIndex = configuredDepartments.indexOf(key);
            if (deptIndex === 0) {
                valStr = row.sla?.firstDeptDelay || '';
            } else {
                valStr = row.sla?.departmentDelays?.[key] || '';
            }
        }

        if (!valStr || valStr === 'Pending' || valStr === 'NA') return -Infinity; // Put Pending/NA at bottom

        return parseDelayMinutes(valStr);
    };

    // Calculate Target TAT for Cash and Insurance from Timeline (Old Logic)
    const formatTargetDuration = (str: string) => {
        const mins = parseInt(str) || 0;
        if (!mins) return 'N/A';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) return (
            <span>
                {String(h).padStart(2, '0')}<span className="normal-case">h</span>{String(m).padStart(2, '0')}<span className="normal-case">m</span>
            </span>
        );
        return (
            <span>
                {m}<span className="normal-case">m</span>
            </span>
        );
    };

    const cashTarget = React.useMemo(() => {
        const item = timeline.find(t => t.paymentType?.toLowerCase().includes('cash') && t.targetTotalTat);
        return item ? formatTargetDuration(`${parseInt(item.targetTotalTat) || 0} mins`) : 'N/A';
    }, [timeline]);

    const insuranceTarget = React.useMemo(() => {
        const item = timeline.find(t => (t.paymentType?.toLowerCase().includes('insurance') || t.paymentType?.toLowerCase().includes('tpa')) && t.targetTotalTat);
        return item ? formatTargetDuration(`${parseInt(item.targetTotalTat) || 0} mins`) : 'N/A';
    }, [timeline]);

    // Merge timeline and SLA by ticketId
    const rawMergedData = timeline.map(item => {
        const slaItem = sla.find(s => s.ticketId === item.ticketId);
        return { ...item, sla: slaItem };
    });

    // ... Sort Logic (omitted for brevity, assume unchanged if not in range) ...
    // Wait, replace_file_content needs exact context. I should just target specific blocks or replace the whole component structure if small enough.
    // The previous view showed lines 100-250.
    // Let's do multiple replacements.

    // 1. Props update

    // 2. Scroll Logic Disable
    /* 
    React.useEffect(() => {
       // ... commented out ...
    }, [filterStatus ...]);
    */

    // Let's use `multi_replace_file_content` to be surgical.



    // Sort Logic:
    // 1. Ongoing (Pending Overall Delay) first
    // 2. Completed (Has Overall Delay), sorted by Delay Descending (Most delayed first)
    const ongoing = rawMergedData.filter(r => r.sla?.overallDelay === 'Pending');
    const completed = rawMergedData.filter(r => r.sla?.overallDelay !== 'Pending');

    // Split completed into delayed and ontime for finding scroll targets
    const delayed = completed.filter(r => r.sla?.overallDelay?.toLowerCase().includes('plus'));
    const ontime = completed.filter(r => !r.sla?.overallDelay?.toLowerCase().includes('plus'));

    // Sort delayed by duration desc
    delayed.sort((a, b) => {
        const delayA = parseDelayMinutes(a.sla?.overallDelay || '0');
        const delayB = parseDelayMinutes(b.sla?.overallDelay || '0');
        return delayB - delayA;
    });

    // Sort ontime? Usually just by timestamp or something. Let's keep existing sort for consistency if needed, 
    // but separating them makes finding the "start" of "ontime" group easier.
    // Actually, let's keep the single sortedCompleted list to maintain the exact logic as before, 
    // BUT we need to know WHICH ticket is the first "Delayed" and first "OnTime".

    // Re-construct the full sorted list exactly as before so visual order is preserved
    const sortedCompleted = completed.sort((a, b) => {
        const delayA = parseDelayMinutes(a.sla?.overallDelay || '0');
        const delayB = parseDelayMinutes(b.sla?.overallDelay || '0');
        return delayB - delayA; // Descending
    });

    const mergedData = React.useMemo(() => {
        let data = [...ongoing, ...sortedCompleted];

        if (pendingSortDept) {
            data.sort((a, b) => {
                const getIsPending = (row: any, dept: string) => {
                    if (dept === 'Overall Time') return row.sla?.overallDelay === 'Pending';
                    if (dept === 'Bill Received') return !!row.firstDeptAck && !row.firstDeptAckSuccess;

                    const deptIndex = configuredDepartments.indexOf(dept);
                    const isInitiated = deptIndex === 0 ? !!row.firstDeptAck : !!row.departmentInitiatedTimes?.[dept];
                    const isCompleted = deptIndex === 0 ? !!row.firstDeptDone : !!row.departmentCompletionTimes?.[dept];
                    return isInitiated && !isCompleted;
                };

                const isAPending = getIsPending(a, pendingSortDept);
                const isBPending = getIsPending(b, pendingSortDept);

                if (isAPending && !isBPending) return -1;
                if (!isAPending && isBPending) return 1;
                return 0;
            });
        }
        else if (sortConfig.key) {
            data.sort((a, b) => {
                const valA = getSortValue(a, sortConfig.key!);
                const valB = getSortValue(b, sortConfig.key!);
                return valB - valA; // Descending (High positive first, Low negative last)
            });
        }
        return data;
    }, [ongoing, sortedCompleted, sortConfig, pendingSortDept, configuredDepartments]);

    // Scroll Logic
    // Scroll Logic - Disabled per user request
    /*
    React.useEffect(() => {
        if (!tableContainerRef.current) return;
    
        let targetId: string | number = '';
    
        if (filterStatus === 'inprogress' && ongoing.length > 0) {
            targetId = ongoing[0].ticketId;
        } else if (filterStatus === 'delayed') {
            const firstDelayed = sortedCompleted.find(r => r.sla?.overallDelay?.toLowerCase().includes('plus'));
            if (firstDelayed) targetId = firstDelayed.ticketId;
        } else if (filterStatus === 'ontime') {
            const firstOntime = sortedCompleted.find(r => !r.sla?.overallDelay?.toLowerCase().includes('plus'));
            if (firstOntime) targetId = firstOntime.ticketId;
        } else if (filterStatus === 'all') {
            // Scroll to top
            tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
    
        if (targetId) {
            const element = document.getElementById(`row-${targetId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [filterStatus, ongoing, sortedCompleted]);
    */

    // Helper to calculate stats
    const getDeptStats = (dept: string) => {
        if (dept === 'Bill Received') {
            const pendingBills = mergedData.filter(r => r.firstDeptAck && !r.firstDeptAckSuccess).length;
            const completedBills = mergedData.filter(r => r.firstDeptAckSuccess).length;
            return { pending: pendingBills, completed: completedBills };
        }

        const pendingCount = mergedData.filter(row => {
            const slaVal = dept === configuredDepartments[0]
                ? row.sla?.firstDeptDelay
                : row.sla?.departmentDelays?.[dept];

            if (slaVal === 'NA' || slaVal === undefined) return false;

            // Check initiation
            const isInitiated = dept === configuredDepartments[0]
                ? !!row.firstDeptAck
                : !!row.departmentInitiatedTimes?.[dept];

            const isCompleted = dept === configuredDepartments[0]
                ? !!row.firstDeptDone
                : !!row.departmentCompletionTimes?.[dept];

            return isInitiated && !isCompleted;
        }).length;

        const completedCount = mergedData.filter(row => {
            const slaVal = dept === configuredDepartments[0]
                ? row.sla?.firstDeptDelay
                : row.sla?.departmentDelays?.[dept];

            // If explicitly completed in SLA or has done time
            const isDone = dept === configuredDepartments[0]
                ? !!row.firstDeptDone
                : !!row.departmentCompletionTimes?.[dept];

            return isDone;
        }).length;

        return { pending: pendingCount, completed: completedCount };
    };

    // Calculate Target TAT for Cash and Insurance
    const formatDuration = (str: string) => {
        const mins = parseInt(str) || 0;
        if (!mins) return 'N/A';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0) return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}m`;
        return `${m}m`;
    };

    return (
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white/60 flex flex-col h-full max-h-[80vh]">
            {/* Target TAT Header Removed - Moved to Footer */}

            <div ref={tableContainerRef} className="overflow-auto flex-1 relative">
                <table className="w-full text-sm border-separate border-spacing-0">
                    <thead className="bg-slate-100 text-slate-500 font-semibold shadow-sm z-10">
                        <tr className="sticky top-0 z-30 bg-slate-100 border-b border-slate-200 text-center text-[10px] uppercase tracking-wider h-12">

                            <th className="p-1 bg-slate-100 border-b border-slate-200 whitespace-nowrap min-w-[200px] text-center">
                                <div className="flex flex-col items-center">
                                    <span>PATIENT NAME</span>
                                    {/* <span className="ml-1 text-slate-700 font-normal">(UHID) ({mergedData.length})</span> */}
                                    <span className="ml-1 text-slate-700 font-normal">(UHID)</span>
                                </div>
                            </th>
                            <th className="p-1 bg-slate-100 border-b border-slate-200 whitespace-nowrap min-w-[100px] text-center align-middle">
                                <div className="flex items-center justify-center h-full">
                                    Ward & Bed
                                </div>
                            </th>
                            <th
                                className="p-1 bg-slate-100 border-b border-slate-200 whitespace-nowrap min-w-[140px] text-center align-middle cursor-pointer hover:bg-slate-200 transition-colors select-none"
                                onClick={() => handleSort('Overall Time')}
                            >
                                <div className="flex items-center justify-center h-full gap-1">
                                    Overall Time
                                    {sortConfig.key === 'Overall Time' && <span className="text-[10px] text-slate-500">▼</span>}
                                    {/* {ongoing.length > 0 && <span className="text-yellow-600 ml-1">({ongoing.length})</span>} */}
                                </div>
                            </th>

                            <th
                                className="p-1 bg-slate-100 border-b border-slate-200 min-w-[100px] text-center align-middle cursor-pointer hover:bg-slate-200 transition-colors select-none"
                                onClick={() => handleSort('Bill Received')}
                            >
                                <div className="flex items-center justify-center h-full gap-1">
                                    <span>{isDemo ? 'Drugs Returned' : 'Bill Received'}</span>
                                    {sortConfig.key === 'Bill Received' && <span className="text-[10px] text-slate-500">▼</span>}
                                    {(() => {
                                        const stats = getDeptStats('Bill Received');
                                        // if (stats.pending > 0) return <span className="text-yellow-600 font-bold ml-1">-{stats.pending}</span>;
                                        return null;
                                    })()}
                                </div>
                            </th>

                            {configuredDepartments.map((dept) => {
                                const stats = getDeptStats(dept);
                                const isNurse = dept.toLowerCase() === 'nurse';
                                const isInsurance = dept.toUpperCase() === 'INSURANCE';
                                const headerText = isNurse ? (isDemo ? 'Room Status' : 'Room Status') : (isInsurance ? (isDemo ? 'INSURANCE' : 'INSURANCE/TPA') : (isDemo && dept === 'Billing' ? 'Billing + Summary' : dept));
                                return (
                                    <th key={dept}
                                        className={clsx(
                                            "bg-slate-100 border-b border-slate-200 text-center align-middle cursor-pointer hover:bg-slate-200 transition-colors select-none",
                                            "p-1 min-w-[110px]",
                                            !isNurse && "truncate"
                                        )}
                                        onClick={() => handleSort(dept)}
                                    >
                                        <div className="flex items-center justify-center h-full w-full">
                                            {isNurse ? (
                                                <div className="relative group cursor-default flex items-center justify-center w-full px-1">
                                                    <span className="whitespace-normal break-words leading-tight">
                                                        Room Status
                                                    </span>
                                                    {/* {stats.pending > 0 && <span className="text-yellow-600 font-bold ml-1 whitespace-nowrap">-{stats.pending}</span>} */}

                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg hidden group-hover:block z-50 whitespace-nowrap font-normal normal-case tracking-normal">
                                                        Room Vacated Status
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center w-full px-1 gap-1">
                                                    <span className="whitespace-normal break-words">{headerText}</span>
                                                    {sortConfig.key === dept && <span className="text-[10px] text-slate-500">▼</span>}
                                                    {/* {stats.pending > 0 && <span className="text-yellow-600 font-bold ml-1 whitespace-nowrap">-{stats.pending}</span>} */}
                                                </div>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>

                        {/* Pending Count Row - Moved to Header */}
                        <tr className="bg-slate-50 font-bold text-slate-900 border-b border-slate-200 sticky top-12 z-20 shadow-sm h-7">
                            <td
                                colSpan={2}
                                className="p-1 pl-2 text-center text-slate-500 uppercase tracking-widest text-[10px]"
                            >
                                Pending Count
                            </td>
                            {/* Overall Time Pending */}
                            <td
                                className={`p-1 text-center cursor-pointer hover:bg-slate-100 transition-colors ${pendingSortDept === 'Overall Time' ? 'bg-yellow-50' : ''}`}
                                onClick={() => handlePendingSort('Overall Time')}
                                title="Click to sort by pending items"
                            >
                                {ongoing.length > 0 ? (
                                    <span className={clsx(
                                        "font-mono text-xs",
                                        pendingSortDept === 'Overall Time' ? "text-slate-900 font-bold underline decoration-yellow-500 underline-offset-4" : "text-yellow-600"
                                    )}>
                                        {ongoing.length}
                                    </span>
                                ) : (
                                    <span className="text-slate-400 font-mono text-[10px]">-</span>
                                )}
                            </td>

                            {/* Bill Received Pending */}
                            <td
                                className={`p-1 text-center cursor-pointer hover:bg-slate-100 transition-colors ${pendingSortDept === 'Bill Received' ? 'bg-yellow-50' : ''}`}
                                onClick={() => handlePendingSort('Bill Received')}
                                title="Click to sort by pending items"
                            >
                                {(() => {
                                    const pendingCount = getDeptStats('Bill Received').pending;
                                    return pendingCount > 0 ? (
                                        <span className={clsx(
                                            "font-mono text-xs",
                                            pendingSortDept === 'Bill Received' ? "text-slate-900 font-bold underline decoration-yellow-500 underline-offset-4" : "text-yellow-600"
                                        )}>
                                            {pendingCount}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 font-mono text-[10px]">-</span>
                                    );
                                })()}
                            </td>

                            {/* Department Pendings */}
                            {configuredDepartments.map((dept) => {
                                const count = getDeptStats(dept).pending;
                                return (
                                    <td
                                        key={dept}
                                        className={`p-1 text-center cursor-pointer hover:bg-slate-100 transition-colors ${pendingSortDept === dept ? 'bg-yellow-50' : ''}`}
                                        onClick={() => handlePendingSort(dept)}
                                        title="Click to sort by pending items"
                                    >
                                        {count > 0 ? (
                                            <span className={clsx(
                                                "font-mono text-xs",
                                                pendingSortDept === dept ? "text-slate-900 font-bold underline decoration-yellow-500 underline-offset-4" : "text-yellow-600"
                                            )}>
                                                {count}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-mono text-[10px]">-</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>

                        {/* Target TAT Row - Demo Only */}
                        {isDemo && (
                            <tr className="bg-slate-50 border-b border-slate-200 sticky top-[76px] z-20 shadow-sm h-5">
                                <td colSpan={3} className="p-1 pl-4 text-left align-middle font-bold text-slate-500 text-xs">
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-900 font-bold uppercase mr-1">TARGET TAT:</span>
                                        <div className="flex items-center gap-2">
                                            <div className="whitespace-nowrap"><span className="text-slate-900 font-bold uppercase mr-1">CASH:</span> <span className="font-bold text-blue-600">{cashTarget}</span></div>
                                            <div className="whitespace-nowrap"><span className="text-slate-900 font-bold uppercase mr-1">{isDemo ? 'INSURANCE:' : 'INSURANCE/TPA:'}</span> <span className="font-bold text-purple-600">{insuranceTarget}</span></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-1 text-center align-middle font-bold text-slate-900 text-xs">15m</td>
                                {configuredDepartments.map((dept) => {
                                    const slaMins = workflow.departmentSlaConfig?.[dept] || 0;
                                    // Handle "-" for Cash Counter if SLA is 0
                                    if (slaMins === 0) return (
                                        <td key={`${dept}-target`} className="p-1 text-center align-middle font-bold text-slate-900 text-xs">
                                            -
                                        </td>
                                    );

                                    const h = Math.floor(slaMins / 60);
                                    const m = slaMins % 60;
                                    const formatted = h > 0 ? `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}m` : `${m}m`;

                                    return (
                                        <td key={`${dept}-target`} className="p-1 text-center align-middle font-bold text-slate-900 text-xs">
                                            {formatted}
                                        </td>
                                    );
                                })}
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {mergedData.map((row) => {
                            const isDelayed = row.sla?.overallDelay?.includes('plus');
                            const billDelay = calculateBillDelay(row.firstDeptAck, row.firstDeptAckSuccess);
                            const billStatusColor = getStatusColor(billDelay);

                            const isPending = row.sla?.overallDelay === 'Pending';

                            return (
                                <tr
                                    key={row.ticketId}
                                    id={`row-${row.ticketId}`}
                                    className={clsx(
                                        "transition-colors border-b border-slate-100",
                                        isPending ? "bg-blue-50 hover:bg-blue-100" : "bg-emerald-100 hover:bg-emerald-200"
                                    )}
                                >
                                    <td className="p-2 font-medium text-slate-900 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold">{row.patientName}</span>
                                            <span className="text-xs text-slate-500">{row.uhid}</span>
                                        </div>
                                    </td>

                                    <td className="p-2 text-slate-600 font-medium text-center">
                                        {row.wardBed}
                                    </td>

                                    {/* Merged Overall Time Taken & Delay */}
                                    <td className="p-2 font-mono align-top text-center">
                                        {isPending ? (
                                            <div className="flex flex-col space-y-1 items-center min-h-[40px] justify-center">
                                                <span className="text-xs text-blue-600 font-bold whitespace-nowrap block mt-1">
                                                    {formatTime(row.dischargeStart)}
                                                </span>
                                                {isPastDate ? (
                                                    null
                                                ) : (
                                                    <div className="h-6 flex items-center justify-center w-full">
                                                        <div className="h-6 flex items-center justify-center w-full">
                                                            <LiveTimer
                                                                startTime={row.dischargeStart}
                                                                slaDuration={parseInt(row.targetTotalTat) || 0}
                                                                showGif={showGif}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-xs gap-y-1">
                                                <div className="grid grid-cols-[50px_1fr] text-left gap-x-2">
                                                    <span className="text-slate-500">Starts:</span>
                                                    <span className="text-slate-900 font-bold whitespace-nowrap">{formatTime(row.dischargeStart)}</span>

                                                    <span className="text-slate-500">Ends:</span>
                                                    <span className="text-slate-900 font-bold whitespace-nowrap">
                                                        {calculateCompletionTime(row.dischargeStart, row.actualTotalTat)}
                                                    </span>

                                                    <span className="text-slate-500">Actual:</span>
                                                    <span className="font-bold text-slate-900 whitespace-nowrap">
                                                        {formatDuration(row.actualTotalTat)}
                                                    </span>
                                                </div>

                                                <div className="mt-1">
                                                    <span
                                                        className={clsx(
                                                            "font-bold text-xs",
                                                            getStatusColor(row.sla?.overallDelay).replace('bg-emerald-100 text-emerald-800', 'text-emerald-600').replace('bg-red-100 text-red-800', 'text-red-600')
                                                        )}
                                                    >
                                                        {formatDelayString(row.sla?.overallDelay || 'Pending')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </td>

                                    {/* Bill Received Column */}
                                    <td className="p-2 text-center align-top">
                                        {(() => {
                                            const isInitiated = !!row.firstDeptAck;
                                            const isCompleted = !!row.firstDeptAckSuccess;

                                            if (isInitiated && !isCompleted) {
                                                return (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-bold text-blue-600 block">
                                                            {formatTime(row.firstDeptAck ?? null)}
                                                        </span>
                                                        {isPastDate ? null : (
                                                            <>
                                                                {isPastDate ? null : (
                                                                    <div className="h-6 flex items-center justify-center w-full">
                                                                        <LiveTimer
                                                                            startTime={row.firstDeptAck!}
                                                                            slaDuration={15}
                                                                            warningMin={5} // 15m SLA: 0-10 Green, 10-15 Yellow
                                                                            isExtended={false}
                                                                            showGif={showGif}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            if (isCompleted) {
                                                return (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs text-blue-600 font-bold whitespace-nowrap block">
                                                            {formatTime(row.firstDeptAck ?? null)}
                                                        </span>
                                                        <span className="text-xs text-purple-600 font-bold block">
                                                            {formatTime(row.firstDeptAckSuccess ?? null)}
                                                        </span>
                                                        <span className={clsx(billStatusColor, "text-xs font-bold",
                                                            !billStatusColor.includes('red') && billDelay !== 'Pending' && "text-slate-600"
                                                        )}>
                                                            {formatDelayString(billDelay)}
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return <span className="text-slate-400 font-mono">-</span>;
                                        })()}
                                    </td>

                                    {
                                        configuredDepartments.map((dept, deptIndex) => {
                                            let tatMs = 'NA';
                                            let doneTime: string | null | undefined = null;

                                            if (deptIndex === 0) {
                                                tatMs = row.sla?.firstDeptDelay || 'NA';
                                                doneTime = row.firstDeptDone;
                                            } else {
                                                tatMs = row.sla?.departmentDelays?.[dept] || 'NA';
                                                doneTime = row.departmentCompletionTimes?.[dept];
                                            }

                                            const slaMins = workflow.departmentSlaConfig?.[dept] ?? 0;
                                            const hasSla = slaMins > 0;

                                            const isInitiated = deptIndex === 0
                                                ? !!row.firstDeptAck
                                                : !!row.departmentInitiatedTimes?.[dept];

                                            const isCompleted = !!doneTime;

                                            if (isInitiated && !isCompleted) {
                                                const startTime = deptIndex === 0
                                                    ? row.firstDeptAck
                                                    : row.departmentInitiatedTimes?.[dept];

                                                const moreTimeClick = row.departmentMoreTimeClicks?.[dept];

                                                if (startTime) {
                                                    return (
                                                        <td key={`${dept}-${row.ticketId}`} className="p-4 border-b border-slate-200 align-top text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-xs font-bold text-blue-600 block">
                                                                    {formatTime(startTime)}
                                                                </span>
                                                                {isPastDate ? (
                                                                    null
                                                                ) : (
                                                                    <div className="h-6 flex items-center justify-center w-full">
                                                                        <LiveTimer
                                                                            startTime={startTime}
                                                                            slaDuration={slaMins}
                                                                            isExtended={!!moreTimeClick}
                                                                            showGif={showGif}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                }
                                            }

                                            if (!isInitiated && tatMs === 'Pending') {
                                                tatMs = '-';
                                            }

                                            let statusColorClass = getStatusColor(tatMs);
                                            if (!hasSla && (TAT_MS_REGEX.test(tatMs) || tatMs.includes('plus'))) {
                                                if (statusColorClass.includes('status-red')) {
                                                    statusColorClass = 'text-slate-600 font-medium';
                                                }
                                            }

                                            return (
                                                <td key={dept} className="p-2 align-top text-center">
                                                    <div className="flex flex-col items-center">
                                                        {doneTime ? (
                                                            <>
                                                                <span className="text-xs text-blue-600 font-bold whitespace-nowrap block">
                                                                    {formatTime(deptIndex === 0 ? (row.firstDeptAck ?? null) : (row.departmentInitiatedTimes?.[dept] ?? null))}
                                                                </span>
                                                                <span className="text-xs text-purple-600 font-bold whitespace-nowrap block">
                                                                    {formatTime(doneTime ?? null)}
                                                                </span>
                                                            </>
                                                        ) : null}
                                                        <span className={clsx(statusColorClass, "text-xs font-bold")}>
                                                            {formatDelayString(tatMs)}
                                                        </span>
                                                    </div>
                                                </td>
                                            );
                                        })
                                    }
                                </tr>
                            );
                        })}

                        {/* Footer Rows - Keeping similar logic but with adjusted colSpan */}
                        <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                            <td
                                colSpan={2}
                                className="p-2 text-center text-slate-500 uppercase tracking-widest text-sm"
                            >
                                Pending Count
                            </td>
                            {/* Overall Time Pending */}
                            <td className="p-2 text-center">
                                {ongoing.length > 0 ? (
                                    <span className="text-yellow-600 font-mono text-sm">{ongoing.length}</span>
                                ) : (
                                    <span className="text-slate-400 font-mono">-</span>
                                )}
                            </td>
                            {/* Bill Received Pending */}
                            <td className="p-2 text-center">
                                {(() => {
                                    const pendingCount = getDeptStats('Bill Received').pending;
                                    return pendingCount > 0 ? (
                                        <span className="text-yellow-600 font-mono text-sm">{pendingCount}</span>
                                    ) : (
                                        <span className="text-slate-400 font-mono">-</span>
                                    );
                                })()}
                            </td>
                            {/* Department Pendings */}
                            {configuredDepartments.map((dept) => {
                                const count = getDeptStats(dept).pending;
                                return (
                                    <td key={dept} className="p-2 text-center">
                                        {count > 0 ? (
                                            <span className="text-yellow-600 font-mono text-sm">
                                                {count}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-mono">-</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>

                        <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                            <td
                                colSpan={2}
                                className="p-2 text-center text-slate-500 uppercase tracking-widest text-sm"
                            >
                                Completed Count
                            </td>
                            {/* Overall Time Completed */}
                            <td className="p-2 text-center">
                                {completed.length > 0 ? (
                                    <span className="text-emerald-600 font-mono text-sm">{completed.length}</span>
                                ) : (
                                    <span className="text-slate-400 font-mono">-</span>
                                )}
                            </td>
                            <td className="p-2 text-center">
                                {(() => {
                                    const completedCount = getDeptStats('Bill Received').completed;
                                    return completedCount > 0 ? (
                                        <span className="text-emerald-600 font-mono text-sm">{completedCount}</span>
                                    ) : (
                                        <span className="text-slate-400 font-mono">-</span>
                                    );
                                })()}
                            </td>
                            {configuredDepartments.map((dept) => {
                                const count = getDeptStats(dept).completed;
                                return (
                                    <td key={dept} className="p-2 text-center">
                                        {count > 0 ? (
                                            <span className="text-emerald-600 font-mono text-sm">
                                                {count}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-mono">-</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>

                        <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
                            <td colSpan={2} className="p-2 text-center text-slate-500 uppercase tracking-widest text-sm">
                                Total Time
                            </td>
                            <td className="p-2 text-center">
                                <span className="text-slate-400 font-mono">-</span>
                            </td>
                            {/* Skipping Overall Delay Sum column since it was part of the merged column logic in footer? 
                                Actually, the footer structure needs to match the body columns.
                                Body: Name | Ward | Overall Time | Bill Received | Depts...
                                Footer: Label (Colspan 3 handles Name+Ward+Overall) | Bill Received | Depts...
                            */}

                            <td className="p-2 text-center">
                                {(() => {
                                    const totalBillDelay = mergedData.reduce((acc, row) => {
                                        if (row.sla?.overallDelay === 'Pending') return acc;
                                        const delayStr = calculateBillDelay(row.firstDeptAck, row.firstDeptAckSuccess);
                                        const parsed = parseDelayMinutes(delayStr);
                                        return acc + (parsed > 0 ? parsed : 0);
                                    }, 0);
                                    return totalBillDelay > 0 ? (
                                        <span className="!text-red-600 font-mono text-sm font-bold">
                                            {formatDelayString(`plus ${totalBillDelay} mins`)}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 font-mono">-</span>
                                    );
                                })()}
                            </td>


                            {configuredDepartments.map((dept, index) => {
                                const slaMins = workflow.departmentSlaConfig?.[dept] ?? 0;
                                const hasSla = slaMins > 0;
                                if (!hasSla) return <td key={dept} className="p-2 text-center"><span className="text-slate-600 font-mono">-</span></td>;

                                const totalDeptMinutes = workflow.sla.reduce((acc, curr) => {
                                    if (curr.overallDelay === 'Pending') return acc;
                                    let delayString = '0';
                                    if (index === 0) delayString = curr.firstDeptDelay || '0';
                                    else delayString = curr.departmentDelays?.[dept] || '0';
                                    const parsed = parseDelayMinutes(delayString);
                                    return acc + (parsed > 0 ? parsed : 0);
                                }, 0);

                                return (
                                    <td key={dept} className="p-2 text-center">
                                        {totalDeptMinutes > 0 ? (
                                            <span className="!text-red-600 font-mono text-sm font-bold">
                                                {formatDelayString(`${totalDeptMinutes} mins`)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-mono">-</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                        {!isDemo && (
                            <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200 sticky bottom-0 z-20 shadow-inner">
                                <td colSpan={3} className="p-1 text-left text-xs font-bold text-slate-500 uppercase tracking-wider pl-4">
                                    <div className="flex items-center gap-6">
                                        <span>Target TAT:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900">Cash:</span>
                                            <span className="font-mono font-bold text-blue-600">{cashTarget}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900">Insurance/TPA:</span>
                                            <span className="font-mono font-bold text-purple-600">{insuranceTarget}</span>
                                        </div>
                                    </div>
                                </td>

                                <td className="p-1 text-center text-slate-500 font-mono text-xs font-bold">
                                    {(() => {
                                        const h = Math.floor(15 / 60);
                                        const m = 15 % 60;
                                        return h > 0 ? `${String(h).padEnd(2, '0')}h${String(m).padEnd(2, '0')}m` : `${m}m`;
                                    })()}
                                </td>

                                {configuredDepartments.map((dept) => {
                                    const slaMins = workflow.departmentSlaConfig?.[dept] ?? 0;
                                    const h = Math.floor(slaMins / 60);
                                    const m = slaMins % 60;
                                    const formatted = h > 0 ? `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}m` : `${m}m`;
                                    return (
                                        <td key={dept} className="p-1 text-center text-slate-500 font-mono text-xs font-bold">
                                            {slaMins > 0 ? formatted : '-'}
                                        </td>
                                    );
                                })}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div >
        </div >
    );
};

export default DischargeTable;
