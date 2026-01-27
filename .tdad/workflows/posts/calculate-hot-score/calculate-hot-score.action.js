/**
 * Calculate Hot Score Action
 *
 * Handles hot score calculation API requests for posts.
 * Hot score formula: sign * log10(max(|score|, 1)) + seconds_since_epoch / 45000
 * where score = upvotes - downvotes, epoch = 2024-01-01
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing
 * @param {number} context.upvotes - Number of upvotes
 * @param {number} context.downvotes - Number of downvotes
 * @param {string} context.createdAt - ISO date string for post creation time
 * @param {boolean} context.omitUpvotes - If true, omit upvotes field
 * @param {boolean} context.omitDownvotes - If true, omit downvotes field
 * @param {boolean} context.omitCreatedAt - If true, omit createdAt field
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, hotScore }
 */
async function performCalculateHotScoreAction(page, context = {}) {
    try {
        const {
            mode,
            upvotes,
            downvotes,
            createdAt,
            omitUpvotes,
            omitDownvotes,
            omitCreatedAt
        } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api') {
            let requestData = {};

            // Build request data based on scenario
            if (omitUpvotes) {
                requestData = {
                    downvotes: downvotes !== undefined ? downvotes : 0,
                    createdAt: createdAt || new Date().toISOString()
                };
            } else if (omitDownvotes) {
                requestData = {
                    upvotes: upvotes !== undefined ? upvotes : 0,
                    createdAt: createdAt || new Date().toISOString()
                };
            } else if (omitCreatedAt) {
                requestData = {
                    upvotes: upvotes !== undefined ? upvotes : 0,
                    downvotes: downvotes !== undefined ? downvotes : 0
                };
            } else {
                // Standard request with all fields
                requestData = {
                    upvotes: upvotes !== undefined ? upvotes : 0,
                    downvotes: downvotes !== undefined ? downvotes : 0,
                    createdAt: createdAt || new Date().toISOString()
                };
            }

            const response = await page.request.post('/api/posts/calculate-hot-score', {
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
                hotScore: body?.hotScore !== undefined ? body.hotScore : null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Hot score calculation failed') : null
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
 * Helper to calculate expected hot score locally for verification
 * @param {number} upvotes - Number of upvotes
 * @param {number} downvotes - Number of downvotes
 * @param {Date|string} createdAt - Post creation time
 * @returns {number} - Calculated hot score
 */
function calculateExpectedHotScore(upvotes, downvotes, createdAt) {
    const score = upvotes - downvotes;
    const order = Math.log10(Math.max(Math.abs(score), 1));
    const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
    const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    const epoch = new Date('2024-01-01').getTime();
    const seconds = (createdDate.getTime() - epoch) / 1000;
    return sign * order + seconds / 45000;
}

/**
 * Helper to get the vote component of the hot score (without time factor)
 * @param {number} upvotes - Number of upvotes
 * @param {number} downvotes - Number of downvotes
 * @returns {number} - Vote component of hot score
 */
function getVoteComponent(upvotes, downvotes) {
    const score = upvotes - downvotes;
    const order = Math.log10(Math.max(Math.abs(score), 1));
    const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
    return sign * order;
}

/**
 * Helper to extract hot score from action result
 * @param {Object} result - Result from performCalculateHotScoreAction
 * @returns {number|null} - Hot score or null
 */
function getHotScoreFromResult(result) {
    return result?.hotScore !== undefined ? result.hotScore : (result?.body?.hotScore !== undefined ? result.body.hotScore : null);
}

/**
 * Helper to extract error message from action result
 * @param {Object} result - Result from performCalculateHotScoreAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.body?.error || result?.body?.message || null;
}

module.exports = {
    performCalculateHotScoreAction,
    calculateExpectedHotScore,
    getVoteComponent,
    getHotScoreFromResult,
    getErrorFromResult
};
