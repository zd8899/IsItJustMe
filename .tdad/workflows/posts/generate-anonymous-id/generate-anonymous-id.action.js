/**
 * Generate Anonymous Id Action
 *
 * Handles anonymous ID generation via API.
 * Returns a unique UUID v4 for anonymous users to track sessions and deduplicate votes.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing (default)
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, anonymousId, contentType }
 */
async function performGenerateAnonymousIdAction(page, context = {}) {
    try {
        const { mode = 'api' } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api' || !mode) {
            const response = await page.request.get('/api/posts/anonymous-id');

            const status = response.status();
            const contentType = response.headers()['content-type'] || '';
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
                anonymousId: body?.anonymousId || null,
                contentType: contentType,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Failed to generate anonymous ID') : null
            };
        }

        // No UI mode for this action - it's API only
        return { success: false, errorMessage: 'Only API mode is supported for this action' };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to get anonymous ID from action result
 * @param {Object} result - Result from performGenerateAnonymousIdAction
 * @returns {string|null} - Anonymous ID or null
 */
function getAnonymousId(result) {
    return result?.anonymousId || result?.body?.anonymousId || null;
}

/**
 * Helper to validate UUID v4 format
 * UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where x is any hex digit and y is 8, 9, a, or b
 * @param {string} id - String to validate
 * @returns {boolean} - True if valid UUID v4 format
 */
function isValidUuidV4(id) {
    if (!id || typeof id !== 'string') {
        return false;
    }
    // UUID v4 regex pattern
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Pattern.test(id);
}

module.exports = {
    performGenerateAnonymousIdAction,
    getAnonymousId,
    isValidUuidV4
};
