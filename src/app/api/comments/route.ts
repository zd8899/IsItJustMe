import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { createCommentSchema } from "@/lib/validations";
import { ZodError } from "zod";

// CUID format validation (starts with 'c', followed by lowercase letters and numbers, ~25 chars)
function isValidCuid(id: string): boolean {
  return /^c[a-z0-9]{20,}$/i.test(id);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    // Validate postId is provided
    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Validate postId format (CUID)
    if (!isValidCuid(postId)) {
      return NextResponse.json(
        { error: "Invalid post ID" },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Fetch parent comments (no parentId) with nested replies
    const comments = await prisma.comment.findMany({
      where: {
        postId: postId,
        parentId: null, // Only top-level comments
      },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format the response
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      parentId: comment.parentId,
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
      score: comment.score,
      createdAt: comment.createdAt,
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        postId: reply.postId,
        parentId: reply.parentId,
        upvotes: reply.upvotes,
        downvotes: reply.downvotes,
        score: reply.score,
        createdAt: reply.createdAt,
      })),
    }));

    return NextResponse.json(formattedComments, { status: 200 });
  } catch (error) {
    console.error("Fetch comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = createCommentSchema.parse(body);

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: validatedData.postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // If parentId is provided, verify parent comment exists
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        postId: validatedData.postId,
        parentId: validatedData.parentId,
        userId: validatedData.userId,
        anonymousId: validatedData.anonymousId,
      },
    });

    // Update post comment count
    await prisma.post.update({
      where: { id: validatedData.postId },
      data: { commentCount: { increment: 1 } },
    });

    return NextResponse.json(
      {
        id: comment.id,
        content: comment.content,
        postId: comment.postId,
        parentId: comment.parentId,
        userId: comment.userId,
        anonymousId: comment.anonymousId,
        upvotes: comment.upvotes,
        downvotes: comment.downvotes,
        score: comment.score,
        createdAt: comment.createdAt,
      },
      { status: 201 }
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

    console.error("Comment creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
