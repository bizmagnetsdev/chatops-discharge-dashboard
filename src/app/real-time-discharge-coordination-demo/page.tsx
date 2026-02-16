import DemoDashboard from '@/components/DemoDashboard';
import { DashboardResponse, Workflow, TimelineItem, SLAItem } from '@/types/dashboard';
import type { Metadata } from "next";

export const metadata: Metadata = {
    metadataBase: new URL("https://dashboard.chatops.health/real-time-discharge-coordination-demo"),
    title: {
        default: "Fix Bed Turnaround Delays with Real-Time Discharge Coordination",
        template: "%s | ChatOps.health",
    },
    description: "See how real-time discharge coordination improves bed turnaround, reduces post-bill payment delays, and returns beds to revenue faster in mid-size hospitals.",
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/favicon.ico",
    },
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        type: "website",
        siteName: "ChatOps.health",
        url: "https://dashboard.chatops.health/real-time-discharge-coordination-demo/",
        title: "Fix Bed Turnaround Delays with Real-Time Discharge Coordination",
        description: "See how real-time discharge coordination improves bed turnaround, reduces post-bill payment delays, and returns beds to revenue faster in mid-size hospitals.",
        // Add your OG image here for WhatsApp/social previews
        images: [],
    },
    twitter: {
        card: "summary_large_image",
        title: "Fix Bed Turnaround Delays with Real-Time Discharge Coordination",
        description: "See how real-time discharge coordination improves bed turnaround, reduces post-bill payment delays, and returns beds to revenue faster in mid-size hospitals.",
        // Add your Twitter image here
        images: [],
    },
};

// Reusing the fetch logic (could be refactored to shared lib)
async function getData(date: string): Promise<DashboardResponse> {
    const workflowName = encodeURIComponent('KNH Discharge');
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error('API_KEY is not defined in environment variables');
    }
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
        throw new Error('BASE_URL is not defined in environment variables');
    }
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(`${baseUrl}/dev/discharge-tat/get?workflowName=${workflowName}&date=${date}`, {
                headers: {
                    'x-api-key': apiKey,
                    'Accept': 'application/json',
                },
                cache: 'no-store',
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
            }

            const jsonData = await res.json();

            // Handle potential API structure mismatch
            if (!jsonData.workflows && jsonData.workflowName) {
                return {
                    date: date,
                    count: 1,
                    workflows: [jsonData],
                    status: 'success'
                } as DashboardResponse;
            }

            return jsonData;
        } catch (error) {
            if (attempt === MAX_RETRIES) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
    throw new Error('Unexpected error in retry loop');
}

const maskName = (name: string): string => {
    if (!name) return name;

    const parts = name.split(' ');

    return parts.map(part => {
        // 1. Handle titles
        const titleRegex = /^(Mrs\.|Mr\.|Miss\.|Dr\.|Ms\.|Er\.|Prof\.|Master\.)/i;
        const titleMatch = part.match(titleRegex);

        if (titleMatch) {
            const title = titleMatch[0];
            if (part.length === title.length) return title;
            const remaining = part.slice(title.length);
            return title + maskName(remaining);
        }

        if (part.length < 2) return part;

        if (part.length > 4) {
            return part.substring(0, 2) + 'xxxx' + part.substring(part.length - 2);
        } else {
            return part[0] + 'xxxx' + part[part.length - 1];
        }
    }).join(' ');
    // return name;
}

function anonymizeData(data: DashboardResponse): DashboardResponse {
    const newData = JSON.parse(JSON.stringify(data));

    const maskUHID = (uhid: string) => {
        if (!uhid || uhid.length < 2) return 'X';
        // First 1 + xxx + Last 1
        return uhid[0] + 'xxx' + uhid[uhid.length - 1];
    };

    const maskWardBed = (wardBed: string) => {
        if (!wardBed) return 'xxxx';
        // Split by either '/' or '-'
        const parts = wardBed.split(/\/|-/);

        if (parts.length > 1) {
            // Keep the first part (Floor/Ward), replace the rest with xxxx
            return `${parts[0].trim()} - xxxx`;
        }
        // If no separator found, assume it's just the Floor/Ward name
        return wardBed;
    };

    if (newData.workflows) {
        newData.workflows.forEach((workflow: Workflow) => {
            // Anonymize Timeline
            if (workflow.timeline) {
                workflow.timeline.forEach((item: TimelineItem) => {
                    item.patientName = maskName(item.patientName);
                    item.uhid = maskUHID(item.uhid);
                    item.wardBed = maskWardBed(item.wardBed);
                });
            }
            // Anonymize SLA
            if (workflow.sla) {
                workflow.sla.forEach((item: SLAItem) => {
                    item.patientName = maskName(item.patientName);
                    item.uhid = maskUHID(item.uhid);
                    item.wardBed = maskWardBed(item.wardBed);
                });
            }
        });
    }
    return newData;
}

interface PageProps {
    searchParams: Promise<{ date?: string }>;
}

export default async function DemoPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const date = params.date || new Date().toISOString().split('T')[0];

    let data;
    try {
        const rawData = await getData(date);
        data = anonymizeData(rawData);
    } catch (error) {
        data = {
            date,
            status: 'error',
            message: (error as Error).message || 'Failed to fetch data',
            workflows: []
        } as DashboardResponse;
    }

    return (
        <div className="relative">
            <div className="absolute top-0 left-0 w-full bg-yellow-500 text-black text-center text-xs font-bold py-1 z-50">
                DEMO MODE - LIVE DATA (ANONYMIZED)
            </div>
            <DemoDashboard data={data} />
        </div>
    );
}
