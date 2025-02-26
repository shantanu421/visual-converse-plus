import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import axios from "axios";

import { checkSubscription } from "@/lib/subscription";
import { incrementApiLimit, checkApiLimit } from "@/lib/api-limit";

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5";

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { prompt, amount = 1, resolution = "512x512" } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!HUGGINGFACE_API_KEY) {
      return new NextResponse("Hugging Face API Key not configured.", { status: 500 });
    }

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    if (!amount) {
      return new NextResponse("Amount is required", { status: 400 });
    }

    if (!resolution) {
      return new NextResponse("Resolution is required", { status: 400 });
    }

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro) {
      return new NextResponse("Free trial has expired. Please upgrade to pro.", { status: 403 });
    }

    const images = [];
    for (let i = 0; i < parseInt(amount, 10); i++) {
      const response = await axios.post(
        HUGGINGFACE_API_URL,
        { inputs: prompt },
        {
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
      );
      
      const imageUrl = `data:image/png;base64,${Buffer.from(response.data).toString("base64")}`;
      images.push({ image: imageUrl });
    }

    if (!isPro) {
      await incrementApiLimit();
    }

    return NextResponse.json(images);
  } catch (error: any) {
    console.error("[IMAGE_ERROR]", error.response?.data ? Buffer.from(error.response.data).toString() : error.message);

    return new NextResponse("Internal Error", { status: 500 });
  }
}
