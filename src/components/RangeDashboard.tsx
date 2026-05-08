'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { DashboardResponse } from '@/types/dashboard';
import DischargeTable from './DischargeTable';
import OfflineBanner from './OfflineBanner';
import DateRangePicker from './DateRangePicker';
import { getDownloadCsvUrl } from '@/app/actions';
import toast from 'react-hot-toast';

interface RangeDashboardProps {
    data: DashboardResponse;
    flowName?: string;
    fromDate?: string;
    toDate?: string;
}

const RangeDashboard: React.FC<RangeDashboardProps> = ({ data, flowName, fromDate, toDate }) => {
    const router = useRouter();
    const [isDownloading, setIsDownloading] = React.useState(false);

    const handleLogout = () => {
        document.cookie = 'flowName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.refresh();
        router.push('/login');
    };

    const hasData = data.status === 'success' && data.workflows && data.workflows.length > 0;

    const handleDownloadCSV = async () => {
        if (!fromDate || !toDate || !flowName) return;
        
        try {
            setIsDownloading(true);
            const url = await getDownloadCsvUrl(flowName, fromDate, toDate);
            if (url) {
                // Download the file
                window.open(url, '_blank');
                toast.success('CSV download started');
            } else {
                toast.error('No CSV available for this date range.');
            }
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download CSV.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 max-w-[1920px] mx-auto">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-1">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">
                            {flowName || 'Kongunad Hospital'}
                        </span> Report
                    </h1>
                    <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">
                        Discharge Performance • {fromDate && toDate ? `${format(parseISO(fromDate), 'dd MMM')} - ${format(parseISO(toDate), 'dd MMM yyyy')}` : 'Select Date Range'}
                    </p>
                </div>
                
                <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-end flex-wrap gap-4 w-full md:w-auto">
                    <DateRangePicker initialFromDate={fromDate} initialToDate={toDate} />
                    
                    <button
                        onClick={() => router.push('/')}
                        className="bg-white/50 hover:bg-slate-100 text-slate-800 font-bold px-5 py-2.5 rounded-lg text-sm transition-all shadow-sm active:scale-95 whitespace-nowrap border border-slate-200"
                    >
                        Live Monitoring
                    </button>

                    <button
                        onClick={handleLogout}
                        className="bg-white/50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="space-y-6">
                {!fromDate || !toDate ? (
                    <div className="flex flex-col items-center justify-center py-20 glass-panel rounded-2xl border-dashed border-2 border-slate-300 bg-white/30">
                        <div className="p-4 bg-emerald-100 rounded-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Select Date Range</h2>
                        <p className="text-slate-500 max-w-sm text-center">
                            Pick a start and end date above to view the discharge turnaround time report for that period.
                        </p>
                    </div>
                ) : !hasData ? (
                    <div className="flex flex-col items-center justify-center py-20 glass-panel rounded-2xl border border-slate-200 bg-white/50 shadow-xl">
                        <h2 className="text-3xl font-black text-slate-900 mb-4">No Records Found</h2>
                        <p className="text-slate-500 text-lg mb-6">
                            There are no discharge records for the selected range.
                        </p>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-700">
                        {data.workflows && data.workflows.map((workflow, idx) => (
                            <div key={idx} className="mb-8 last:mb-0">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-1 bg-emerald-500 rounded-full"></div>
                                        <h3 className="text-lg font-bold text-slate-800">
                                            Data for {(() => {
                                                try {
                                                    return format(parseISO(workflow.reportDate), 'dd-MM-yyyy');
                                                } catch (e) {
                                                    return workflow.reportDate; // Fallback to raw string if not a valid ISO date
                                                }
                                            })()}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={handleDownloadCSV}
                                        disabled={isDownloading}
                                        className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-sm active:scale-95 whitespace-nowrap ${isDownloading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isDownloading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download CSV
                                            </>
                                        )}
                                    </button>
                                </div>
                                <DischargeTable
                                    workflow={workflow}
                                    filterStatus="all"
                                    hideTimer={true}
                                    showInitiatedDate={true}
                                    showCancel={false}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <OfflineBanner />
        </div>
    );
};

export default RangeDashboard;
