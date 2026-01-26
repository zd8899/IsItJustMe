import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12; // Per security requirements in ARCHITECTURE.md

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, action, hash } = body;

    // Handle verification action
    if (action === "verify") {
      if (!password || typeof password !== "string") {
        return NextResponse.json(
          { error: "Password is required" },
          { status: 400 }
        );
      }

      if (!hash || typeof hash !== "string") {
        return NextResponse.json(
          { error: "Hash is required for verification" },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(password, hash);
      return NextResponse.json({
        success: true,
        valid: isValid,
      });
    }

    // Default action: hash password
    // Validate password - check for empty or whitespace only
    if (!password || typeof password !== "string" || password.trim() === "") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Hash the password using bcrypt with salt
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    return NextResponse.json({
      success: true,
      hash: passwordHash,
    });
  } catch (error) {
    console.error("Hash password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
