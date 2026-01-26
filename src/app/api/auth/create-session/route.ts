import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { encode } from "next-auth/jwt";

// JWT secret from environment or fallback for development
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "development-secret-change-in-production";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username } = body;

    // Validate userId
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate username
    if (!username || typeof username !== "string" || username.trim() === "") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate JWT token using next-auth's encode function
    const token = await encode({
      token: {
        id: user.id,
        name: user.username,
        sub: user.id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      secret: JWT_SECRET,
    });

    // Return session data
    return NextResponse.json(
      {
        token,
        userId: user.id,
        username: user.username,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
