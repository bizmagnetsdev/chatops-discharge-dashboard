import { NextResponse } from 'next/server';



async function sendWelcomeWhatsApp(mobileNumber: string, userName: string) {
    try {
        const apiKey = process.env.API_KEY;
        const whatsappApiUrl = process.env.WHATSAPP_API_URL|| 'https://api.bizmagnets.ai/dev/message/sendTemplateMessage';
        const whatsappChannelId = process.env.WHATSAPP_CHANNEL_ID;
        const whatsappTemplateId = process.env.WHATSAPP_TEMPLATE_ID;
        const payload = {
            channelId: whatsappChannelId,
            recipient: {
                name: userName,
                mobileNumber: `91${mobileNumber}`,
            },
            type: 'template',
            template: {
                templateId: whatsappTemplateId,
                templateVariables: [],
            },
        };
        const res = await fetch(whatsappApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey || '',
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const errText = await res.text();
            console.error(`[WhatsApp] Failed to send welcome message to ${mobileNumber}:`, errText);
        } else {
            console.log(`[WhatsApp] Welcome message sent to ${mobileNumber}`);
        }
    } catch (err) {
        // Do not throw — WhatsApp failure should not block user creation
        console.error(`[WhatsApp] Error sending welcome message to ${mobileNumber}:`, err);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobileNumber, userName, flowName, accessLevel, isNew } = body;

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

        // Send WhatsApp welcome message only for new users (not on edit/update)
        if (isNew === true) {
            await sendWelcomeWhatsApp(mobileNumber, userName);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
