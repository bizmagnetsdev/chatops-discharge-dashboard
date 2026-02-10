import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mobileNumber = searchParams.get('mobileNumber');

        const apiKey = process.env.API_KEY;
        const baseUrl = process.env.BASE_URL;

        if (!mobileNumber) {
            return NextResponse.json({ error: 'Mobile number missing' }, { status: 400 });
        }

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key missing on server' }, { status: 500 });
        }
        if (!baseUrl) {
            return NextResponse.json({ error: 'BASE_URL missing' }, { status: 500 });
        }

        const externalUrl = `${baseUrl}/dev/chatops/user/get?mobileNumber=${mobileNumber}`;

        console.log(`Proxying User Details to: ${externalUrl}`);

        const res = await fetch(externalUrl, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
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
