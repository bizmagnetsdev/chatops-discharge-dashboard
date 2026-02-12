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

    const reportDate = workflow.reportDate ? parseISO(workflow.reportDate) : new Date();
    const today = startOfDay(new Date());
    const isPastDate = isBefore(startOfDay(reportDate), today);

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

    const mergedData = [...ongoing, ...sortedCompleted];

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
    const cashTarget = React.useMemo(() => {
        const item = timeline.find(t => t.paymentType?.toLowerCase().includes('cash') && t.targetTotalTat);
        return item ? formatDuration(`${parseInt(item.targetTotalTat) || 0} mins`) : 'N/A';
    }, [timeline]);

    const insuranceTarget = React.useMemo(() => {
        const item = timeline.find(t => (t.paymentType?.toLowerCase().includes('insurance') || t.paymentType?.toLowerCase().includes('tpa')) && t.targetTotalTat);
        return item ? formatDuration(`${parseInt(item.targetTotalTat) || 0} mins`) : 'N/A';
    }, [timeline]);

    return (
        <div className="glass-panel rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white/60 flex flex-col h-full max-h-[80vh]">
            {/* Target TAT Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-end gap-6 text-sm font-medium text-slate-600">
                <span className="uppercase tracking-wider text-xs font-bold text-slate-500">Target TAT:</span>
                <div className="flex items-center gap-2">
                    <span className="text-slate-900">Cash:</span>
                    <span className="font-mono font-bold text-blue-600">{cashTarget}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-900">Insurance/TPA:</span>
                    <span className="font-mono font-bold text-purple-600">{insuranceTarget}</span>
                </div>
            </div>

            <div ref={tableContainerRef} className="overflow-auto flex-1 relative">
                <table className="w-full text-sm border-separate border-spacing-0">
                    <thead className="bg-slate-100 text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
                        <tr className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 text-center text-[10px] uppercase tracking-wider">

                            <th className="p-2 bg-slate-100 border-b border-slate-200 whitespace-nowrap min-w-[200px] text-center">
                                <div className="flex flex-col items-center">
                                    <span>PATIENT NAME</span>
                                    <span className="ml-1 text-slate-700 font-normal">(UHID) ({mergedData.length})</span>
                                </div>
                            </th>
                            <th className="p-2 bg-slate-100 border-b border-slate-200 whitespace-nowrap min-w-[100px] text-center">
                                <div className="flex items-center justify-center h-full">
                                    Ward & Bed
                                </div>
                            </th>
                            <th className="p-2 bg-slate-100 border-b border-slate-200 whitespace-nowrap min-w-[140px] text-center">
                                <div className="flex items-center justify-center h-full">
                                    Overall Time
                                    {/* {ongoing.length > 0 && <span className="text-yellow-600 ml-1">({ongoing.length})</span>} */}
                                </div>
                            </th>

                            {!isDemo && (
                                <th className="p-2 bg-slate-100 border-b border-slate-200 min-w-[120px] text-center">
                                    <div className="flex justify-center items-center">
                                        Bill Received
                                        {(() => {
                                            const stats = getDeptStats('Bill Received');
                                            if (stats.pending > 0) return <span className="text-yellow-600 ml-1">({stats.pending})</span>;
                                            return null;
                                        })()}
                                    </div>
                                </th>
                            )}

                            {configuredDepartments.map((dept) => {
                                const stats = getDeptStats(dept);
                                const isNurse = dept.toLowerCase() === 'nurse';
                                const isInsurance = dept.toUpperCase() === 'INSURANCE';
                                const headerText = isNurse ? 'ROOM STATUS(NURSE)' : (isInsurance ? 'INSURANCE/TPA' : dept);
                                return (
                                    <th key={dept} className={clsx("p-2 bg-slate-100 border-b border-slate-200 min-w-[110px] text-center", !isNurse && "truncate")}>
                                        <div className="flex items-center justify-center gap-1">
                                            {isNurse ? (
                                                <div className="relative group cursor-default">
                                                    {headerText}
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg hidden group-hover:block z-50 whitespace-nowrap font-normal normal-case tracking-normal">
                                                        Room Vacated Status
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                headerText
                                            )}
                                            {stats.pending > 0 && <span className="text-yellow-600">({stats.pending})</span>}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
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
                                            <div className="flex flex-col space-y-1 items-center">
                                                <span className="text-xs text-blue-600 font-bold whitespace-nowrap block mb-1">
                                                    {formatTime(row.dischargeStart)}
                                                </span>
                                                {isPastDate ? (
                                                    null
                                                ) : (
                                                    <>
                                                        <img src="/running.gif" alt="Running" className="w-6 h-6 my-1 object-contain" />
                                                        <LiveTimer
                                                            startTime={row.dischargeStart}
                                                            slaDuration={parseInt(row.targetTotalTat) || 0}
                                                        />
                                                    </>
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
                                    {/* Bill Received Column */}
                                    {!isDemo && (
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
                                                                    <img src="/running.gif" alt="Running" className="w-6 h-6 my-1 object-contain" />
                                                                    <LiveTimer
                                                                        startTime={row.firstDeptAck!}
                                                                        slaDuration={15}
                                                                        warningMin={5} // 15m SLA: 0-10 Green, 10-15 Yellow
                                                                        isExtended={false}
                                                                    />
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
                                    )}

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
                                                                    <>
                                                                        <img src="/running.gif" alt="Running" className="w-6 h-6 my-1 object-contain" />
                                                                        <LiveTimer
                                                                            startTime={startTime}
                                                                            slaDuration={slaMins}
                                                                            isExtended={!!moreTimeClick}
                                                                        />
                                                                    </>
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
                            {!isDemo && (
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
                            )}
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
                            {!isDemo && (
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
                            )}
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

                            {!isDemo && (
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
                            )}


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
                    </tbody>
                </table>
            </div >
        </div >
    );
};

export default DischargeTable;
