import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobileNumber } = body;

        const configId = process.env.OTP_CONFIG_ID;
        const baseUrl = process.env.BASE_URL;
        if (!configId) {
            return NextResponse.json({ error: 'Configuration ID missing' }, { status: 500 });
        }
        if (!baseUrl) {
            return NextResponse.json({ error: 'BASE_URL missing' }, { status: 500 });
        }

        const externalUrl = `${baseUrl}/dev/${configId}/sendOtp`;

        console.log(`Proxying Send OTP to: ${externalUrl}`);

        const apiKey = process.env.API_KEY || '';

        const res = await fetch(externalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                mobileNumber,
                countryCode: '+91'
            }),
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
