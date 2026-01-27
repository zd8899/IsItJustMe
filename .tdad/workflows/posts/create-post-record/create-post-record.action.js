const { performValidatePostInputAction, getOrCreateTestCategory: getOrCreateTestCategoryFromValidation } = require('../validate-post-input/validate-post-input.action.js');
const { performGenerateAnonymousIdAction, getAnonymousId } = require('../generate-anonymous-id/generate-anonymous-id.action.js');
const { performCalculateHotScoreAction, calculateExpectedHotScore } = require('../calculate-hot-score/calculate-hot-score.action.js');

/**
 * Create Post Record Action
 *
 * Handles post creation API requests for inserting new posts into the database.
 * Supports anonymous and authenticated users with proper validation and rate limiting.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {string} context.frustration - Post frustration text
 * @param {string} context.identity - Post identity text
 * @param {string} context.categoryId - Category ID for the post
 * @param {string} context.anonymousId - Anonymous ID for anonymous users
 * @param {string} context.authToken - JWT token for authenticated users
 * @param {boolean} context.invalidCategoryId - If true, use a non-existent category ID
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, postId }
 */
async function performCreatePostRecordAction(page, context = {}) {
    try {
        const {
            mode,
            frustration,
            identity,
            categoryId,
            anonymousId,
            authToken,
            invalidCategoryId
        } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api' || !mode) {
            // Build request data
            const requestData = {
                frustration: frustration || `Test frustration ${Date.now()}`,
                identity: identity || `a test user ${Date.now()}`,
                categoryId: invalidCategoryId ? 'non-existent-category-id-12345' : categoryId
            };

            // Add anonymousId if provided
            if (anonymousId) {
                requestData.anonymousId = anonymousId;
            }

            // Build request options
            const requestOptions = {
                data: requestData
            };

            // Add auth header if token provided
            if (authToken) {
                requestOptions.headers = {
                    'Authorization': `Bearer ${authToken}`
                };
            }

            const response = await page.request.post('/api/posts', requestOptions);

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
                anonymousId: body?.anonymousId || null,
                userId: body?.userId || null,
                upvotes: body?.upvotes,
                downvotes: body?.downvotes,
                score: body?.score,
                commentCount: body?.commentCount,
                hotScore: body?.hotScore,
                createdAt: body?.createdAt || null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Post creation failed') : null
            };
        }

        // No UI mode for this action - it's API only
        return { success: false, errorMessage: 'Only API mode is supported for this action' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to create multiple posts for rate limiting tests
 * @param {Object} page - Playwright page object
 * @param {number} count - Number of posts to create
 * @param {Object} context - Context with categoryId, anonymousId, or authToken
 * @returns {Promise<Object>} - Returns { success, createdCount, lastError, lastStatusCode }
 */
async function createMultiplePosts(page, count, context = {}) {
    try {
        const { categoryId, anonymousId, authToken } = context;
        let createdCount = 0;
        let lastError = null;
        let lastStatusCode = null;

        for (let i = 0; i < count; i++) {
            const result = await performCreatePostRecordAction(page, {
                mode: 'api',
                frustration: `Rate limit test frustration ${Date.now()}_${i}`,
                identity: `a rate limit tester ${i}`,
                categoryId: categoryId,
                anonymousId: anonymousId,
                authToken: authToken
            });

            if (result.success) {
                createdCount++;
            } else {
                lastError = result.errorMessage;
                lastStatusCode = result.statusCode;
                break;
            }
        }

        return {
            success: true,
            createdCount: createdCount,
            lastError: lastError,
            lastStatusCode: lastStatusCode
        };
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
 * Helper to create a test user and get auth token
 * @param {Object} page - Playwright page object
 * @param {string} prefix - Prefix for username
 * @returns {Promise<Object>} - Returns { success, token, userId, username }
 */
async function createTestUserAndLogin(page, prefix = 'postuser') {
    try {
        const timestamp = Date.now().toString().slice(-6);
        const username = `${prefix}_${timestamp}`;
        const password = 'TestPassword123!';

        // Register user
        const registerResponse = await page.request.post('/api/auth/register', {
            data: { username, password }
        });

        if (!registerResponse.ok()) {
            const body = await registerResponse.json().catch(() => ({}));
            return { success: false, errorMessage: body?.error || 'Registration failed' };
        }

        // Login to get token
        const loginResponse = await page.request.post('/api/auth/login', {
            data: { username, password }
        });

        if (!loginResponse.ok()) {
            const body = await loginResponse.json().catch(() => ({}));
            return { success: false, errorMessage: body?.error || 'Login failed' };
        }

        const loginBody = await loginResponse.json();

        return {
            success: true,
            token: loginBody.token,
            userId: loginBody.userId,
            username: loginBody.username
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to extract post ID from action result
 * @param {Object} result - Result from performCreatePostRecordAction
 * @returns {string|null} - Post ID or null
 */
function getPostIdFromResult(result) {
    return result?.postId || result?.body?.id || null;
}

/**
 * Helper to extract error message from action result
 * @param {Object} result - Result from performCreatePostRecordAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.body?.error || result?.body?.message || null;
}

/**
 * Helper to validate CUID format
 * CUIDs are 25 characters starting with 'c'
 * @param {string} id - String to validate
 * @returns {boolean} - True if valid CUID format
 */
function isValidCuid(id) {
    if (!id || typeof id !== 'string') {
        return false;
    }
    // CUID pattern: starts with 'c', followed by 24 alphanumeric chars
    const cuidPattern = /^c[a-z0-9]{24}$/;
    return cuidPattern.test(id);
}

module.exports = {
    performCreatePostRecordAction,
    createMultiplePosts,
    getOrCreateTestCategory,
    createTestUserAndLogin,
    getPostIdFromResult,
    getErrorFromResult,
    isValidCuid,
    // Re-export dependency helpers for convenience
    performGenerateAnonymousIdAction,
    getAnonymousId,
    calculateExpectedHotScore
};
