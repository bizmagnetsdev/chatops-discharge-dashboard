import { format, differenceInMinutes, parseISO, addMinutes } from 'date-fns';

export const formatTime = (dateString: string | null): string => {
    if (!dateString) return 'Pending';
    try {
        return format(parseISO(dateString), 'hh:mm a');
    } catch {
        return dateString; // in case it's already formatted or invalid
    }
};

export const calculateCompletionTime = (startDate: string, durationStr: string): string => {
    if (!startDate || !durationStr) return '-';
    // Extract minutes from "36 mins" or "1 hr 30 mins" (simplified for "X mins" based on JSON)
    const match = durationStr.match(/(\d+)/);
    const minutes = match ? parseInt(match[0], 10) : 0;

    try {
        const start = parseISO(startDate);
        const end = addMinutes(start, minutes);
        return format(end, 'hh:mm a');
    } catch {
        return '-';
    }
};

export const formatDuration = (durationStr: string | null | undefined): string => {
    if (!durationStr) return '-';
    // Extract minutes from "691 mins" or "1 hr 30 mins"
    const match = durationStr.match(/(\d+)/);
    if (!match) return durationStr; // Return original if no number found (e.g. "Pending")

    const totalMinutes = parseInt(match[0], 10);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(mins)}`;
};

export const formatDelayString = (delayStr: string | null | undefined): string => {
    if (!delayStr || delayStr === 'NA' || delayStr === 'Pending') return delayStr || '-';

    const match = delayStr.match(/(\d+)/);
    if (!match) return delayStr;

    const totalMinutes = parseInt(match[0], 10);
    if (totalMinutes < 60) {
        // Just replace plus with + if present
        return delayStr.replace('plus', '+').replace('+ ', '+');
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    // Preserve prefix (plus / + / -)
    // If input has "plus" or "+", we want output to have "+"
    const isPositiveDelay = delayStr.includes('plus') || delayStr.includes('+') || (!delayStr.includes('-') && !delayStr.includes('minus'));
    // Note: The logic above assumes if it's not negative, it's (implicitly) positive delay unless it's just a number like "80 mins" which contextually might be delay.
    // However, existing code explicitly checked 'plus' or '-'.
    // Let's stick to explicit markers if present.

    let prefix = '';
    if (delayStr.includes('plus') || delayStr.includes('+')) prefix = '+';
    else if (delayStr.includes('-')) prefix = '- ';

    // Construct new string
    // e.g. "1h:36m"
    if (hours > 0) {
        return `${prefix}${hours}h:${String(mins).padStart(2, '0')}m`;
    }

    // If only minutes
    return `${prefix}${mins}m`;
};

export const calculateBillDelay = (ackTime: string | null | undefined, successTime: string | null | undefined): string => {
    if (!ackTime) return 'NA';
    if (!successTime) return 'Pending';

    try {
        const start = parseISO(ackTime);
        const end = parseISO(successTime);
        const duration = differenceInMinutes(end, start);
        const sla = 15;
        const delay = duration - sla;

        if (delay > 0) return `+${delay} mins`;
        return `${delay} mins`;
    } catch {
        return 'NA';
    }
};

export const calculateDelay = (target: string, actual: string): number => {
    // Basic parser for "plus X mins", "+ X mins" or "-Y mins" strings from JSON
    if (actual?.includes('plus') || actual?.includes('+')) {
        const mins = actual.match(/\d+/);
        return mins ? parseInt(mins[0]) : 0;
    }
    if (actual?.includes('-')) {
        // Negative delay means early/on time
        const mins = actual.match(/-?\d+/);
        return mins ? parseInt(mins[0]) : 0;
    }
    return 0;
};

export const parseDelayMinutes = (delayString: string | null | undefined): number => {
    if (!delayString || delayString === 'Pending' || delayString === 'NA') return 0;

    // Handle "plus X mins" or "+ X mins"
    if (delayString.includes('plus') || delayString.includes('+')) {
        const match = delayString.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    // Handle "-X mins"
    if (delayString.includes('-')) {
        const match = delayString.match(/-?\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    // Handle "X mins" (positive number without plus, treated as delay)
    // Avoid parsing "0 mins" here if we want strict 0
    const match = delayString.match(/\d+/);
    if (match) {
        return parseInt(match[0], 10);
    }

    return 0;
};

export const isDelayed = (delayString: string): boolean => {
    if (!delayString) return false;
    return delayString.includes('plus') || delayString.includes('+') || (parseDelayMinutes(delayString) > 0 && !delayString.includes('-'));
};

export const getStatusColor = (status: string | null | undefined): string => {
    if (!status || status === 'Pending' || status === '-') return 'text-slate-400';
    if (status === 'NA') return 'text-slate-600';

    // Explicit "plus" or "+"
    if (status.includes('plus') || status.includes('+')) return 'status-red font-bold';

    // Explicit negative or 0
    if (status.includes('-') || status === '0 mins') return 'status-green font-bold';

    // Positive number without "plus" (e.g. "1 mins") -> Red
    // Check if it starts with a digit
    if (/^\d/.test(status)) return 'status-red font-bold';

    return 'text-slate-200';
};
