import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobileNumber, userName, flowName, accessLevel } = body;

        const apiKey = process.env.API_KEY;
        const baseUrl = process.env.BASE_URL;

        if (!apiKey) return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
        if (!baseUrl) return NextResponse.json({ error: 'BASE_URL missing' }, { status: 500 });

        if (!mobileNumber || !userName || !flowName) {
            return NextResponse.json(
                { error: 'Missing required fields: mobileNumber, userName, flowName' },
                { status: 400 }
            );
        }

        const externalUrl = `${baseUrl}/dev/chatops/user/create`;
        console.log(`[Admin] Creating/updating user: ${externalUrl}`);

        const res = await fetch(externalUrl, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mobileNumber, userName, flowName, accessLevel: accessLevel || null }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Backend Error:', errorText);
            return NextResponse.json({ error: `Backend error: ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
