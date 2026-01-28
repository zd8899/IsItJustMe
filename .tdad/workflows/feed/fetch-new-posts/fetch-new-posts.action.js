/**
 * Fetch New Posts Action
 *
 * Retrieves posts sorted by creation date (newest first) from the API.
 * Supports pagination, filtering by category, and various limit configurations.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {number} context.limit - Number of posts to fetch (1-50, default 20)
 * @param {string} context.cursor - Cursor for pagination
 * @param {string} context.categorySlug - Filter by category slug
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, posts, nextCursor }
 */
async function performFetchNewPostsAction(page, context = {}) {
    try {
        const { mode, limit, cursor, categorySlug } = context;

        // ==========================================
        // API MODE - Direct HTTP request via tRPC
        // ==========================================
        if (mode === 'api' || !mode) {
            // Build input parameters
            const inputParams = {};

            if (limit !== undefined) {
                inputParams.limit = limit;
            }

            if (cursor !== undefined) {
                inputParams.cursor = cursor;
            }

            if (categorySlug !== undefined) {
                inputParams.categorySlug = categorySlug;
            }

            // Build URL with encoded input parameter
            let url = '/api/trpc/post.listNew';
            if (Object.keys(inputParams).length > 0) {
                const encodedInput = encodeURIComponent(JSON.stringify({ json: inputParams }));
                url = `${url}?input=${encodedInput}`;
            }

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
                    errorMessage = body?.error?.json?.message || body?.error?.message || 'Fetch new posts failed';
                }
            }

            // Extract posts data from successful response
            // tRPC with superjson returns data in result.data.json format
            // API returns { posts: [...], nextCursor: string | null }
            const responseData = body?.result?.data?.json || body?.result?.data || {};
            const posts = Array.isArray(responseData) ? responseData : (responseData.posts || []);
            const nextCursor = responseData.nextCursor ?? null;

            return {
                success: response.ok(),
                statusCode: status,
                body: body,
                posts: Array.isArray(posts) ? posts : [],
                postCount: Array.isArray(posts) ? posts.length : 0,
                nextCursor: nextCursor,
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
 * Helper to get or create a valid category for testing
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, categoryId, categoryName, categorySlug }
 */
async function getOrCreateTestCategory(page) {
    try {
        // First try to get categories from REST API
        const categoriesResponse = await page.request.get('/api/categories');

        if (categoriesResponse.ok()) {
            const categories = await categoriesResponse.json();
            if (Array.isArray(categories) && categories.length > 0) {
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
                const category = categories[0];
                return {
                    success: true,
                    categoryId: category.id,
                    categoryName: category.name,
                    categorySlug: category.slug
                };
            }
        }

        return { success: false, errorMessage: 'No categories found' };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get a category by slug
 * @param {Object} page - Playwright page object
 * @param {string} slug - Category slug to find
 * @returns {Promise<Object>} - Returns { success, categoryId, categoryName, categorySlug }
 */
async function getCategoryBySlug(page, slug) {
    try {
        const categoriesResponse = await page.request.get('/api/categories');

        if (categoriesResponse.ok()) {
            const categories = await categoriesResponse.json();
            if (Array.isArray(categories)) {
                const category = categories.find(c => c.slug === slug);
                if (category) {
                    return {
                        success: true,
                        categoryId: category.id,
                        categoryName: category.name,
                        categorySlug: category.slug
                    };
                }
            }
        }

        return { success: false, errorMessage: `Category with slug "${slug}" not found` };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a test post for new posts tests
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options for creating the post
 * @param {string} options.categoryId - Category ID (required)
 * @param {string} options.frustration - Custom frustration text (optional)
 * @param {string} options.identity - Custom identity text (optional)
 * @returns {Promise<Object>} - Returns { success, postId, frustration, identity, categoryId, errorMessage }
 */
async function createTestPost(page, options = {}) {
    try {
        const { categoryId, frustration, identity, categorySlug } = options;

        let finalCategoryId = categoryId;

        // If categorySlug is provided instead of categoryId, find the category
        if (!finalCategoryId && categorySlug) {
            const catResult = await getCategoryBySlug(page, categorySlug);
            if (catResult.success) {
                finalCategoryId = catResult.categoryId;
            } else {
                return { success: false, errorMessage: catResult.errorMessage };
            }
        }

        // If still no categoryId, get any available category
        if (!finalCategoryId) {
            const catResult = await getOrCreateTestCategory(page);
            if (catResult.success) {
                finalCategoryId = catResult.categoryId;
            } else {
                return { success: false, errorMessage: 'No category available for creating test post' };
            }
        }

        const anonymousId = `anon_newpost_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const postData = {
            frustration: frustration || `Test frustration for new posts ${Date.now()}`,
            identity: identity || `a new posts tester`,
            categoryId: finalCategoryId,
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
            frustration: body?.frustration || postData.frustration,
            identity: body?.identity || postData.identity,
            categoryId: body?.categoryId || finalCategoryId,
            categorySlug: options.categorySlug || null,
            createdAt: body?.createdAt || null,
            errorMessage: !response.ok() ? (body?.error || body?.message || 'Post creation failed') : null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create multiple test posts with a delay to ensure different creation times
 * @param {Object} page - Playwright page object
 * @param {number} count - Number of posts to create
 * @param {Object} options - Options for creating posts
 * @returns {Promise<Object>} - Returns { success, posts, createdCount, errorMessage }
 */
async function createMultipleTestPosts(page, count, options = {}) {
    try {
        const posts = [];
        for (let i = 0; i < count; i++) {
            const result = await createTestPost(page, {
                ...options,
                frustration: options.frustration || `New post test frustration ${Date.now()}_${i}`,
                identity: options.identity || `tester ${i}`
            });

            if (result.success) {
                posts.push(result);
            } else {
                return {
                    success: false,
                    posts: posts,
                    createdCount: posts.length,
                    errorMessage: result.errorMessage
                };
            }
        }

        return {
            success: true,
            posts: posts,
            createdCount: posts.length
        };
    } catch (error) {
        return { success: false, posts: [], createdCount: 0, errorMessage: error.message };
    }
}

/**
 * Helper to extract posts from action result
 * @param {Object} result - Result from performFetchNewPostsAction
 * @returns {Array} - Array of posts
 */
function getPostsFromResult(result) {
    return result?.posts || result?.body?.result?.data?.json || [];
}

/**
 * Helper to extract post count from action result
 * @param {Object} result - Result from performFetchNewPostsAction
 * @returns {number} - Number of posts
 */
function getPostCountFromResult(result) {
    const posts = getPostsFromResult(result);
    return Array.isArray(posts) ? posts.length : 0;
}

/**
 * Helper to check if posts are sorted by creation date descending (newest first)
 * @param {Array} posts - Array of posts
 * @returns {boolean} - True if sorted correctly
 */
function arePostsSortedByCreatedAt(posts) {
    if (!Array.isArray(posts) || posts.length < 2) {
        return true;
    }

    for (let i = 0; i < posts.length - 1; i++) {
        const currentDate = new Date(posts[i].createdAt);
        const nextDate = new Date(posts[i + 1].createdAt);

        // createdAt should be descending (newer posts first)
        if (currentDate < nextDate) {
            return false;
        }
    }

    return true;
}

/**
 * Helper to check if all posts belong to a specific category
 * @param {Array} posts - Array of posts
 * @param {string} categorySlug - Expected category slug
 * @returns {boolean} - True if all posts belong to the category
 */
function allPostsBelongToCategory(posts, categorySlug) {
    if (!Array.isArray(posts) || posts.length === 0) {
        return true;
    }

    return posts.every(post => post.category?.slug === categorySlug);
}

/**
 * Helper to validate post has required fields
 * @param {Object} post - Post object
 * @returns {Object} - Returns { valid, missingFields }
 */
function validatePostFields(post) {
    const requiredFields = [
        'id',
        'frustration',
        'identity',
        'upvotes',
        'downvotes',
        'score',
        'commentCount',
        'createdAt',
        'category'
    ];

    const missingFields = [];

    for (const field of requiredFields) {
        if (post[field] === undefined) {
            missingFields.push(field);
        }
    }

    // Check category sub-fields
    if (post.category) {
        if (post.category.name === undefined) {
            missingFields.push('category.name');
        }
        if (post.category.slug === undefined) {
            missingFields.push('category.slug');
        }
    }

    return {
        valid: missingFields.length === 0,
        missingFields: missingFields
    };
}

/**
 * Helper to extract error message from action result
 * @param {Object} result - Result from performFetchNewPostsAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.body?.error?.json?.message || null;
}

/**
 * Helper to check if posts overlap between two pages
 * @param {Array} page1Posts - Posts from first page
 * @param {Array} page2Posts - Posts from second page
 * @returns {boolean} - True if there's no overlap
 */
function postsDoNotOverlap(page1Posts, page2Posts) {
    if (!Array.isArray(page1Posts) || !Array.isArray(page2Posts)) {
        return true;
    }

    const page1Ids = new Set(page1Posts.map(p => p.id));

    for (const post of page2Posts) {
        if (page1Ids.has(post.id)) {
            return false;
        }
    }

    return true;
}

/**
 * Helper to get the last post ID from a list (for cursor pagination)
 * @param {Array} posts - Array of posts
 * @returns {string|null} - Last post ID or null
 */
function getLastPostId(posts) {
    if (!Array.isArray(posts) || posts.length === 0) {
        return null;
    }
    return posts[posts.length - 1].id;
}

module.exports = {
    performFetchNewPostsAction,
    getOrCreateTestCategory,
    getCategoryBySlug,
    createTestPost,
    createMultipleTestPosts,
    getPostsFromResult,
    getPostCountFromResult,
    arePostsSortedByCreatedAt,
    allPostsBelongToCategory,
    validatePostFields,
    getErrorFromResult,
    postsDoNotOverlap,
    getLastPostId
};
