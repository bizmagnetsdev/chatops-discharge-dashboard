'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { DashboardResponse } from '@/types/dashboard';
import SummaryCards from './SummaryCards';
import DischargeTable from './DischargeTable';
import OfflineBanner from './OfflineBanner';

interface DashboardProps {
    data: DashboardResponse;
    flowName?: string;
}

const Dashboard: React.FC<DashboardProps & { isDemo?: boolean }> = ({ data, isDemo = false, flowName }) => {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        // Clear cookies
        document.cookie = 'flowName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        // Redirect to login
        router.refresh(); // Refresh to ensure server state is cleared
        router.push('/login');
    };

    // Check for "error" status (e.g. fetch failed / offline)
    if (data.status === 'error') {
        return (
            <div className="min-h-screen p-8 max-w-[1920px] mx-auto flex items-center justify-center">
                <div className="glass-panel p-10 rounded-2xl text-center max-w-lg w-full border border-red-200 shadow-xl bg-white/80">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-red-100 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Connection Error</h2>
                    <p className="text-slate-500 mb-6">
                        Unable to connect to the server. Please check your internet connection and try again.
                    </p>
                    <button
                        onClick={() => router.refresh()}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                    >
                        Try Again
                    </button>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        {/* <p className="text-xs text-slate-400">
                            Error Details: {data.message}
                        </p> */}
                    </div>
                </div>
            </div>
        );
    }

    // Check for "no_data" status or missing workflows
    if (data.status === 'no_data' || !data.workflows || data.workflows.length === 0) {
        return (
            <div className="min-h-screen p-8 max-w-[1920px] mx-auto flex items-center justify-center">
                <div className="glass-panel p-10 rounded-2xl text-center max-w-lg w-full border border-slate-200 shadow-xl bg-white/80">
                    <h2 className="text-3xl font-black text-slate-900 mb-4">No Records Found</h2>
                    <p className="text-slate-500 text-lg mb-6">
                        {/* {data.message || "No discharge records found for the given date/workflow."} */}
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
                        <button
                            onClick={handleLogout}
                            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg transition-colors text-sm"
                        >
                            Logout
                        </button>
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
            if (navigator.onLine) {
                router.refresh();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [router]);

    return (
        <div className="min-h-screen p-4 max-w-[1920px] mx-auto"> {/* Reduced base padding */}
            <header className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-1"> {/* Slightly smaller font */}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">
                            {isDemo ? 'Kxxxxxx Hxxxxxl' : (flowName || 'Kongunad Hospital')}
                        </span> Discharge Process
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

                    <button
                        onClick={handleLogout}
                        className="bg-white/50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header >

            <main className="space-y-4"> {/* Add control over vertical spacing */}
                {/* Summary cards commented out per user request */}
                {/* <SummaryCards
                    workflow={workflow}
                    onFilterChange={setFilterStatus}
                    currentFilter={filterStatus}
                /> */}
                <DischargeTable
                    workflow={workflow}
                    filterStatus={filterStatus}
                    isDemo={isDemo}
                />
            </main>
            <OfflineBanner />
        </div >
    );
};

export default Dashboard;
