import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        createdAt: true,
        _count: { select: { posts: true, comments: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch user posts with category and comment count
    const posts = await prisma.post.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        _count: { select: { comments: true } },
      },
    });

    // Map posts to include commentCount
    const postsWithCommentCount = posts.map((post) => ({
      ...post,
      commentCount: post._count.comments,
    }));

    // Calculate postKarma: sum of score from all posts by this user
    const postKarmaResult = await prisma.post.aggregate({
      where: { userId: userId },
      _sum: { score: true },
    });
    const postKarma = postKarmaResult._sum.score ?? 0;

    // Calculate commentKarma: sum of score from all comments by this user
    const commentKarmaResult = await prisma.comment.aggregate({
      where: { userId: userId },
      _sum: { score: true },
    });
    const commentKarma = commentKarmaResult._sum.score ?? 0;

    // Calculate totalKarma
    const totalKarma = postKarma + commentKarma;

    return NextResponse.json({
      ...user,
      karma: totalKarma,
      postKarma,
      commentKarma,
      posts: postsWithCommentCount,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
