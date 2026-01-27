/**
 * Validate Post Input Action
 *
 * Handles post creation API requests with various validation scenarios.
 * Tests the Zod validation schema for frustration, identity, and categoryId fields.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.frustration - Post frustration text
 * @param {string} context.identity - Post identity text
 * @param {string} context.categoryId - Category ID for the post
 * @param {boolean} context.emptyFrustration - If true, send empty frustration
 * @param {boolean} context.emptyIdentity - If true, send empty identity
 * @param {boolean} context.longFrustration - If true, send frustration > 500 chars
 * @param {boolean} context.longIdentity - If true, send identity > 100 chars
 * @param {boolean} context.missingCategory - If true, omit categoryId
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body }
 */
async function performValidatePostInputAction(page, context = {}) {
    try {
        const {
            mode,
            frustration,
            identity,
            categoryId,
            emptyFrustration,
            emptyIdentity,
            longFrustration,
            longIdentity,
            missingCategory
        } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api') {
            let requestData = {};

            // Build request data based on scenario
            if (emptyFrustration) {
                requestData = {
                    frustration: '',
                    identity: identity || `User_${Date.now()}`,
                    categoryId: categoryId
                };
            } else if (emptyIdentity) {
                requestData = {
                    frustration: frustration || `Test frustration ${Date.now()}`,
                    identity: '',
                    categoryId: categoryId
                };
            } else if (longFrustration) {
                // Generate string > 500 characters
                requestData = {
                    frustration: 'x'.repeat(501),
                    identity: identity || `User_${Date.now()}`,
                    categoryId: categoryId
                };
            } else if (longIdentity) {
                // Generate string > 100 characters
                requestData = {
                    frustration: frustration || `Test frustration ${Date.now()}`,
                    identity: 'x'.repeat(101),
                    categoryId: categoryId
                };
            } else if (missingCategory) {
                requestData = {
                    frustration: frustration || `Test frustration ${Date.now()}`,
                    identity: identity || `User_${Date.now()}`
                    // categoryId intentionally omitted
                };
            } else {
                // Valid input scenario
                requestData = {
                    frustration: frustration || `Test frustration ${Date.now()}`,
                    identity: identity || `User_${Date.now()}`,
                    categoryId: categoryId
                };
            }

            const response = await page.request.post('/api/posts', {
                data: requestData
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
                postId: body?.id || null,
                frustration: body?.frustration || null,
                identity: body?.identity || null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Post creation failed') : null
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
 * Helper to get or create a valid category for testing
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, categoryId, categoryName, categorySlug }
 */
async function getOrCreateTestCategory(page) {
    try {
        // First try to get existing categories via tRPC
        const listResponse = await page.request.get('/api/trpc/category.list');

        if (listResponse.ok()) {
            const listData = await listResponse.json();
            // tRPC with superjson returns data in result.data.json format
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

        // If no categories exist, create one via tRPC
        const uniqueSlug = `test-category-${Date.now()}`;
        const createResponse = await page.request.post('/api/trpc/category.create', {
            data: {
                json: {
                    name: `Test Category ${Date.now()}`,
                    slug: uniqueSlug
                }
            }
        });

        if (createResponse.ok()) {
            const createData = await createResponse.json();
            // tRPC with superjson returns data in result.data.json format
            const category = createData?.result?.data?.json || createData?.result?.data || createData;
            return {
                success: true,
                categoryId: category.id,
                categoryName: category.name,
                categorySlug: category.slug
            };
        }

        return { success: false, errorMessage: 'Failed to get or create test category' };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to extract post ID from action result
 * @param {Object} result - Result from performValidatePostInputAction
 * @returns {string|null} - Post ID or null
 */
function getPostIdFromResult(result) {
    return result?.postId || result?.body?.id || null;
}

/**
 * Helper to extract error message from action result
 * @param {Object} result - Result from performValidatePostInputAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.body?.error || result?.body?.message || null;
}

module.exports = {
    performValidatePostInputAction,
    getOrCreateTestCategory,
    getPostIdFromResult,
    getErrorFromResult
};
