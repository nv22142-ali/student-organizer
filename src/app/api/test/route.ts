import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "API test successful" }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ 
      message: "API POST test successful", 
      receivedData: body 
    }, { status: 200 });
  } catch (error) {
    console.error("Error in test API:", error);
    return NextResponse.json({ error: "Error processing request" }, { status: 500 });
  }
} 