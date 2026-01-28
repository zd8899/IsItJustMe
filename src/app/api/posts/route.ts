import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { createPostSchema } from "@/lib/validations";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "new";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const categorySlug = searchParams.get("categorySlug");

    let orderBy: object;
    if (sortBy === "hot") {
      orderBy = { hotScore: "desc" };
    } else if (sortBy === "top") {
      orderBy = { score: "desc" };
    } else {
      orderBy = { createdAt: "desc" };
    }

    // Build where clause for category filtering
    let whereClause: object | undefined = undefined;
    if (categorySlug && categorySlug !== "all") {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        whereClause = { categoryId: category.id };
      }
    }

    const posts = await prisma.post.findMany({
      take: limit,
      skip: offset,
      orderBy: orderBy,
      where: whereClause,
      include: {
        category: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      frustration: post.frustration,
      identity: post.identity,
      category: post.category.name,
      score: post.score,
      commentCount: post._count.comments,
      createdAt: post.createdAt.toISOString(),
      username: post.user?.username || undefined,
    }));

    return NextResponse.json(formattedPosts, { status: 200 });
  } catch (error) {
    console.error("Posts fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = createPostSchema.parse(body);

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Please select a category" },
        { status: 400 }
      );
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        frustration: validatedData.frustration,
        identity: validatedData.identity,
        categoryId: validatedData.categoryId,
        userId: validatedData.userId || undefined,
        anonymousId: validatedData.anonymousId || undefined,
      },
    });

    return NextResponse.json(
      {
        id: post.id,
        frustration: post.frustration,
        identity: post.identity,
        categoryId: post.categoryId,
        createdAt: post.createdAt,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      // Return the first validation error message
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
