/**
 * Fetch User Posts Action
 *
 * Queries posts created by a specific user via the post.listByUser tRPC endpoint.
 * Returns an array of posts including id, frustration, identity, and category information.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.userId - The user ID to fetch posts for
 * @param {boolean} context.emptyUserId - If true, send empty userId (validation error test)
 * @param {boolean} context.nonExistent - If true, use a non-existent user ID
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, posts, ... }
 */
async function performFetchUserPostsAction(page, context = {}) {
    try {
        const { mode, userId, emptyUserId, nonExistent } = context;

        // ==========================================
        // API MODE - Direct HTTP request via tRPC
        // ==========================================
        if (mode === 'api' || !mode) {
            let idToUse;

            if (emptyUserId) {
                // Empty userId to test validation
                idToUse = '';
            } else if (nonExistent) {
                // Use a valid-looking CUID that doesn't exist
                idToUse = 'clxyz123nonexistent456';
            } else {
                idToUse = userId;
            }

            // Build URL with encoded input parameter
            const inputParams = { userId: idToUse };
            const encodedInput = encodeURIComponent(JSON.stringify({ json: inputParams }));
            const url = `/api/trpc/post.listByUser?input=${encodedInput}`;

            const response = await page.request.get(url);

            const status = response.status();
            let body = null;

            try {
                body = await response.json();
            } catch (e) {
                body = await response.text();
            }

            // Extract error message from tRPC error response
            let errorMessage = null;
            if (!response.ok()) {
                const zodError = body?.error?.json?.data?.zodError;
                if (zodError && zodError.fieldErrors) {
                    const fieldErrors = Object.values(zodError.fieldErrors);
                    if (fieldErrors.length > 0 && Array.isArray(fieldErrors[0]) && fieldErrors[0].length > 0) {
                        errorMessage = fieldErrors[0][0];
                    }
                }
                if (!errorMessage) {
                    errorMessage = body?.error?.json?.message || body?.error?.message || 'Fetch user posts failed';
                }
            }

            // Extract posts data from successful response
            // tRPC with superjson returns data in result.data.json format
            const resultData = body?.result?.data;
            const postsData = resultData && typeof resultData === 'object' && 'json' in resultData
                ? resultData.json
                : (resultData ?? null);

            // Ensure posts is an array
            const posts = Array.isArray(postsData) ? postsData : [];

            return {
                success: response.ok(),
                statusCode: status,
                body: body,
                posts: posts,
                postCount: posts.length,
                firstPost: posts.length > 0 ? posts[0] : null,
                secondPost: posts.length > 1 ? posts[1] : null,
                isEmpty: posts.length === 0,
                errorMessage: errorMessage
            };
        }

        // No UI mode for this action - it's API only
        return { success: false, errorMessage: 'Only API mode is supported for this action' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a unique test user
 * @param {Object} page - Playwright page object
 * @param {string} prefix - Prefix for username (default: 'user')
 * @param {string} password - Password for the user (default: 'TestPassword123!')
 * @returns {Promise<Object>} - Registration result with user data
 */
async function createTestUser(page, prefix = 'user', password = 'TestPassword123!') {
    const username = generateUniqueUsername(prefix);

    const response = await page.request.post('/api/auth/register', {
        data: { username, password }
    });

    const status = response.status();
    let body = null;

    try {
        body = await response.json();
    } catch (e) {
        body = await response.text();
    }

    return {
        success: response.ok(),
        statusCode: status,
        body: body,
        userId: body?.userId || body?.id || null,
        username: body?.username || username,
        karma: body?.karma ?? null,
        errorMessage: !response.ok() ? (body?.error || body?.message || 'Registration failed') : null
    };
}

/**
 * Generate unique username with timestamp
 * @param {string} prefix - Prefix for the username
 * @returns {string} - Unique username (max 20 chars)
 */
function generateUniqueUsername(prefix = 'user') {
    const shortTimestamp = Date.now().toString().slice(-6);
    return `${prefix}_${shortTimestamp}`;
}

/**
 * Helper to get or create a valid category for testing
 * @param {Object} page - Playwright page object
 * @param {string} targetSlug - Optional specific slug to find/create
 * @returns {Promise<Object>} - Returns { success, categoryId, categoryName, categorySlug }
 */
async function getOrCreateCategory(page, targetSlug = null) {
    try {
        // First try to get categories from REST API
        const categoriesResponse = await page.request.get('/api/categories');

        if (categoriesResponse.ok()) {
            const categories = await categoriesResponse.json();
            if (Array.isArray(categories) && categories.length > 0) {
                // If targetSlug specified, try to find it
                if (targetSlug) {
                    const targetCategory = categories.find(c => c.slug === targetSlug);
                    if (targetCategory) {
                        return {
                            success: true,
                            categoryId: targetCategory.id,
                            categoryName: targetCategory.name,
                            categorySlug: targetCategory.slug
                        };
                    }
                }
                // Otherwise return first category
                const category = categories[0];
                return {
                    success: true,
                    categoryId: category.id,
                    categoryName: category.name,
                    categorySlug: category.slug
                };
            }
        }

        // Try tRPC endpoint as fallback
        const listResponse = await page.request.get('/api/trpc/category.list');

        if (listResponse.ok()) {
            const listData = await listResponse.json();
            const categories = listData?.result?.data?.json || listData?.result?.data || listData;

            if (Array.isArray(categories) && categories.length > 0) {
                if (targetSlug) {
                    const targetCategory = categories.find(c => c.slug === targetSlug);
                    if (targetCategory) {
                        return {
                            success: true,
                            categoryId: targetCategory.id,
                            categoryName: targetCategory.name,
                            categorySlug: targetCategory.slug
                        };
                    }
                }
                const category = categories[0];
                return {
                    success: true,
                    categoryId: category.id,
                    categoryName: category.name,
                    categorySlug: category.slug
                };
            }
        }

        return { success: false, errorMessage: 'Failed to get or create test category' };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a test post for a user via REST API
 * Note: Posts created via /api/posts may not be directly associated with a userId
 * unless the user is authenticated. For testing listByUser, we need posts with userId set.
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options for creating the post
 * @param {string} options.frustration - Post frustration text
 * @param {string} options.categoryId - Category ID (required)
 * @returns {Promise<Object>} - Returns { success, postId, errorMessage }
 */
async function createTestPost(page, options = {}) {
    try {
        // Get a category if not provided
        let categoryId = options.categoryId;
        if (!categoryId) {
            const catResult = await getOrCreateCategory(page, options.categorySlug);
            if (!catResult.success) {
                return { success: false, errorMessage: 'No category available for creating test post' };
            }
            categoryId = catResult.categoryId;
        }

        const anonymousId = `anon_posts_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const frustration = options.frustration || `Test frustration ${Date.now()}`;
        const identity = options.identity || `a profile tester`;

        const postData = {
            frustration: frustration,
            identity: identity,
            categoryId: categoryId,
            anonymousId: anonymousId
        };

        const response = await page.request.post('/api/posts', {
            data: postData
        });

        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        return {
            success: response.ok(),
            statusCode: status,
            postId: body?.id || null,
            frustration: body?.frustration || frustration,
            identity: body?.identity || identity,
            categoryId: body?.categoryId || categoryId,
            category: body?.category || null,
            errorMessage: !response.ok() ? (body?.error || body?.message || 'Post creation failed') : null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a post associated with a specific user via tRPC
 * Uses authenticated session to create post with userId
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options including userId, frustration, categoryId
 * @returns {Promise<Object>} - Returns { success, postId, ... }
 */
async function createPostForUser(page, options = {}) {
    try {
        const { frustration, categoryId, categorySlug } = options;

        // Get category
        let catId = categoryId;
        let catSlug = null;
        let catName = null;
        if (!catId) {
            const catResult = await getOrCreateCategory(page, categorySlug);
            if (!catResult.success) {
                return { success: false, errorMessage: 'No category available' };
            }
            catId = catResult.categoryId;
            catSlug = catResult.categorySlug;
            catName = catResult.categoryName;
        }

        const anonymousId = `anon_userpost_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const postFrustration = frustration || `Test user frustration ${Date.now()}`;
        const postIdentity = `a test identity`;

        // tRPC post.create mutation
        const inputData = {
            frustration: postFrustration,
            identity: postIdentity,
            categoryId: catId,
            anonymousId: anonymousId
        };

        const response = await page.request.post('/api/trpc/post.create', {
            data: { json: inputData }
        });

        const status = response.status();
        let body = null;

        try {
            body = await response.json();
        } catch (e) {
            body = await response.text();
        }

        // Extract post data from tRPC response
        const postData = body?.result?.data?.json || body?.result?.data || body;

        return {
            success: response.ok(),
            statusCode: status,
            postId: postData?.id || null,
            frustration: postData?.frustration || postFrustration,
            identity: postData?.identity || postIdentity,
            categoryId: postData?.categoryId || catId,
            category: postData?.category || { id: catId, slug: catSlug, name: catName },
            createdAt: postData?.createdAt || null,
            errorMessage: !response.ok() ? (body?.error?.json?.message || body?.error?.message || 'Post creation failed') : null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a user and post together via authenticated session
 * This ensures the post is associated with the user's userId
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options including prefix, frustration, categorySlug
 * @returns {Promise<Object>} - Returns { success, userId, username, postId, ... }
 */
async function createUserWithPost(page, options = {}) {
    try {
        const { prefix = 'postuser', frustration, categorySlug } = options;

        // Create user
        const userResult = await createTestUser(page, prefix);
        if (!userResult.success) {
            return { success: false, errorMessage: `User creation failed: ${userResult.errorMessage}` };
        }

        // Login the user to establish session
        const loginResponse = await page.request.post('/api/auth/login', {
            data: {
                username: userResult.username,
                password: 'TestPassword123!'
            }
        });

        if (!loginResponse.ok()) {
            return { success: false, errorMessage: 'Login failed after user creation' };
        }

        // Now create post - it should be associated with the logged-in user
        const postResult = await createPostForUser(page, {
            frustration: frustration,
            categorySlug: categorySlug
        });

        if (!postResult.success) {
            return {
                success: false,
                errorMessage: `Post creation failed: ${postResult.errorMessage}`,
                userId: userResult.userId,
                username: userResult.username
            };
        }

        return {
            success: true,
            userId: userResult.userId,
            username: userResult.username,
            postId: postResult.postId,
            frustration: postResult.frustration,
            category: postResult.category
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create multiple posts for a user with delay between them
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options including frustrations array, categorySlug
 * @returns {Promise<Object>} - Returns { success, userId, posts, ... }
 */
async function createUserWithMultiplePosts(page, options = {}) {
    try {
        const { prefix = 'multipost', frustrations = [], categorySlug } = options;

        // Create user
        const userResult = await createTestUser(page, prefix);
        if (!userResult.success) {
            return { success: false, errorMessage: `User creation failed: ${userResult.errorMessage}` };
        }

        // Login the user
        const loginResponse = await page.request.post('/api/auth/login', {
            data: {
                username: userResult.username,
                password: 'TestPassword123!'
            }
        });

        if (!loginResponse.ok()) {
            return { success: false, errorMessage: 'Login failed after user creation' };
        }

        // Create posts in order
        const posts = [];
        for (const frustration of frustrations) {
            const postResult = await createPostForUser(page, {
                frustration: frustration,
                categorySlug: categorySlug
            });

            if (!postResult.success) {
                return {
                    success: false,
                    errorMessage: `Post creation failed: ${postResult.errorMessage}`,
                    userId: userResult.userId,
                    posts: posts
                };
            }

            posts.push({
                postId: postResult.postId,
                frustration: postResult.frustration,
                createdAt: postResult.createdAt
            });
        }

        return {
            success: true,
            userId: userResult.userId,
            username: userResult.username,
            posts: posts
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get posts from result
 * @param {Object} result - Result from performFetchUserPostsAction
 * @returns {Array} - Array of posts or empty array
 */
function getPostsFromResult(result) {
    return result?.posts || [];
}

/**
 * Helper to get post count from result
 * @param {Object} result - Result from performFetchUserPostsAction
 * @returns {number} - Number of posts
 */
function getPostCountFromResult(result) {
    return result?.postCount ?? result?.posts?.length ?? 0;
}

/**
 * Helper to check if posts array is empty
 * @param {Object} result - Result from performFetchUserPostsAction
 * @returns {boolean} - True if empty
 */
function isPostsEmpty(result) {
    return result?.isEmpty === true || (result?.posts && result.posts.length === 0);
}

/**
 * Helper to get first post from result
 * @param {Object} result - Result from performFetchUserPostsAction
 * @returns {Object|null} - First post or null
 */
function getFirstPostFromResult(result) {
    return result?.firstPost || result?.posts?.[0] || null;
}

/**
 * Helper to get second post from result
 * @param {Object} result - Result from performFetchUserPostsAction
 * @returns {Object|null} - Second post or null
 */
function getSecondPostFromResult(result) {
    return result?.secondPost || result?.posts?.[1] || null;
}

/**
 * Helper to check if response indicates validation error
 * @param {Object} result - Result from performFetchUserPostsAction
 * @returns {boolean} - True if validation error occurred
 */
function isValidationError(result) {
    return result?.statusCode === 400 || result?.body?.error?.json?.data?.code === 'BAD_REQUEST';
}

/**
 * Helper to validate post has required fields
 * @param {Object} post - Post object to validate
 * @returns {boolean} - True if post has all required fields
 */
function postHasRequiredFields(post) {
    return post &&
           post.id !== undefined &&
           post.frustration !== undefined &&
           post.identity !== undefined &&
           post.category !== undefined;
}

/**
 * Helper to validate category has required fields
 * @param {Object} category - Category object to validate
 * @returns {boolean} - True if category has all required fields
 */
function categoryHasRequiredFields(category) {
    return category &&
           category.id !== undefined &&
           category.name !== undefined &&
           category.slug !== undefined;
}

module.exports = {
    performFetchUserPostsAction,
    createTestUser,
    generateUniqueUsername,
    getOrCreateCategory,
    createTestPost,
    createPostForUser,
    createUserWithPost,
    createUserWithMultiplePosts,
    getPostsFromResult,
    getPostCountFromResult,
    isPostsEmpty,
    getFirstPostFromResult,
    getSecondPostFromResult,
    isValidationError,
    postHasRequiredFields,
    categoryHasRequiredFields
};
