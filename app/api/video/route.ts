import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { checkSubscription } from "@/lib/subscription";
import { incrementApiLimit, checkApiLimit } from "@/lib/api-limit";

const SEGMIND_API_URL = "https://api.segmind.com/v1/luma-txt-2-video";
const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY; // Set this in .env file

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { prompt } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!SEGMIND_API_KEY) {
      return new NextResponse("Segmind API Key not configured.", { status: 500 });
    }

    if (!prompt) {
      return new NextResponse("Text prompt is required", { status: 400 });
    }

     const freeTrial = await checkApiLimit();
        const isPro = await checkSubscription();
    
        if (!freeTrial && !isPro) {
          return new NextResponse("Free trial has expired. Please upgrade to pro.", { status: 403 });
        }

    const response = await fetch(SEGMIND_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": SEGMIND_API_KEY,
        "Content-Type": "application/json",
        "Accept": "video/mp4",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      body: JSON.stringify({ prompt }),
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SEGMIND_API_ERROR]", errorText);
      return new NextResponse(errorText, { status: response.status });
    }

    if (!isPro) {
      await incrementApiLimit();
    }

    // Ensure response is a stream for correct video handling
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
      },
    });

    
  } catch (error: any) {
    console.error("[VIDEO_ERROR]", error.message);
    return new NextResponse("Internal Error", { status: 500 });
  }
}