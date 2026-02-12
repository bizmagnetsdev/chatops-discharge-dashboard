'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { differenceInSeconds, parseISO } from 'date-fns';

interface LiveTimerProps {
    startTime: string; // ISO string
    slaDuration: number; // in Minutes
    isExtended?: boolean; // If true, adds 30 mins
    warningMin?: number; // Minutes before SLA to show warning (Yellow)
    showGif?: boolean; // If true, shows GIF instead of seconds
}

const LiveTimer: React.FC<LiveTimerProps> = ({ startTime, slaDuration, isExtended = false, warningMin = 15, showGif = false }) => {
    const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const [isOverdue, setIsOverdue] = useState<boolean>(false);

    useEffect(() => {
        const start = parseISO(startTime);
        // Total allowed duration = SLA + (Extension ? 30 : 0)
        const totalDurationMins = isExtended ? slaDuration + 30 : slaDuration;
        const totalDurationSeconds = totalDurationMins * 60;

        const updateTimer = () => {
            const now = new Date();
            const elapsed = differenceInSeconds(now, start);
            setElapsedSeconds(elapsed);

            const remaining = totalDurationSeconds - elapsed;

            if (remaining < 0) {
                // Overdue
                setSecondsRemaining(Math.abs(remaining));
                setIsOverdue(true);
            } else {
                // Normal
                setSecondsRemaining(remaining);
                setIsOverdue(false);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startTime, slaDuration, isExtended]);

    const formatDurationParts = (totalElapsed: number) => {
        let seconds = totalElapsed;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const pad = (n: number) => n.toString().padStart(2, '0');

        return {
            h: h > 0 ? `${h}h ` : '',
            m: `${h > 0 ? pad(m) : m}m `,
            s: `${pad(s)}s`
        };
    };

    // Color Logic
    let colorClass = 'text-emerald-600'; // Green

    const slaSeconds = slaDuration * 60;

    // If SLA is 0 (e.g. Cash Counter), show neutral color until 30 mins
    if (slaDuration <= 0) {
        if (elapsedSeconds >= 1800) { // 30 mins
            colorClass = 'text-red-600 font-extrabold';
        } else {
            colorClass = 'text-slate-700 font-bold';
        }
    } else {
        const warningThreshold = slaSeconds - (warningMin * 60); // SLA - warning window
        const extendedSeconds = isExtended ? slaSeconds + (30 * 60) : slaSeconds;

        if (elapsedSeconds < warningThreshold) {
            // Green
            colorClass = 'text-emerald-600 font-bold';
        } else if (elapsedSeconds < extendedSeconds) {
            // Yellow (Last 15 mins OR Extension period)
            colorClass = 'text-yellow-600 font-bold';
        } else {
            // Red (Overdue)
            colorClass = 'text-red-600 font-extrabold';
        }
    }

    const parts = formatDurationParts(elapsedSeconds);
    const isRed = colorClass.includes('red');

    return (
        <span className={`font-mono text-xs ${colorClass} flex items-center justify-center gap-1`}>
            <span>{parts.h}{parts.m}</span>
            {showGif ? (
                <img src="/running.gif" alt="Running" className="h-4 w-auto object-contain inline-block" />
            ) : (
                <span className={isRed ? "animate-pulse inline-block" : "inline-block"}>{parts.s}</span>
            )}
        </span>
    );
};

export default LiveTimer;
