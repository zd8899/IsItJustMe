/**
 * Create Prisma Schema Action
 *
 * This action provides API testing functions for validating the Prisma schema
 * by testing CRUD operations on all models: User, Category, Post, Comment, Vote.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @returns {Promise<Object>} - Returns { success, errorMessage, ...data }
 */

// ==========================================
// HELPER: Generate unique identifiers
// ==========================================
function generateUniqueId(prefix = 'test') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateUniqueUsername() {
  return generateUniqueId('user');
}

function generateUniqueEmail() {
  return `${generateUniqueId('email')}@test.com`;
}

function generateAnonymousId() {
  return `anon-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ==========================================
// USER ACTIONS
// ==========================================

/**
 * Register a new user
 */
async function performUserRegisterAction(page, context = {}) {
  try {
    const username = context.username || generateUniqueUsername();
    const password = context.password || 'testpassword123';

    const response = await page.request.post('/api/trpc/user.register', {
      data: {
        json: { username, password }
      }
    });

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    if (context.mode === 'api') {
      return {
        success: response.ok(),
        statusCode,
        body: body?.result?.data?.json || body,
        error: body?.error?.json?.message || body?.error?.message || null,
        username,
        password
      };
    }

    return {
      success: response.ok(),
      statusCode,
      userId: body?.result?.data?.json?.id,
      username,
      password,
      body: body?.result?.data?.json || body
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Check for duplicate username registration (should fail)
 */
async function performDuplicateUserRegisterAction(page, context = {}) {
  try {
    const username = context.username || 'existinguser';
    const password = context.password || 'testpassword123';

    // First register the user
    const firstResponse = await page.request.post('/api/trpc/user.register', {
      data: {
        json: { username, password }
      }
    });

    // Try to register again with same username
    const response = await page.request.post('/api/trpc/user.register', {
      data: {
        json: { username, password }
      }
    });

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: !response.ok(), // Success means we caught the duplicate
      statusCode,
      body: body?.result?.data?.json || body,
      error: body?.error?.json?.message || body?.error?.message || null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

// ==========================================
// CATEGORY ACTIONS
// ==========================================

/**
 * List all categories
 */
async function performCategoryListAction(page, context = {}) {
  try {
    const response = await page.request.get('/api/trpc/category.list');

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    const categories = body?.result?.data?.json || [];

    return {
      success: response.ok(),
      statusCode,
      body: categories,
      categories
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Create a category (admin action - for setup purposes)
 */
async function performCategoryCreateAction(page, context = {}) {
  try {
    const name = context.name || `Category_${Date.now()}`;
    const slug = context.slug || name.toLowerCase().replace(/\s+/g, '-');

    const response = await page.request.post('/api/trpc/category.create', {
      data: {
        json: { name, slug }
      }
    });

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body,
      categoryId: body?.result?.data?.json?.id,
      error: body?.error?.json?.message || body?.error?.message || null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

// ==========================================
// POST ACTIONS
// ==========================================

/**
 * Create an anonymous post
 */
async function performPostCreateAction(page, context = {}) {
  try {
    const frustration = context.frustration || `Test frustration ${Date.now()}`;
    const identity = context.identity || 'a tester';
    const categoryId = context.categoryId;
    const anonymousId = context.anonymousId || generateAnonymousId();

    if (!categoryId) {
      return { success: false, errorMessage: 'categoryId is required' };
    }

    const payload = {
      frustration,
      identity,
      categoryId,
      anonymousId
    };

    // Add auth token if provided (for authenticated posts)
    const headers = {};
    if (context.authToken) {
      headers['Authorization'] = `Bearer ${context.authToken}`;
    }

    const response = await page.request.post('/api/trpc/post.create', {
      data: { json: payload },
      headers
    });

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body,
      postId: body?.result?.data?.json?.id,
      error: body?.error?.json?.message || body?.error?.message || null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Create a post with invalid categoryId (should fail)
 */
async function performPostCreateInvalidCategoryAction(page, context = {}) {
  try {
    const response = await page.request.post('/api/trpc/post.create', {
      data: {
        json: {
          frustration: 'Test frustration',
          identity: 'a tester',
          categoryId: 'invalid-category-id-that-does-not-exist',
          anonymousId: generateAnonymousId()
        }
      }
    });

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: !response.ok(), // Success means we caught the invalid category
      statusCode,
      body: body?.result?.data?.json || body,
      error: body?.error?.json?.message || body?.error?.message || null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Get post by ID
 */
async function performPostGetByIdAction(page, context = {}) {
  try {
    const postId = context.postId;

    if (!postId) {
      return { success: false, errorMessage: 'postId is required' };
    }

    const response = await page.request.get(`/api/trpc/post.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: postId } }))}`);

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body,
      post: body?.result?.data?.json
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * List posts by category
 */
async function performPostListByCategoryAction(page, context = {}) {
  try {
    const categoryId = context.categoryId;

    if (!categoryId) {
      return { success: false, errorMessage: 'categoryId is required' };
    }

    const response = await page.request.get(`/api/trpc/post.listByCategory?input=${encodeURIComponent(JSON.stringify({ json: { categoryId } }))}`);

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body,
      posts: body?.result?.data?.json || []
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * List hot posts
 */
async function performPostListHotAction(page, context = {}) {
  try {
    const response = await page.request.get('/api/trpc/post.listHot');

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body,
      posts: body?.result?.data?.json || []
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * List new posts
 */
async function performPostListNewAction(page, context = {}) {
  try {
    const response = await page.request.get('/api/trpc/post.listNew');

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body,
      posts: body?.result?.data?.json || []
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Delete a post (admin action)
 */
async function performPostDeleteAction(page, context = {}) {
  try {
    const postId = context.postId;

    if (!postId) {
      return { success: false, errorMessage: 'postId is required' };
    }

    const response = await page.request.post('/api/trpc/post.delete', {
      data: { json: { id: postId } }
    });

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

// ==========================================
// COMMENT ACTIONS
// ==========================================

/**
 * Create a comment on a post
 */
async function performCommentCreateAction(page, context = {}) {
  try {
    const content = context.content || `Test comment ${Date.now()}`;
    const postId = context.postId;
    const parentId = context.parentId || null;
    const anonymousId = context.anonymousId || generateAnonymousId();

    if (!postId) {
      return { success: false, errorMessage: 'postId is required' };
    }

    const payload = {
      content,
      postId,
      anonymousId
    };

    if (parentId) {
      payload.parentId = parentId;
    }

    const response = await page.request.post('/api/trpc/comment.create', {
      data: { json: payload }
    });

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body,
      commentId: body?.result?.data?.json?.id,
      error: body?.error?.json?.message || body?.error?.message || null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Create a comment with invalid postId (should fail)
 */
async function performCommentCreateInvalidPostAction(page, context = {}) {
  try {
    const response = await page.request.post('/api/trpc/comment.create', {
      data: {
        json: {
          content: 'Test comment',
          postId: 'invalid-post-id-that-does-not-exist',
          anonymousId: generateAnonymousId()
        }
      }
    });

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: !response.ok(), // Success means we caught the invalid post
      statusCode,
      body: body?.result?.data?.json || body,
      error: body?.error?.json?.message || body?.error?.message || null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Get comment by ID
 */
async function performCommentGetByIdAction(page, context = {}) {
  try {
    const commentId = context.commentId;

    if (!commentId) {
      return { success: false, errorMessage: 'commentId is required' };
    }

    const response = await page.request.get(`/api/trpc/comment.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: commentId } }))}`);

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body,
      comment: body?.result?.data?.json
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Delete a comment (admin action)
 */
async function performCommentDeleteAction(page, context = {}) {
  try {
    const commentId = context.commentId;

    if (!commentId) {
      return { success: false, errorMessage: 'commentId is required' };
    }

    const response = await page.request.post('/api/trpc/comment.delete', {
      data: { json: { id: commentId } }
    });

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

// ==========================================
// VOTE ACTIONS
// ==========================================

/**
 * Cast vote on a post
 */
async function performVoteCastPostVoteAction(page, context = {}) {
  try {
    const postId = context.postId;
    const value = context.value || 1; // 1 for upvote, -1 for downvote
    const anonymousId = context.anonymousId || generateAnonymousId();

    if (!postId) {
      return { success: false, errorMessage: 'postId is required' };
    }

    const payload = {
      postId,
      value,
      anonymousId
    };

    const headers = {};
    if (context.authToken) {
      headers['Authorization'] = `Bearer ${context.authToken}`;
    }

    const response = await page.request.post('/api/trpc/vote.castPostVote', {
      data: { json: payload },
      headers
    });

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body,
      error: body?.error?.json?.message || body?.error?.message || null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Cast vote on a comment
 */
async function performVoteCastCommentVoteAction(page, context = {}) {
  try {
    const commentId = context.commentId;
    const value = context.value || 1; // 1 for upvote, -1 for downvote
    const anonymousId = context.anonymousId || generateAnonymousId();

    if (!commentId) {
      return { success: false, errorMessage: 'commentId is required' };
    }

    const payload = {
      commentId,
      value,
      anonymousId
    };

    const headers = {};
    if (context.authToken) {
      headers['Authorization'] = `Bearer ${context.authToken}`;
    }

    const response = await page.request.post('/api/trpc/vote.castCommentVote', {
      data: { json: payload },
      headers
    });

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body,
      error: body?.error?.json?.message || body?.error?.message || null
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

/**
 * Get vote by ID
 */
async function performVoteGetByIdAction(page, context = {}) {
  try {
    const voteId = context.voteId;

    if (!voteId) {
      return { success: false, errorMessage: 'voteId is required' };
    }

    const response = await page.request.get(`/api/trpc/vote.getById?input=${encodeURIComponent(JSON.stringify({ json: { id: voteId } }))}`);

    const statusCode = response.status();
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = await response.text();
    }

    return {
      success: response.ok(),
      statusCode,
      body: body?.result?.data?.json || body,
      vote: body?.result?.data?.json
    };
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

// ==========================================
// COMBINED ACTION (Main Entry Point)
// ==========================================

/**
 * Main action entry point for Prisma Schema validation
 */
async function performCreatePrismaSchemaAction(page, context = {}) {
  try {
    const action = context.action;

    switch (action) {
      // User actions
      case 'user.register':
        return await performUserRegisterAction(page, context);
      case 'user.register.duplicate':
        return await performDuplicateUserRegisterAction(page, context);

      // Category actions
      case 'category.list':
        return await performCategoryListAction(page, context);
      case 'category.create':
        return await performCategoryCreateAction(page, context);

      // Post actions
      case 'post.create':
        return await performPostCreateAction(page, context);
      case 'post.create.invalidCategory':
        return await performPostCreateInvalidCategoryAction(page, context);
      case 'post.getById':
        return await performPostGetByIdAction(page, context);
      case 'post.listByCategory':
        return await performPostListByCategoryAction(page, context);
      case 'post.listHot':
        return await performPostListHotAction(page, context);
      case 'post.listNew':
        return await performPostListNewAction(page, context);
      case 'post.delete':
        return await performPostDeleteAction(page, context);

      // Comment actions
      case 'comment.create':
        return await performCommentCreateAction(page, context);
      case 'comment.create.invalidPost':
        return await performCommentCreateInvalidPostAction(page, context);
      case 'comment.getById':
        return await performCommentGetByIdAction(page, context);
      case 'comment.delete':
        return await performCommentDeleteAction(page, context);

      // Vote actions
      case 'vote.castPostVote':
        return await performVoteCastPostVoteAction(page, context);
      case 'vote.castCommentVote':
        return await performVoteCastCommentVoteAction(page, context);
      case 'vote.getById':
        return await performVoteGetByIdAction(page, context);

      default:
        return { success: false, errorMessage: `Unknown action: ${action}` };
    }
  } catch (error) {
    return { success: false, errorMessage: error.message };
  }
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // Main action
  performCreatePrismaSchemaAction,

  // User actions
  performUserRegisterAction,
  performDuplicateUserRegisterAction,

  // Category actions
  performCategoryListAction,
  performCategoryCreateAction,

  // Post actions
  performPostCreateAction,
  performPostCreateInvalidCategoryAction,
  performPostGetByIdAction,
  performPostListByCategoryAction,
  performPostListHotAction,
  performPostListNewAction,
  performPostDeleteAction,

  // Comment actions
  performCommentCreateAction,
  performCommentCreateInvalidPostAction,
  performCommentGetByIdAction,
  performCommentDeleteAction,

  // Vote actions
  performVoteCastPostVoteAction,
  performVoteCastCommentVoteAction,
  performVoteGetByIdAction,

  // Helpers
  generateUniqueId,
  generateUniqueUsername,
  generateUniqueEmail,
  generateAnonymousId
};
