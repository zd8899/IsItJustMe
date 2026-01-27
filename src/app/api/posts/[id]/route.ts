import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

// CUID format validation - CUIDs start with 'c' and contain lowercase letters and numbers
function isValidCuid(id: string): boolean {
  // CUID pattern: starts with 'c', followed by lowercase alphanumeric characters
  // Typical length is 25 characters but can vary
  const cuidPattern = /^c[a-z0-9]{7,}$/;
  return cuidPattern.test(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format
    if (!isValidCuid(id)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    // Fetch post with category details
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Return post with all required fields
    return NextResponse.json({
      id: post.id,
      frustration: post.frustration,
      identity: post.identity,
      categoryId: post.categoryId,
      createdAt: post.createdAt,
      category: post.category,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      score: post.score,
    });
  } catch (error) {
    console.error("Fetch post by ID error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
