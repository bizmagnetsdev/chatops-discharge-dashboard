'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format, subDays, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";

interface DateRangePickerProps {
    initialFromDate?: string;
    initialToDate?: string;
}

type PresetType = 'last7' | 'thisMonth' | 'lastMonth' | 'custom' | null;

const DateRangePicker: React.FC<DateRangePickerProps> = ({ initialFromDate, initialToDate }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [isPending, startTransition] = useTransition();

    const [isOpen, setIsOpen] = useState(false);
    const [preset, setPreset] = useState<PresetType>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const [fromDate, setFromDate] = useState(initialFromDate || '');
    const [toDate, setToDate] = useState(initialToDate || '');

    const [calendarRange, setCalendarRange] = useState<DateRange | undefined>({
        from: initialFromDate ? parseISO(initialFromDate) : undefined,
        to: initialToDate ? parseISO(initialToDate) : undefined
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setCalendarRange({
                from: fromDate ? parseISO(fromDate) : undefined,
                to: toDate ? parseISO(toDate) : undefined
            });
        }
    }, [isOpen, fromDate, toDate]);

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (fromDate) params.set('fromDate', fromDate);
        if (toDate) params.set('toDate', toDate);
        
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handleConfirmSelection = () => {
        if (calendarRange?.from) setFromDate(format(calendarRange.from, 'yyyy-MM-dd'));
        if (calendarRange?.to) setToDate(format(calendarRange.to, 'yyyy-MM-dd'));
        setPreset('custom');
        setIsOpen(false);
    };

    const applyPreset = (selectedPreset: PresetType) => {
        setPreset(selectedPreset);
        const today = new Date();
        let newFrom, newTo;

        if (selectedPreset === 'last7') {
            newFrom = subDays(today, 6);
            newTo = today;
        } else if (selectedPreset === 'thisMonth') {
            newFrom = startOfMonth(today);
            newTo = today;
        } else if (selectedPreset === 'lastMonth') {
            const lastMonthDate = subMonths(today, 1);
            newFrom = startOfMonth(lastMonthDate);
            newTo = endOfMonth(lastMonthDate);
        }

        if (newFrom && newTo) {
            setCalendarRange({ from: newFrom, to: newTo });
            setFromDate(format(newFrom, 'yyyy-MM-dd'));
            setToDate(format(newTo, 'yyyy-MM-dd'));
            setIsOpen(false);
        } else {
            setCalendarRange(undefined);
        }
    };

    const getDisplayText = () => {
        if (!fromDate || !toDate) return 'Select date range';
        try {
            return `${format(parseISO(fromDate), 'dd MMM yyyy')} ~ ${format(parseISO(toDate), 'dd MMM yyyy')}`;
        } catch {
            return `${fromDate} to ${toDate}`;
        }
    };

    return (
        <>
            {isPending && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <svg className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div className="flex flex-col items-center">
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                Loading...
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Please wait while we loading the records.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <div className="relative z-50 flex flex-col md:flex-row items-center gap-3 bg-white/40 p-1.5 pl-4 rounded-xl border border-slate-200 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Select Range:
                </div>
                
                <div className="relative w-[300px]" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex justify-between items-center w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium transition-all"
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{getDisplayText()}</span>
                        </div>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    {isOpen && (
                        <div className="absolute top-full right-0 mt-2 w-max max-w-[95vw] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col md:flex-row p-1 animate-in fade-in duration-200 z-[100]">
                            {/* Sidebar Presets */}
                            <div className="flex flex-col gap-1 pr-0 md:pr-4 m-3 md:mb-3 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-slate-100 min-w-[140px]">
                                <button type="button" onClick={() => applyPreset('last7')} className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${preset === 'last7' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-700'}`}>Last 7 Days</button>
                                <button type="button" onClick={() => applyPreset('thisMonth')} className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${preset === 'thisMonth' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-700'}`}>This Month</button>
                                <button type="button" onClick={() => applyPreset('lastMonth')} className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${preset === 'lastMonth' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-700'}`}>Last Month</button>
                                <div className="mt-auto pt-4">
                                    <button type="button" onClick={() => setPreset('custom')} className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${preset === 'custom' || preset === null ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-700'}`}>Custom Range</button>
                                </div>
                            </div>
                            
                            {/* Calendars */}
                            <div className="pl-0 md:pl-2 m-3 flex flex-col">
                                {/* Inner wrapper to apply custom styling if needed, but styling is mostly native to style.css */}
                                <div className="react-day-picker-emerald-theme">
                                    <DayPicker
                                        mode="range"
                                        selected={calendarRange}
                                        onSelect={setCalendarRange}
                                        numberOfMonths={2}
                                        pagedNavigation
                                        max={60}
                                        className="p-0 m-0"
                                    />
                                </div>
                                
                                {/* Apply Actions */}
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                                    <button type="button" onClick={handleConfirmSelection} disabled={!calendarRange?.from || !calendarRange?.to} className="px-6 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">Apply Selection</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <button
                    type="button"
                    onClick={handleApply}
                    disabled={!fromDate || !toDate || isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-sm hover:shadow-md text-sm active:scale-95 whitespace-nowrap"
                >
                    View Report
                </button>
                <style jsx global>{`
                    .react-day-picker-emerald-theme table {
                        border-collapse: collapse;
                        border-spacing: 0;
                        width: max-content;
                    }
                    .react-day-picker-emerald-theme th {
                        padding: 0.5rem;
                        text-align: center;
                        color: inherit;
                        font-weight: 500;
                        font-size: 0.875rem;
                        text-transform: none;
                        letter-spacing: normal;
                    }
                    .react-day-picker-emerald-theme td {
                        padding: 0;
                        background: transparent;
                        backdrop-filter: none;
                    }
                    .react-day-picker-emerald-theme td:first-child,
                    .react-day-picker-emerald-theme td:last-child {
                        border-radius: 0;
                    }
                    .react-day-picker-emerald-theme {
                        --rdp-accent-color: #059669; /* emerald-600 */
                        --rdp-background-color: #d1fae5; /* emerald-100 */
                        --rdp-accent-color-dark: #047857; /* emerald-700 */
                        --rdp-background-color-dark: #a7f3d0; /* emerald-200 */
                        --rdp-outline: 2px solid var(--rdp-accent-color);
                        --rdp-outline-selected: 2px solid var(--rdp-accent-color);
                        margin: 0;
                    }
                    /* override global day picker selection styles if necessary */
                    .react-day-picker-emerald-theme .rdp-day_selected,
                    .react-day-picker-emerald-theme .rdp-day_selected:focus-visible,
                    .react-day-picker-emerald-theme .rdp-day_selected:hover {
                        background-color: var(--rdp-accent-color) !important;
                        color: white !important;
                    }
                    .react-day-picker-emerald-theme .rdp-day_range_middle {
                        background-color: var(--rdp-background-color) !important;
                        color: #064e3b !important;
                    }
                `}</style>
            </div>
        </>
    );
};

export default DateRangePicker;


