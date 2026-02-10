import React from 'react';
import { Workflow } from '@/types/dashboard';

interface SummaryCardsProps {
    workflow: Workflow;
    onFilterChange?: (status: 'all' | 'delayed' | 'ontime' | 'inprogress') => void;
    currentFilter?: 'all' | 'delayed' | 'ontime' | 'inprogress';
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ workflow, onFilterChange, currentFilter }) => {
    const { timeline, sla, configuredDepartments = [] } = workflow;
    const total = timeline.length;

    // 1. Calculate Main Metrics
    const initiated = total;
    const delayed = sla.filter(s => s.overallDelay?.toLowerCase().includes('plus')).length;

    // On Time: Overall delay is negative or 0
    const onTime = sla.filter(s =>
        s.overallDelay?.includes('-') ||
        s.overallDelay === '0 mins' ||
        s.overallDelay?.toLowerCase().includes('completed')
    ).length;

    // Pending: Neither delayed nor explicitly on time (often 'Pending' string)
    const pending = sla.filter(s => s.overallDelay === 'Pending').length;

    const metrics = [
        { label: 'Discharge Initiated', value: initiated, color: 'text-blue-400', filter: 'all' as const },
        { label: 'On Time Completion', value: onTime, color: 'text-emerald-400', filter: 'ontime' as const },
        { label: 'Delayed', value: delayed, color: 'text-red-400', filter: 'delayed' as const },
        { label: 'Inprogress', value: pending, color: 'text-yellow-600', filter: 'inprogress' as const },
    ];

    // 2. Prep data for Department Stats
    // Merge timeline and SLA by ticketId
    const mergedData = timeline.map(item => {
        const slaItem = sla.find(s => s.ticketId === item.ticketId);
        return { ...item, sla: slaItem };
    });

    // ... getDeptStats logic ...

    const handleCardClick = (filter: 'all' | 'delayed' | 'ontime' | 'inprogress') => {
        if (onFilterChange) onFilterChange(filter);
    };

    return (
        <div className="flex flex-col gap-6 mb-8">
            {/* Main Global Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {metrics.map((metric, idx) => {
                    const isActive = currentFilter === metric.filter;
                    // Only "Delayed" and "On Time" are strictly filtered views in this request, but let's allow "Initiated" to reset.
                    const isClickable = true;

                    return (
                        <div
                            key={idx}
                            onClick={() => handleCardClick(metric.filter)}
                            className={`glass-panel p-6 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group bg-white/60 border border-slate-200 shadow-sm transition-all cursor-pointer ${isActive ? 'ring-2 ring-emerald-500 bg-white' : 'hover:scale-[1.02]'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-3xl font-bold mb-2 font-mono tracking-tighter text-slate-900">
                                {metric.value}
                            </h3>
                            <p className="text-sm font-medium uppercase tracking-widest text-slate-500">
                                {metric.label}
                            </p>
                            <div className={`absolute bottom-0 left-0 w-full h-1 ${metric.color.replace('text-', 'bg-')} opacity-50`} />
                        </div>
                    );
                })}
            </div>


            {/* Department Breakdown */}
            {/* <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">

                {(() => {
                    const stats = getDeptStats('Bill Received');
                    return (
                        <div className="bg-white/60 border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-xs font-bold text-slate-700 mb-2 truncate" title="Bill Received">Bill Received</div>
                            <div className="flex flex-col space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">✅</span>
                                    <span className="text-emerald-600 font-bold font-mono">{stats.completed}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">🕒</span>
                                    <span className="text-yellow-600 font-bold font-mono">{stats.pending}</span>
                                </div>
                            </div>
                        </div>
                    );
                })()}


                {configuredDepartments.map((dept) => {
                    const stats = getDeptStats(dept);
                    return (
                        <div key={dept} className="bg-white/60 border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-xs font-bold text-slate-700 mb-2 truncate" title={dept}>{dept}</div>
                            <div className="flex flex-col space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">✅</span>
                                    <span className="text-emerald-600 font-bold font-mono">{stats.completed}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">🕒</span>
                                    <span className="text-yellow-600 font-bold font-mono">{stats.pending}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div> */}
        </div>
    );
};

export default SummaryCards;
