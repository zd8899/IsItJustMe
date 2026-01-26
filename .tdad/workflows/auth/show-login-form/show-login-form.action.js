/**
 * Show Login Form Action
 *
 * Navigates to the login form and verifies all required elements are present.
 *
 * @param {Object} page - Playwright page object
 * @param {Object} context - Test context and dependencies
 * @param {string} context.navigationType - 'header' to click Sign In link, 'direct' to navigate to /auth/login
 * @returns {Promise<Object>} - Returns { success, errorMessage, formElements }
 */
async function performShowLoginFormAction(page, context = {}) {
    try {
        const { navigationType = 'direct' } = context;

        if (navigationType === 'header') {
            // Navigate via home page -> Sign In link
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            // Click the Sign In / Log In link in the header
            const signInLink = page.getByRole('link', { name: /sign\s*in|log\s*in/i });

            const errorLocator = page.getByRole('alert');
            const outcome = await Promise.race([
                signInLink.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'found' })),
                errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
            ]).catch(() => ({ type: 'timeout' }));

            if (outcome.type === 'error') {
                const msg = await errorLocator.textContent();
                return { success: false, errorMessage: msg };
            }
            if (outcome.type === 'timeout') {
                return { success: false, errorMessage: 'Sign In / Log In link not found in header' };
            }

            await signInLink.click();
            await page.waitForLoadState('domcontentloaded');
        } else {
            // Navigate directly to login page
            await page.goto('/auth/login');
            await page.waitForLoadState('domcontentloaded');
        }

        // Verify form elements are present
        const usernameField = page.getByLabel(/username/i);
        const passwordField = page.getByLabel(/password/i);
        const loginButton = page.getByRole('button', { name: /sign\s*in|log\s*in/i });

        // Check for errors first
        const errorLocator = page.getByRole('alert');
        const formOutcome = await Promise.race([
            usernameField.waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'success' })),
            errorLocator.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'error' }))
        ]).catch(() => ({ type: 'timeout' }));

        if (formOutcome.type === 'error') {
            const msg = await errorLocator.textContent();
            return { success: false, errorMessage: msg };
        }
        if (formOutcome.type === 'timeout') {
            return { success: false, errorMessage: 'Login form not found or Username field not visible' };
        }

        // Verify all required elements exist
        const passwordVisible = await passwordField.isVisible().catch(() => false);
        const buttonVisible = await loginButton.isVisible().catch(() => false);

        if (!passwordVisible) {
            return { success: false, errorMessage: 'Password field not visible' };
        }
        if (!buttonVisible) {
            return { success: false, errorMessage: 'Log In / Sign In button not visible' };
        }

        return {
            success: true,
            formElements: {
                hasUsernameField: true,
                hasPasswordField: passwordVisible,
                hasLoginButton: buttonVisible
            }
        };

    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Navigate to login page action
 * Helper action that only navigates to the login page
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage }
 */
async function navigateToLoginPage(page) {
    try {
        await page.goto('/auth/login');
        await page.waitForLoadState('domcontentloaded');
        return { success: true };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Fill password field action
 * Helper action to fill the password field for testing masking
 *
 * @param {Object} page - Playwright page object
 * @param {string} password - Password to enter
 * @returns {Promise<Object>} - Returns { success, errorMessage, inputType }
 */
async function fillLoginPasswordField(page, password) {
    try {
        const passwordField = page.getByLabel(/password/i);
        await passwordField.waitFor({ state: 'visible', timeout: 5000 });
        await passwordField.fill(password);

        // Get the input type to verify it's a password field (masked)
        const inputType = await passwordField.getAttribute('type');

        return {
            success: true,
            inputType: inputType
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

/**
 * Check if registration link exists on login page
 *
 * @param {Object} page - Playwright page object
 * @returns {Promise<Object>} - Returns { success, errorMessage, hasRegisterLink }
 */
async function checkRegisterLinkExists(page) {
    try {
        // Look for a link that mentions registration or create account
        const registerLink = page.getByRole('link', { name: /sign\s*up|register|create/i });

        const outcome = await Promise.race([
            registerLink.first().waitFor({ state: 'visible', timeout: 5000 }).then(() => ({ type: 'found' })),
        ]).catch(() => ({ type: 'timeout' }));

        if (outcome.type === 'timeout') {
            return { success: true, hasRegisterLink: false };
        }

        return {
            success: true,
            hasRegisterLink: true
        };
    } catch (error) {
        return { success: false, errorMessage: error.message };
    }
}

module.exports = {
    performShowLoginFormAction,
    navigateToLoginPage,
    fillLoginPasswordField,
    checkRegisterLinkExists
};
