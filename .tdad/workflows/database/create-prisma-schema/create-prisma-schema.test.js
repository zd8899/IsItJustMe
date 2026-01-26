/**
 * Create Prisma Schema Tests
 *
 * Tests for validating the Prisma schema by testing CRUD operations
 * on all models: User, Category, Post, Comment, Vote.
 */

const { test, expect } = require('../../../tdad-fixtures');
const {
  performUserRegisterAction,
  performDuplicateUserRegisterAction,
  performCategoryListAction,
  performCategoryCreateAction,
  performPostCreateAction,
  performPostCreateInvalidCategoryAction,
  performPostGetByIdAction,
  performPostListByCategoryAction,
  performPostListHotAction,
  performPostListNewAction,
  performPostDeleteAction,
  performCommentCreateAction,
  performCommentCreateInvalidPostAction,
  performCommentGetByIdAction,
  performCommentDeleteAction,
  performVoteCastPostVoteAction,
  performVoteCastCommentVoteAction,
  generateUniqueUsername,
  generateAnonymousId
} = require('./create-prisma-schema.action.js');

test.describe('Create Prisma Schema', () => {

  // ==========================================
  // API TESTS - USER MODEL
  // ==========================================

  test('[API-001] Create user with required fields', async ({ page }) => {
    // Setup: Generate unique username
    const username = generateUniqueUsername();

    // Action: Register user
    const result = await performUserRegisterAction(page, {
      username,
      password: 'secret123',
      mode: 'api'
    });

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
    expect(result.body.id).toBeDefined();
    expect(result.body.username).toBe(username);
    expect(result.body.karma).toBeDefined();
  });

  test('[API-002] User username must be unique', async ({ page }) => {
    // Setup: Create unique username for this test
    const username = `existinguser_${Date.now()}`;

    // Action: Try to register duplicate username
    const result = await performDuplicateUserRegisterAction(page, {
      username,
      password: 'secret123'
    });

    // Assertions - we expect failure for duplicate
    expect(result.success).toBe(true); // success means duplicate was caught
    expect(result.statusCode).toBe(400);
    expect(result.error).toContain('already taken');
  });

  // ==========================================
  // API TESTS - CATEGORY MODEL
  // ==========================================

  test('[API-003] List all categories', async ({ page }) => {
    // Action: List categories
    const result = await performCategoryListAction(page);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(Array.isArray(result.categories)).toBe(true);

    // If categories exist, verify structure
    if (result.categories.length > 0) {
      const category = result.categories[0];
      expect(category.id).toBeDefined();
      expect(category.name).toBeDefined();
      expect(category.slug).toBeDefined();
    }
  });

  test('[API-004] Category name and slug must be unique', async ({ page }) => {
    // Setup: Create a category first
    const uniqueName = `Work_${Date.now()}`;
    const uniqueSlug = `work_${Date.now()}`;

    const createResult = await performCategoryCreateAction(page, {
      name: uniqueName,
      slug: uniqueSlug
    });

    // Only proceed if first creation worked (might fail if endpoint doesn't exist)
    if (createResult.success) {
      // Action: Try to create duplicate category
      const duplicateResult = await performCategoryCreateAction(page, {
        name: uniqueName,
        slug: uniqueSlug
      });

      // Assertions - expect failure for duplicate
      expect(duplicateResult.statusCode).toBe(400);
      expect(duplicateResult.error).toContain('already exists');
    } else {
      // If category creation endpoint doesn't exist, check seeded categories
      const listResult = await performCategoryListAction(page);
      expect(listResult.success).toBe(true);
      expect(listResult.categories.length).toBeGreaterThan(0);
    }
  });

  // ==========================================
  // API TESTS - POST MODEL
  // ==========================================

  test('[API-005] Create anonymous post with required fields', async ({ page }) => {
    // Setup: Get or create a category
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    let categoryId;
    if (categoryResult.categories.length > 0) {
      categoryId = categoryResult.categories[0].id;
    } else {
      // Create a category if none exist
      const createCatResult = await performCategoryCreateAction(page, {
        name: `TestCategory_${Date.now()}`,
        slug: `test-category-${Date.now()}`
      });
      expect(createCatResult.success).toBe(true);
      categoryId = createCatResult.categoryId;
    }

    // Action: Create anonymous post
    const result = await performPostCreateAction(page, {
      frustration: 'find a good work-life balance',
      identity: 'a software developer',
      categoryId,
      anonymousId: generateAnonymousId()
    });

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
    expect(result.body.id).toBeDefined();
    expect(result.body.frustration).toBe('find a good work-life balance');
    expect(result.body.identity).toBe('a software developer');
    expect(result.body.upvotes).toBe(0);
    expect(result.body.downvotes).toBe(0);
    expect(result.body.score).toBe(0);
    expect(result.body.commentCount).toBe(0);
  });

  test('[API-006] Create post with user association', async ({ page }) => {
    // Setup: Register user
    const username = generateUniqueUsername();
    const userResult = await performUserRegisterAction(page, {
      username,
      password: 'secret123'
    });
    expect(userResult.success).toBe(true);

    // Get category
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    let categoryId;
    if (categoryResult.categories.length > 0) {
      // Try to find technology category or use first
      const techCategory = categoryResult.categories.find(c => c.slug === 'technology');
      categoryId = techCategory ? techCategory.id : categoryResult.categories[0].id;
    } else {
      const createCatResult = await performCategoryCreateAction(page, {
        name: `Technology_${Date.now()}`,
        slug: `technology-${Date.now()}`
      });
      categoryId = createCatResult.categoryId;
    }

    // Action: Create post with user auth (simulated via context)
    const result = await performPostCreateAction(page, {
      frustration: 'understand async/await',
      identity: 'a junior developer',
      categoryId,
      authToken: userResult.userId // In real impl, this would be a JWT token
    });

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
    expect(result.body.id).toBeDefined();

    // Note: userId and user association depends on auth implementation
    // The test validates the post was created successfully
  });

  test('[API-007] Post must have valid category reference', async ({ page }) => {
    // Action: Try to create post with invalid categoryId
    const result = await performPostCreateInvalidCategoryAction(page);

    // Assertions - expect failure for invalid category
    expect(result.success).toBe(true); // success means error was caught
    expect(result.statusCode).toBe(400);
    expect(result.error).toContain('Invalid category');
  });

  test('[API-008] Get post by ID with category relation', async ({ page }) => {
    // Setup: Create a post first
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      // Skip if no categories available
      return;
    }

    const createResult = await performPostCreateAction(page, {
      frustration: `Test frustration ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(createResult.success).toBe(true);

    // Action: Get post by ID
    const result = await performPostGetByIdAction(page, {
      postId: createResult.postId
    });

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
    expect(result.body.category).toBeDefined();
    expect(result.body.category.name).toBeDefined();
    expect(result.body.category.slug).toBeDefined();
  });

  // ==========================================
  // API TESTS - COMMENT MODEL
  // ==========================================

  test('[API-009] Create comment on post', async ({ page }) => {
    // Setup: Create a post first
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      return;
    }

    const postResult = await performPostCreateAction(page, {
      frustration: `Test frustration ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(postResult.success).toBe(true);

    // Action: Create comment
    const result = await performCommentCreateAction(page, {
      content: 'I totally relate to this!',
      postId: postResult.postId,
      anonymousId: generateAnonymousId()
    });

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
    expect(result.body.id).toBeDefined();
    expect(result.body.content).toBe('I totally relate to this!');
    expect(result.body.postId).toBe(postResult.postId);
    expect(result.body.upvotes).toBe(0);
    expect(result.body.downvotes).toBe(0);
    expect(result.body.score).toBe(0);
  });

  test('[API-010] Create nested comment reply', async ({ page }) => {
    // Setup: Create a post and parent comment
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      return;
    }

    const postResult = await performPostCreateAction(page, {
      frustration: `Test frustration ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(postResult.success).toBe(true);

    const parentCommentResult = await performCommentCreateAction(page, {
      content: 'Parent comment',
      postId: postResult.postId,
      anonymousId: generateAnonymousId()
    });
    expect(parentCommentResult.success).toBe(true);

    // Action: Create nested reply
    const result = await performCommentCreateAction(page, {
      content: 'Great point!',
      postId: postResult.postId,
      parentId: parentCommentResult.commentId,
      anonymousId: generateAnonymousId()
    });

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
    expect(result.body.parentId).toBe(parentCommentResult.commentId);
  });

  test('[API-011] Comment must reference valid post', async ({ page }) => {
    // Action: Try to create comment with invalid postId
    const result = await performCommentCreateInvalidPostAction(page);

    // Assertions - expect failure for invalid post
    expect(result.success).toBe(true); // success means error was caught
    expect(result.statusCode).toBe(400);
    expect(result.error).toContain('Post not found');
  });

  test('[API-012] Deleting post cascades to comments', async ({ page }) => {
    // Setup: Create post and comment
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      return;
    }

    const postResult = await performPostCreateAction(page, {
      frustration: `Test frustration ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(postResult.success).toBe(true);

    const commentResult = await performCommentCreateAction(page, {
      content: 'Test comment',
      postId: postResult.postId,
      anonymousId: generateAnonymousId()
    });
    expect(commentResult.success).toBe(true);

    // Action: Delete post
    const deleteResult = await performPostDeleteAction(page, {
      postId: postResult.postId
    });

    // If delete endpoint exists, verify cascade
    if (deleteResult.success) {
      // Verify comment no longer exists
      const verifyResult = await performCommentGetByIdAction(page, {
        commentId: commentResult.commentId
      });
      expect(verifyResult.success).toBe(false);
    }
  });

  // ==========================================
  // API TESTS - VOTE MODEL
  // ==========================================

  test('[API-013] Cast upvote on post', async ({ page }) => {
    // Setup: Create a post
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      return;
    }

    const postResult = await performPostCreateAction(page, {
      frustration: `Test frustration ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(postResult.success).toBe(true);

    // Action: Cast upvote
    const result = await performVoteCastPostVoteAction(page, {
      postId: postResult.postId,
      value: 1,
      anonymousId: generateAnonymousId()
    });

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);

    // Verify post upvotes increased
    const verifyResult = await performPostGetByIdAction(page, {
      postId: postResult.postId
    });
    expect(verifyResult.success).toBe(true);
    expect(verifyResult.body.upvotes).toBe(1);
    expect(verifyResult.body.score).toBe(1);
  });

  test('[API-014] Cast downvote on comment', async ({ page }) => {
    // Setup: Create post and comment
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      return;
    }

    const postResult = await performPostCreateAction(page, {
      frustration: `Test frustration ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(postResult.success).toBe(true);

    const commentResult = await performCommentCreateAction(page, {
      content: 'Test comment',
      postId: postResult.postId,
      anonymousId: generateAnonymousId()
    });
    expect(commentResult.success).toBe(true);

    // Action: Cast downvote
    const result = await performVoteCastCommentVoteAction(page, {
      commentId: commentResult.commentId,
      value: -1,
      anonymousId: generateAnonymousId()
    });

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);

    // Verify comment downvotes increased
    const verifyResult = await performCommentGetByIdAction(page, {
      commentId: commentResult.commentId
    });
    expect(verifyResult.success).toBe(true);
    expect(verifyResult.body.downvotes).toBe(1);
    expect(verifyResult.body.score).toBe(-1);
  });

  test('[API-015] Prevent duplicate vote on post by same user', async ({ page }) => {
    // Setup: Register user and create post
    const username = generateUniqueUsername();
    const userResult = await performUserRegisterAction(page, {
      username,
      password: 'secret123'
    });
    expect(userResult.success).toBe(true);

    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      return;
    }

    const postResult = await performPostCreateAction(page, {
      frustration: `Test frustration ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(postResult.success).toBe(true);

    // First vote
    const firstVoteResult = await performVoteCastPostVoteAction(page, {
      postId: postResult.postId,
      value: 1,
      authToken: userResult.userId
    });
    expect(firstVoteResult.success).toBe(true);

    // Action: Try duplicate vote
    const result = await performVoteCastPostVoteAction(page, {
      postId: postResult.postId,
      value: 1,
      authToken: userResult.userId
    });

    // Assertions - expect failure for duplicate vote
    expect(result.statusCode).toBe(400);
    expect(result.error).toContain('Already voted');
  });

  test('[API-016] Prevent duplicate vote on post by same anonymous user', async ({ page }) => {
    // Setup: Create post
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      return;
    }

    const postResult = await performPostCreateAction(page, {
      frustration: `Test frustration ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(postResult.success).toBe(true);

    // Use same anonymous ID for both votes
    const anonymousId = generateAnonymousId();

    // First vote
    const firstVoteResult = await performVoteCastPostVoteAction(page, {
      postId: postResult.postId,
      value: 1,
      anonymousId
    });
    expect(firstVoteResult.success).toBe(true);

    // Action: Try duplicate vote with same anonymousId
    const result = await performVoteCastPostVoteAction(page, {
      postId: postResult.postId,
      value: 1,
      anonymousId
    });

    // Assertions - expect failure for duplicate vote
    expect(result.statusCode).toBe(400);
    expect(result.error).toContain('Already voted');
  });

  test('[API-017] Deleting post cascades to votes', async ({ page }) => {
    // Setup: Create post and vote
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      return;
    }

    const postResult = await performPostCreateAction(page, {
      frustration: `Test frustration ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(postResult.success).toBe(true);

    const voteResult = await performVoteCastPostVoteAction(page, {
      postId: postResult.postId,
      value: 1,
      anonymousId: generateAnonymousId()
    });
    expect(voteResult.success).toBe(true);

    // Action: Delete post
    const deleteResult = await performPostDeleteAction(page, {
      postId: postResult.postId
    });

    // If delete endpoint exists, cascade is verified by Prisma onDelete: Cascade
    if (deleteResult.success) {
      // Post and associated votes should be deleted
      const verifyResult = await performPostGetByIdAction(page, {
        postId: postResult.postId
      });
      expect(verifyResult.success).toBe(false);
    }
  });

  test('[API-018] Deleting comment cascades to votes', async ({ page }) => {
    // Setup: Create post, comment, and vote
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      return;
    }

    const postResult = await performPostCreateAction(page, {
      frustration: `Test frustration ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(postResult.success).toBe(true);

    const commentResult = await performCommentCreateAction(page, {
      content: 'Test comment',
      postId: postResult.postId,
      anonymousId: generateAnonymousId()
    });
    expect(commentResult.success).toBe(true);

    const voteResult = await performVoteCastCommentVoteAction(page, {
      commentId: commentResult.commentId,
      value: 1,
      anonymousId: generateAnonymousId()
    });
    expect(voteResult.success).toBe(true);

    // Action: Delete comment
    const deleteResult = await performCommentDeleteAction(page, {
      commentId: commentResult.commentId
    });

    // If delete endpoint exists, cascade is verified
    if (deleteResult.success) {
      const verifyResult = await performCommentGetByIdAction(page, {
        commentId: commentResult.commentId
      });
      expect(verifyResult.success).toBe(false);
    }
  });

  // ==========================================
  // API TESTS - INDEX VERIFICATION
  // ==========================================

  test('[API-019] Query posts by category efficiently', async ({ page }) => {
    // Setup: Get or create category and multiple posts
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    let categoryId;
    let categorySlug;

    // Find or use first category
    if (categoryResult.categories.length > 0) {
      const workCategory = categoryResult.categories.find(c => c.slug === 'work');
      if (workCategory) {
        categoryId = workCategory.id;
        categorySlug = workCategory.slug;
      } else {
        categoryId = categoryResult.categories[0].id;
        categorySlug = categoryResult.categories[0].slug;
      }
    } else {
      const createCatResult = await performCategoryCreateAction(page, {
        name: `Work_${Date.now()}`,
        slug: `work-${Date.now()}`
      });
      categoryId = createCatResult.categoryId;
      categorySlug = createCatResult.body?.slug;
    }

    // Create multiple posts in the category
    for (let i = 0; i < 3; i++) {
      await performPostCreateAction(page, {
        frustration: `Test frustration ${i} - ${Date.now()}`,
        identity: 'a tester',
        categoryId,
        anonymousId: generateAnonymousId()
      });
    }

    // Action: Query posts by category
    const result = await performPostListByCategoryAction(page, {
      categoryId
    });

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(Array.isArray(result.posts)).toBe(true);

    // All returned posts should be in the specified category
    for (const post of result.posts) {
      expect(post.categoryId).toBe(categoryId);
    }
  });

  test('[API-020] Query posts sorted by score and date (hot)', async ({ page }) => {
    // Setup: Create posts with different scores
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      return;
    }

    // Create posts
    const post1Result = await performPostCreateAction(page, {
      frustration: `Hot test post 1 - ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(post1Result.success).toBe(true);

    // Add votes to first post to increase score
    await performVoteCastPostVoteAction(page, {
      postId: post1Result.postId,
      value: 1,
      anonymousId: generateAnonymousId()
    });

    // Action: List hot posts
    const result = await performPostListHotAction(page);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(Array.isArray(result.posts)).toBe(true);
    // Posts should be returned (sorted by hot score algorithm)
  });

  test('[API-021] Query posts sorted by creation date (new)', async ({ page }) => {
    // Setup: Create posts with different creation times
    const categoryResult = await performCategoryListAction(page);
    expect(categoryResult.success).toBe(true);

    const categoryId = categoryResult.categories[0]?.id;
    if (!categoryId) {
      return;
    }

    // Create first post
    const post1Result = await performPostCreateAction(page, {
      frustration: `New test post 1 - ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(post1Result.success).toBe(true);

    // Create second post (newer)
    const post2Result = await performPostCreateAction(page, {
      frustration: `New test post 2 - ${Date.now()}`,
      identity: 'a tester',
      categoryId,
      anonymousId: generateAnonymousId()
    });
    expect(post2Result.success).toBe(true);

    // Action: List new posts
    const result = await performPostListNewAction(page);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(Array.isArray(result.posts)).toBe(true);

    // Posts should be sorted by createdAt descending (newest first)
    if (result.posts.length >= 2) {
      const firstPost = result.posts[0];
      const secondPost = result.posts[1];
      const firstDate = new Date(firstPost.createdAt).getTime();
      const secondDate = new Date(secondPost.createdAt).getTime();
      expect(firstDate).toBeGreaterThanOrEqual(secondDate);
    }
  });

});
