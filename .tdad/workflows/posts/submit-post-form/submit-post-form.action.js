const { performShowPostFormAction } = require('../show-post-form/show-post-form.action.js');
const { performLoadCategoriesDropdownAction } = require('../load-categories-dropdown/load-categories-dropdown.action.js');
const { performCreatePostRecordAction, getOrCreateTestCategory, createTestUserAndLogin } = require('../create-post-record/create-post-record.action.js');
const { performGenerateAnonymousIdAction, getAnonymousId } = require('../generate-anonymous-id/generate-anonymous-id.action.js');

/**
 * Submit Post Form Action
 *
 * Handles post form submission via API and UI.
 * Supports both API testing (direct HTTP requests) and UI testing (browser interactions).
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.mode - 'api' for API testing, 'ui' for UI testing
 * @param {string} context.frustration - Frustration text to submit
 * @param {string} context.identity - Identity text to submit
 * @param {string} context.categoryId - Category ID for API mode
 * @param {string} context.categoryName - Category name for UI mode (to select from dropdown)
 * @param {string} context.anonymousId - Anonymous ID for anonymous posts
 * @param {string} context.authToken - JWT token for authenticated users
 * @param {boolean} context.emptyFrustration - If true, send empty frustration
 * @param {boolean} context.emptyIdentity - If true, send empty identity
 * @param {boolean} context.noCategory - If true, don't include categoryId
 * @param {boolean} context.invalidCategoryId - If true, use a non-existent category ID
 * @param {boolean} context.overMaxFrustration - If true, send frustration over 500 characters
 * @param {boolean} context.overMaxIdentity - If true, send identity over 100 characters
 * @param {boolean} context.simulateApiError - If true, intercept API to simulate error
 * @param {boolean} context.simulateRateLimit - If true, intercept API to simulate rate limit
 * @returns {Promise<Object>} - Returns { success, errorMessage, statusCode, body, postId, ... }
 */
async function performSubmitPostFormAction(page, context = {}) {
    try {
        const {
            mode,
            frustration,
            identity,
            categoryId,
            categoryName,
            anonymousId,
            authToken,
            emptyFrustration,
            emptyIdentity,
            noCategory,
            invalidCategoryId,
            overMaxFrustration,
            overMaxIdentity,
            simulateApiError,
            simulateRateLimit
        } = context;

        // ==========================================
        // API MODE - Direct HTTP request
        // ==========================================
        if (mode === 'api') {
            // Build request data
            const requestData = {};

            // Handle frustration
            if (overMaxFrustration) {
                requestData.frustration = 'x'.repeat(501);
            } else if (emptyFrustration) {
                requestData.frustration = '';
            } else if (frustration !== undefined) {
                requestData.frustration = frustration;
            }

            // Handle identity
            if (overMaxIdentity) {
                requestData.identity = 'y'.repeat(101);
            } else if (emptyIdentity) {
                requestData.identity = '';
            } else if (identity !== undefined) {
                requestData.identity = identity;
            }

            // Handle category
            if (!noCategory) {
                if (invalidCategoryId) {
                    requestData.categoryId = 'non-existent-category-id-12345';
                } else if (categoryId !== undefined) {
                    requestData.categoryId = categoryId;
                }
            }

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
                createdAt: body?.createdAt || null,
                errorMessage: !response.ok() ? (body?.error || body?.message || 'Post submission failed') : null
            };
        }

        // ==========================================
        // UI MODE - Browser interaction
        // ==========================================

        // Set up API interception if needed (before filling form)
        if (simulateApiError) {
            await page.route('**/api/posts', async (route) => {
                if (route.request().method() === 'POST') {
                    await route.fulfill({
                        status: 500,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Internal server error' })
                    });
                } else {
                    await route.continue();
                }
            });
        }

        if (simulateRateLimit) {
            await page.route('**/api/posts', async (route) => {
                if (route.request().method() === 'POST') {
                    await route.fulfill({
                        status: 429,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' })
                    });
                } else {
                    await route.continue();
                }
            });
        }

        // Get form elements
        const frustrationInput = page.getByPlaceholder("e.g., get a good night's sleep");
        const identityInput = page.getByPlaceholder('e.g., a new parent');
        const categoryDropdown = page.getByTestId('category-select');
        const askButton = page.getByRole('button', { name: /ask/i });

        // Wait for form to be ready
        await frustrationInput.waitFor({ state: 'visible', timeout: 5000 });

        // Fill frustration field
        if (!emptyFrustration && frustration !== undefined) {
            if (overMaxFrustration) {
                await frustrationInput.fill('x'.repeat(501));
            } else {
                await frustrationInput.fill(frustration);
            }
        }

        // Fill identity field
        if (!emptyIdentity && identity !== undefined) {
            if (overMaxIdentity) {
                await identityInput.fill('y'.repeat(101));
            } else {
                await identityInput.fill(identity);
            }
        }

        // Select category if provided
        if (!noCategory && categoryName) {
            await categoryDropdown.selectOption({ label: categoryName });
        }

        // Click submit button
        await askButton.click();

        // Error detection with Promise.race
        const errorLocator = page.locator('.text-red-500, [role="alert"].bg-red-50');
        const successLocator = page.getByText(/posted|success|shared/i);

        // Also watch for the post appearing in the feed
        const feedPostLocator = frustration ? page.locator(`text=${frustration}`).first() : null;

        const racePromises = [
            // Error: error message appears
            errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
        ];

        // Success indicators
        racePromises.push(
            successLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' }))
        );

        if (feedPostLocator) {
            racePromises.push(
                feedPostLocator.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' }))
            );
        }

        const outcome = await Promise.race(racePromises).catch(() => ({ type: 'timeout' }));

        // Clean up routes
        if (simulateApiError) {
            await page.unroute('**/api/posts');
        }
        if (simulateRateLimit) {
            await page.unroute('**/api/posts');
        }

        if (outcome.type === 'error') {
            const msg = await errorLocator.first().textContent();
            return {
                success: false,
                errorMessage: msg?.trim() || 'Unknown error',
                formPreserved: true
            };
        }

        if (outcome.type === 'timeout') {
            // Check if error message is visible
            const errorVisible = await errorLocator.first().isVisible().catch(() => false);
            if (errorVisible) {
                const msg = await errorLocator.first().textContent();
                return {
                    success: false,
                    errorMessage: msg?.trim() || 'Unknown error',
                    formPreserved: true
                };
            }
            return { success: false, errorMessage: 'Timeout waiting for submission result' };
        }

        // Wait for page to stabilize
        await page.waitForLoadState('domcontentloaded');

        // Check if form was cleared (indicates success)
        const frustrationValue = await frustrationInput.inputValue().catch(() => '');
        const identityValue = await identityInput.inputValue().catch(() => '');
        const categoryValue = await categoryDropdown.inputValue().catch(() => '');

        const formCleared = frustrationValue === '' && identityValue === '' && categoryValue === '';

        return {
            success: true,
            formCleared: formCleared,
            frustrationCleared: frustrationValue === '',
            identityCleared: identityValue === '',
            categoryCleared: categoryValue === ''
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to check loading state during form submission
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Context with frustration, identity, categoryName
 * @returns {Promise<Object>} - Returns { success, buttonDisabled, buttonShowsLoading, fieldsDisabled }
 */
async function checkLoadingStateDuringSubmission(page, context = {}) {
    try {
        const { frustration, identity, categoryName } = context;

        // Get form elements
        const frustrationInput = page.getByPlaceholder("e.g., get a good night's sleep");
        const identityInput = page.getByPlaceholder('e.g., a new parent');
        const categoryDropdown = page.getByTestId('category-select');
        const askButton = page.getByRole('button', { name: /ask/i });

        await frustrationInput.waitFor({ state: 'visible', timeout: 5000 });

        // Fill form
        await frustrationInput.fill(frustration || `test frustration ${Date.now()}`);
        await identityInput.fill(identity || 'a tester');
        if (categoryName) {
            await categoryDropdown.selectOption({ label: categoryName });
        }

        // Set up variables to capture loading state
        let buttonDisabled = false;
        let buttonShowsLoading = false;
        let fieldsDisabled = false;

        // Intercept the API to add a delay, giving us time to observe loading state
        await page.route('**/api/posts', async (route) => {
            if (route.request().method() === 'POST') {
                await new Promise(resolve => setTimeout(resolve, 500));
                await route.continue();
            } else {
                await route.continue();
            }
        });

        // Click the button - don't await completion
        askButton.click();

        // Wait a bit for React to update, then check for loading indicators
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if button shows loading state (aria-busy or disabled)
        const ariaBusy = await askButton.getAttribute('aria-busy').catch(() => null);
        buttonShowsLoading = ariaBusy === 'true';
        buttonDisabled = await askButton.isDisabled().catch(() => false);

        // Check if form fields are disabled
        const frustrationDisabled = await frustrationInput.isDisabled().catch(() => false);
        const identityDisabled = await identityInput.isDisabled().catch(() => false);
        const categoryDisabled = await categoryDropdown.isDisabled().catch(() => false);
        fieldsDisabled = frustrationDisabled || identityDisabled || categoryDisabled;

        // Wait for submission to complete
        const errorLocator = page.locator('.text-red-500');
        const successLocator = page.getByText(/posted|success|shared/i);
        await Promise.race([
            successLocator.first().waitFor({ state: 'visible', timeout: 10000 }),
            errorLocator.first().waitFor({ state: 'visible', timeout: 10000 })
        ]).catch(() => null);

        // Clean up route
        await page.unroute('**/api/posts');

        return {
            success: true,
            buttonDisabled: buttonDisabled,
            buttonShowsLoading: buttonShowsLoading || buttonDisabled,
            fieldsDisabled: fieldsDisabled
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to verify form is cleared after successful submission
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, frustrationEmpty, identityEmpty, categoryShowsPlaceholder }
 */
async function verifyFormCleared(page) {
    try {
        const frustrationInput = page.getByPlaceholder("e.g., get a good night's sleep");
        const identityInput = page.getByPlaceholder('e.g., a new parent');
        const categoryDropdown = page.getByTestId('category-select');

        await frustrationInput.waitFor({ state: 'visible', timeout: 5000 });

        const frustrationValue = await frustrationInput.inputValue();
        const identityValue = await identityInput.inputValue();
        const categoryValue = await categoryDropdown.inputValue();

        return {
            success: true,
            frustrationEmpty: frustrationValue === '',
            identityEmpty: identityValue === '',
            categoryShowsPlaceholder: categoryValue === ''
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Helper to verify post appears in feed after submission
 *
 * @param {Object} page - Playwright page object
 * @param {string} frustration - The frustration text to look for in the feed
 * @returns {Promise<Object>} - Returns { success, postVisible }
 */
async function verifyPostInFeed(page, frustration) {
    try {
        // Look for the post in the feed
        const postInFeed = page.locator(`text=${frustration}`).first();

        await postInFeed.waitFor({ state: 'visible', timeout: 5000 });
        const visible = await postInFeed.isVisible();

        return {
            success: true,
            postVisible: visible
        };

    } catch (error) {
        return { success: false, errorMessage: error.message, postVisible: false };
    }
}

/**
 * Helper to create multiple posts for rate limiting tests
 * @param {Object} page - Playwright page object
 * @param {number} count - Number of posts to create
 * @param {Object} context - Context with categoryId, anonymousId, or authToken
 * @returns {Promise<Object>} - Returns { success, createdCount, lastError, lastStatusCode }
 */
async function createMultiplePostsForRateLimit(page, count, context = {}) {
    try {
        const { categoryId, anonymousId, authToken } = context;
        let createdCount = 0;
        let lastError = null;
        let lastStatusCode = null;

        for (let i = 0; i < count; i++) {
            const result = await performSubmitPostFormAction(page, {
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
 * Helper to get post ID from action result
 * @param {Object} result - Result from performSubmitPostFormAction
 * @returns {string|null} - Post ID or null
 */
function getPostIdFromResult(result) {
    return result?.postId || result?.body?.id || null;
}

/**
 * Helper to get error message from action result
 * @param {Object} result - Result from performSubmitPostFormAction
 * @returns {string|null} - Error message or null
 */
function getErrorFromResult(result) {
    return result?.errorMessage || result?.body?.error || result?.body?.message || null;
}

module.exports = {
    performSubmitPostFormAction,
    checkLoadingStateDuringSubmission,
    verifyFormCleared,
    verifyPostInFeed,
    createMultiplePostsForRateLimit,
    getPostIdFromResult,
    getErrorFromResult,
    // Re-export dependency helpers for convenience
    performShowPostFormAction,
    performLoadCategoriesDropdownAction,
    performCreatePostRecordAction,
    getOrCreateTestCategory,
    createTestUserAndLogin,
    performGenerateAnonymousIdAction,
    getAnonymousId
};
