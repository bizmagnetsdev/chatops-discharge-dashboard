'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { DashboardResponse } from '@/types/dashboard';
import DischargeTable from './DischargeTable';

interface DemoDashboardProps {
    data: DashboardResponse;
}

const DemoDashboard: React.FC<DemoDashboardProps> = ({ data }) => {
    const router = useRouter();
    const pathname = usePathname();

    // Check for "no_data" status or missing workflows
    if (data.status === 'no_data' || !data.workflows || data.workflows.length === 0) {
        return (
            <div className="min-h-screen p-8 max-w-[1920px] mx-auto flex items-center justify-center">
                <div className="glass-panel p-10 rounded-2xl text-center max-w-lg w-full border border-slate-200 shadow-xl bg-white/80">
                    <h2 className="text-3xl font-black text-slate-900 mb-4">No Records Found</h2>
                    <p className="text-slate-500 text-lg mb-6">
                        Please select another date
                    </p>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 inline-block w-full">
                        <label className="block text-xs text-slate-500 mb-1 text-left font-bold uppercase tracking-wider">Select Date</label>
                        <input
                            type="date"
                            value={data.date || ''}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                if (newDate) {
                                    router.push(`${pathname}?date=${newDate}`);
                                }
                            }}
                            className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 w-full shadow-sm mb-4"
                        />
                        {/* No Logout button for Demo */}
                    </div>
                </div>
            </div>
        );
    }

    const workflow = data.workflows[0];
    const [filterStatus, setFilterStatus] = React.useState<'all' | 'delayed' | 'ontime' | 'inprogress'>('all');

    useEffect(() => {
        // Auto-refresh every 60 seconds (1 minute)
        const interval = setInterval(() => {
            router.refresh();
        }, 60000);

        return () => clearInterval(interval);
    }, [router]);

    return (
        <div className="min-h-screen p-4 max-w-[1920px] mx-auto">
            <header className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-1">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">
                            Real-Time Hospital Discharge Coordination  {/* Hardcoded Demo Title */}
                        </span>— Reference View
                    </h1>
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
                        Performance Report • {format(parseISO(workflow.reportDate || data.date || new Date().toISOString()), 'dd-MM-yyyy')}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-4">
                    {/* Date Picker */}
                    <input
                        type="date"
                        value={data.date || ''}
                        onChange={(e) => {
                            const newDate = e.target.value;
                            if (newDate) {
                                router.push(`${pathname}?date=${newDate}`);
                            }
                        }}
                        className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 shadow-sm"
                    />

                    <div className="glass-panel px-4 py-2 rounded-lg flex items-center bg-white/50 border border-slate-200">
                        <span className="text-xs text-slate-500 mr-2">LIVE MONITORING</span>
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    </div>

                    {/* No Logout Button for Demo */}
                </div>
            </header >

            <main className="space-y-4">
                <DischargeTable
                    workflow={workflow}
                    filterStatus={filterStatus}
                    isDemo={true} // Always true for DemoDashboard
                />
            </main>
        </div >
    );
};

export default DemoDashboard;
