import RangeDashboard from '@/components/RangeDashboard';
import { getDashboardRangeData } from '@/services/dashboardService';
import { DashboardResponse } from '@/types/dashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';

interface PageProps {
    searchParams: Promise<{ fromDate?: string; toDate?: string }>;
}

export const dynamic = 'force-dynamic';

async function DashboardData({ flowName, fromDate, toDate }: { flowName: string; fromDate?: string; toDate?: string }) {
    let data: DashboardResponse = {
        date: '',
        status: 'idle',
        workflows: []
    };

    if (fromDate && toDate) {
        try {
            data = await getDashboardRangeData(flowName, fromDate, toDate);
            console.log(data);
        } catch (error) {
            data = {
                date: `${fromDate} to ${toDate}`,
                status: 'error',
                message: (error as Error).message || 'Failed to fetch range data',
                workflows: []
            };
        }
    }

    return (
        <RangeDashboard 
            data={data} 
            flowName={flowName} 
            fromDate={fromDate} 
            toDate={toDate} 
        />
    );
}

export default async function RangeDashboardPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const { fromDate, toDate } = params;

    const cookieStore = await cookies();
    const flowName = cookieStore.get('flowName')?.value;

    if (!flowName) {
        redirect('/login');
    }

    const decodedFlowName = decodeURIComponent(flowName);

    // Use a unique key for the Suspense boundary based on the search parameters.
    // This forces React to unmount the old Suspense boundary and show the fallback
    // while the new DashboardData fetches data for the new date range.
    const suspenseKey = `${fromDate || 'none'}-${toDate || 'none'}`;

    return (
        <Suspense fallback={<Loading />} key={suspenseKey}>
            <DashboardData flowName={decodedFlowName} fromDate={fromDate} toDate={toDate} />
        </Suspense>
    );
}
