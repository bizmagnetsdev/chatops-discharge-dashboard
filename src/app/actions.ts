'use server';

export async function getDownloadCsvUrl(workflowName: string, fromDate: string, toDate: string) {
    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.BASE_URL;

    if (!apiKey || !baseUrl) {
        throw new Error('API_KEY or BASE_URL is not defined');
    }

    const encodedWorkflow = encodeURIComponent(workflowName);
    const url = `${baseUrl}/dev/discharge-tat/upload/range?workflow=${encodedWorkflow}&fromDate=${fromDate}&toDate=${toDate}`;

    try {
        const res = await fetch(url, {
            headers: {
                'x-api-key': apiKey,
                'Accept': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch CSV data: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        
        if (data.status === 'success' && data.reports && data.reports.length > 0) {
            return data.reports[0].url;
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching CSV URL:', error);
        throw new Error('Failed to get download URL');
    }
}

export async function cancelTicket(ticketId: string | number) {
    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.BASE_URL;

    if (!apiKey || !baseUrl) {
        throw new Error('API_KEY or BASE_URL is not defined');
    }

    const url = `${baseUrl}/dev/chatops-discharge/ticket/invlaid`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ticketId.toString()),
        });

        if (!res.ok) {
            return { success: false, error: `Failed to cancel ticket: ${res.status}` };
        }

        return { success: true };
    } catch (error) {
        console.error('Error cancelling ticket:', error);
        return { success: false, error: (error as Error).message };
    }
}
