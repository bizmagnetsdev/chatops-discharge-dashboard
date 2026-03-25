import { DashboardResponse } from '@/types/dashboard';

const MAX_RETRIES = 3;

async function fetchWithRetry(url: string, apiKey: string): Promise<any> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(url, {
                headers: {
                    'x-api-key': apiKey,
                    'Accept': 'application/json',
                },
                cache: 'no-store',
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
            }

            return await res.json();
        } catch (error) {
            console.error(`API Fetch Error (Attempt ${attempt}/${MAX_RETRIES}):`, (error as Error).message);
            if (attempt === MAX_RETRIES) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

export async function getDashboardData(workflowName: string, date: string): Promise<DashboardResponse> {
    const apiKey = process.env.NEW_API_KEY || process.env.API_KEY;
    const baseUrl = process.env.NEW_BASE_URL || process.env.BASE_URL;

    if (!apiKey || !baseUrl) {
        throw new Error('API_KEY or BASE_URL is not defined');
    }

    const encodedWorkflow = encodeURIComponent(workflowName);
    const url = `${baseUrl}/dev/discharge-tat/get?workflowName=${encodedWorkflow}&date=${date}`;
    
    const jsonData = await fetchWithRetry(url, apiKey);

    // Handle potential API structure mismatch
    if (!jsonData.workflows && jsonData.workflowName) {
        return {
            date,
            count: 1,
            workflows: [jsonData],
            status: 'success'
        } as DashboardResponse;
    }

    return jsonData;
}

export async function getDashboardRangeData(workflowName: string, fromDate: string, toDate: string): Promise<DashboardResponse> {
    // const apiKey = process.env.NEW_API_KEY || process.env.API_KEY;
    // const baseUrl = process.env.NEW_BASE_URL || process.env.BASE_URL;
    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.BASE_URL;

    if (!apiKey || !baseUrl) {
        throw new Error('API_KEY or BASE_URL is not defined');
    }

    const encodedWorkflow = encodeURIComponent(workflowName);
    const url = `${baseUrl}/dev/discharge-tat/get-range?workflowName=${encodedWorkflow}&fromDate=${fromDate}&toDate=${toDate}`;
    
    const jsonData = await fetchWithRetry(url, apiKey);

    // Assuming get-range returns the same structure or a list of workflows
    // If it returns multiple workflows, we might need to adjust how we handle it.
    // Based on the curl, it likely returns a DashboardResponse structure.
    
    return jsonData;
}
