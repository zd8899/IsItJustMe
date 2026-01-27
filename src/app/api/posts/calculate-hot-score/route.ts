import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate upvotes
    if (body.upvotes === undefined || body.upvotes === null) {
      return NextResponse.json(
        { error: "upvotes is required" },
        { status: 400 }
      );
    }

    // Validate downvotes
    if (body.downvotes === undefined || body.downvotes === null) {
      return NextResponse.json(
        { error: "downvotes is required" },
        { status: 400 }
      );
    }

    // Validate createdAt
    if (body.createdAt === undefined || body.createdAt === null) {
      return NextResponse.json(
        { error: "createdAt is required" },
        { status: 400 }
      );
    }

    // Validate upvotes is non-negative integer
    if (typeof body.upvotes !== "number" || body.upvotes < 0 || !Number.isInteger(body.upvotes)) {
      return NextResponse.json(
        { error: "upvotes must be a non-negative integer" },
        { status: 400 }
      );
    }

    // Validate downvotes is non-negative integer
    if (typeof body.downvotes !== "number" || body.downvotes < 0 || !Number.isInteger(body.downvotes)) {
      return NextResponse.json(
        { error: "downvotes must be a non-negative integer" },
        { status: 400 }
      );
    }

    // Validate createdAt is a valid ISO date string
    const createdDate = new Date(body.createdAt);
    if (isNaN(createdDate.getTime())) {
      return NextResponse.json(
        { error: "createdAt must be a valid ISO date string" },
        { status: 400 }
      );
    }

    // Calculate hot score
    // Formula: sign * log10(max(|score|, 1)) + seconds_since_epoch / 45000
    // where score = upvotes - downvotes, epoch = 2024-01-01
    const upvotes = body.upvotes;
    const downvotes = body.downvotes;
    const score = upvotes - downvotes;

    const order = Math.log10(Math.max(Math.abs(score), 1));
    const sign = score > 0 ? 1 : score < 0 ? -1 : 0;

    const epoch = new Date("2024-01-01").getTime();
    const seconds = (createdDate.getTime() - epoch) / 1000;

    const hotScore = sign * order + seconds / 45000;

    return NextResponse.json(
      { hotScore },
      { status: 200 }
    );
  } catch (error) {
    console.error("Hot score calculation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
