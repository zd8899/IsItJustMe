/**
 * Fetch Post By Id Action
 *
 * Retrieves a single post from the database by its ID.
 * Supports API testing for fetching post details including category and vote information.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.postId - The post ID to fetch
 * @param {boolean} context.invalidFormat - If true, use an invalid ID format
 * @param {boolean} context.nonExistent - If true, use a non-existent but valid format ID
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, postId, ... }
 */
async function performFetchPostByIdAction(page, context = {}) {
    try {
        const { mode, postId, invalidFormat, nonExistent } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api') {
            let idToUse;

            if (invalidFormat) {
                // Use an obviously invalid ID format (not CUID)
                idToUse = 'invalid-id-!@#$%';
            } else if (nonExistent) {
                // Use a valid CUID format that doesn't exist
                idToUse = 'clxyz123nonexistent456';
            } else {
                idToUse = postId;
            }

            const response = await page.request.get(`/api/posts/${idToUse}`);

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
                postId: body?.id || null,
                frustration: body?.frustration || null,
                identity: body?.identity || null,
                categoryId: body?.categoryId || null,
                createdAt: body?.createdAt || null,
                category: body?.category || null,
                upvotes: body?.upvotes ?? null,
                downvotes: body?.downvotes ?? null,
                score: body?.score ?? null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Fetch failed') : null
            };
        }

        // ==========================================
        // Default/UI MODE - Not implemented for this action
        // ==========================================
        return { success: false, errorMessage: 'UI mode not implemented for this action' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create a test post for fetching
 * @param {Object} page - Playwright page object
 * @param {Object} options - Options for creating the post
 * @param {string} options.categoryId - Category ID (required)
 * @param {string} options.frustration - Custom frustration text (optional)
 * @param {string} options.identity - Custom identity text (optional)
 * @returns {Promise<Object>} - Returns { success, postId, frustration, identity, categoryId, errorMessage }
 */
async function createTestPost(page, options = {}) {
    try {
        const { categoryId, frustration, identity } = options;

        if (!categoryId) {
            return { success: false, errorMessage: 'categoryId is required to create a test post' };
        }

        const postData = {
            frustration: frustration || `Test frustration ${Date.now()}`,
            identity: identity || `TestUser_${Date.now()}`,
            categoryId: categoryId
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
            categoryId: body?.categoryId || categoryId,
            createdAt: body?.createdAt || null,
            errorMessage: !response.ok() ? (body?.error || body?.message || 'Post creation failed') : null
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get a valid category ID for creating test posts
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, categoryId, categoryName, categorySlug, errorMessage }
 */
async function getTestCategory(page) {
    try {
        const response = await page.request.get('/api/categories');

        if (!response.ok()) {
            return { success: false, errorMessage: 'Failed to fetch categories' };
        }

        const categories = await response.json();

        if (!Array.isArray(categories) || categories.length === 0) {
            return { success: false, errorMessage: 'No categories available' };
        }

        const category = categories[0];
        return {
            success: true,
            categoryId: category.id,
            categoryName: category.name,
            categorySlug: category.slug
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to extract post ID from fetch result
 * @param {Object} result - Result from performFetchPostByIdAction
 * @returns {string|null} - Post ID or null
 */
function getPostIdFromResult(result) {
    return result?.postId || result?.body?.id || null;
}

/**
 * Helper to extract category from fetch result
 * @param {Object} result - Result from performFetchPostByIdAction
 * @returns {Object|null} - Category object { id, name, slug } or null
 */
function getCategoryFromResult(result) {
    return result?.category || result?.body?.category || null;
}

/**
 * Helper to extract vote counts from fetch result
 * @param {Object} result - Result from performFetchPostByIdAction
 * @returns {Object} - Vote counts { upvotes, downvotes, score }
 */
function getVoteCountsFromResult(result) {
    return {
        upvotes: result?.upvotes ?? result?.body?.upvotes ?? null,
        downvotes: result?.downvotes ?? result?.body?.downvotes ?? null,
        score: result?.score ?? result?.body?.score ?? null
    };
}

/**
 * Helper to extract error from fetch result
 * @param {Object} result - Result from performFetchPostByIdAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.body?.error || result?.body?.message || null;
}

module.exports = {
    performFetchPostByIdAction,
    createTestPost,
    getTestCategory,
    getPostIdFromResult,
    getCategoryFromResult,
    getVoteCountsFromResult,
    getErrorFromResult
};
