// src/app/api/generative-form/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { prompt } = await request.json();

    // 2. Call your API-Gateway endpoint
    const response = await fetch("http://api-gateway:4000/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
    });

    const payload = await response.json();
    if (!response.ok) {
        return NextResponse.json(
            { error: payload.error ?? payload },
            { status: response.status }
        );
    }

    const fields = Array.isArray(payload.object)
        ? // if object is [[…],[…]] flatten it
          (payload.object as any[][]).flat()
        : // if object is already your fields array
          (payload.object ?? payload);

    return NextResponse.json(fields);
}
