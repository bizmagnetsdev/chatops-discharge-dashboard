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



    const workflow = data.workflows?.[0];
    const [filterStatus, setFilterStatus] = React.useState<'all' | 'delayed' | 'ontime' | 'inprogress'>('all');
    const [fallbackDate, setFallbackDate] = React.useState<string | null>(null);

    useEffect(() => {
        setFallbackDate(new Date().toISOString());
    }, []);

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
                        Performance Report • {(workflow?.reportDate || data.date || fallbackDate) ? format(parseISO(workflow?.reportDate || data.date || fallbackDate!), 'dd-MM-yyyy') : <span className="opacity-0">00-00-0000</span>}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-4">
                    {/* Date Picker Removed for Demo */}

                    <a
                        href="https://www.chatops.health/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center"
                    >
                        <img
                            src="/Logo_H_512.png"
                            alt="ChatOps Home"
                            className="h-8 w-auto object-contain"
                        />
                    </a>


                    <div className="glass-panel px-4 py-2 rounded-lg flex items-center bg-white/50 border border-slate-200">
                        <span className="text-xs text-slate-500 mr-2">LIVE MONITORING</span>
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    </div>

                    {/* No Logout Button for Demo */}
                </div>
            </header >

            <main className="space-y-4">
                {(data.status === 'no_data' || !workflow) ? (
                    <div className="w-full h-64 flex items-center justify-center overflow-hidden bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                        <style jsx>{`
                            @keyframes scroll-text {
                                0% { transform: translateX(100%); }
                                100% { transform: translateX(-100%); }
                            }
                            .scrolling-text {
                                animation: scroll-text 15s linear infinite;
                                white-space: nowrap;
                            }
                        `}</style>
                        <div className="w-full overflow-hidden">
                            <div className="scrolling-text text-2xl font-bold text-slate-400 uppercase tracking-widest">
                                No discharges happening currently. Please check here after 10:00 AM.
                            </div>
                        </div>
                    </div>
                ) : (
                    <DischargeTable
                        workflow={workflow}
                        filterStatus={filterStatus}
                        isDemo={true} // Always true for DemoDashboard
                    />
                )}
            </main>
        </div >
    );
};

export default DemoDashboard;
