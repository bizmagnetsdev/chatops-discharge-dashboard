import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { otpUid, otp, mobileNumber } = body;

        const baseUrl = process.env.BASE_URL;

        if (!otpUid) {
            return NextResponse.json({ error: 'OTP UID missing' }, { status: 400 });
        }
        if (!baseUrl) {
            return NextResponse.json({ error: 'BASE_URL missing' }, { status: 500 });
        }

        const externalUrl = `${baseUrl}/dev/${otpUid}/verifyOtp`;

        console.log(`Proxying Verify OTP to: ${externalUrl}`);

        const apiKey = process.env.API_KEY || '';

        const res = await fetch(externalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                mobileNumber,
                countryCode: '+91',
                otp,
                otpUid
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
