import Dashboard from '@/components/Dashboard';
import { DashboardResponse } from '@/types/dashboard';
import type { Metadata } from "next";
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
export const metadata: Metadata = {
  metadataBase: new URL("https://dashboard.chatops.health"),
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
    url: "https://dashboard.chatops.health/",
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
async function getData(date: string, flowName: string): Promise<DashboardResponse> {
  // Use provided flowName (Required)
  const decodedFlowName = decodeURIComponent(flowName);
  const workflowName = encodeURIComponent(decodedFlowName);

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY is not defined in environment variables');
  }
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const baseUrl = process.env.BASE_URL;
      if (!baseUrl) {
        throw new Error('BASE_URL is not defined in environment variables');
      }
      console.log(`[Debug] Fetching from: ${baseUrl} with Key: ${apiKey?.substring(0, 4)}...`);
      const res = await fetch(`${baseUrl}/dev/discharge-tat/get?workflowName=${workflowName}&date=${date}`, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });

      console.log(`Fetching from API (Attempt ${attempt}/${MAX_RETRIES}): ${res.status}`);

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
      console.error(`API Fetch Error (Attempt ${attempt}/${MAX_RETRIES}):`, (error as Error).message);
      if (attempt === MAX_RETRIES) {
        throw error; // Propagate error only after final attempt
      }
      // Wait 1 second before retrying (simple backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('Unexpected error in retry loop');
}

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  // Default to today if no date provided, or keep the hardcoded default from before as fallback
  const date = params.date || new Date().toISOString().split('T')[0];

  const cookieStore = await cookies();
  const flowName = cookieStore.get('flowName')?.value;

  if (!flowName) {
    redirect('/login');
  }

  const decodedFlowName = decodeURIComponent(flowName);

  let data;
  try {
    data = await getData(date, flowName);
  } catch (error) {
    // Fallback or error state
    console.error(error);
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="p-8 bg-black/50 rounded-lg border border-red-500/50">
          <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Dashboard</h2>
          <p className="text-slate-300">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <Dashboard data={data} flowName={decodedFlowName} />
  );
}
