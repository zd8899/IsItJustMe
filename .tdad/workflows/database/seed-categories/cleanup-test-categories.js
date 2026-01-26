/**
 * Cleanup script for test category artifacts
 * Removes categories that are not in the expected list
 * Also removes posts that reference non-expected categories
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const EXPECTED_SLUGS = [
  'work',
  'relationships',
  'technology',
  'health',
  'parenting',
  'finance',
  'daily-life',
  'social',
  'other'
];

async function cleanup() {
  try {
    // First, find all category IDs that are NOT in expected list
    const nonExpectedCategories = await prisma.category.findMany({
      where: {
        slug: { notIn: EXPECTED_SLUGS }
      },
      select: { id: true }
    });

    const nonExpectedCategoryIds = nonExpectedCategories.map(c => c.id);

    // Delete posts referencing non-expected categories
    let deletedPosts = { count: 0 };
    if (nonExpectedCategoryIds.length > 0) {
      deletedPosts = await prisma.post.deleteMany({
        where: {
          categoryId: { in: nonExpectedCategoryIds }
        }
      });
    }

    // Now delete the non-expected categories
    const deletedCategories = await prisma.category.deleteMany({
      where: {
        slug: { notIn: EXPECTED_SLUGS }
      }
    });

    console.log(JSON.stringify({
      success: true,
      deletedCount: deletedCategories.count,
      deletedPostsCount: deletedPosts.count
    }));
  } catch (e) {
    console.log(JSON.stringify({ success: false, error: e.message }));
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
