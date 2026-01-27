import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET() {
  const anonymousId = randomUUID();

  return NextResponse.json({ anonymousId }, { status: 200 });
}
