import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    // Check if username is provided (empty or whitespace only)
    if (!username || typeof username !== "string" || username.trim() === "") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    // Check minimum length (3 characters)
    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Check maximum length (20 characters)
    if (trimmedUsername.length > 20) {
      return NextResponse.json(
        { error: "Username must be at most 20 characters" },
        { status: 400 }
      );
    }

    // Check for valid characters (alphanumeric and underscores only)
    const validUsernamePattern = /^[a-zA-Z0-9_]+$/;
    if (!validUsernamePattern.test(trimmedUsername)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    // Check availability (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: trimmedUsername,
          mode: "insensitive",
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          valid: true,
          available: false,
          message: "Username is already taken",
        },
        { status: 200 }
      );
    }

    // Username is valid and available
    return NextResponse.json(
      {
        valid: true,
        available: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Validate username error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
