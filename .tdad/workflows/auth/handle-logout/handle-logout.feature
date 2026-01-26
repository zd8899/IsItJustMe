Feature: Handle Logout
  As a user
  I want to log out of my account
  So that I can end my session and protect my account

  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Logout API Success
    Given the user is authenticated with a valid session
    When the client sends POST request to "/api/auth/signout"
    Then the response status should be 200
    And the session should be invalidated
    And the session cookie should be cleared

  Scenario: [API] Logout API when not authenticated
    Given the user is not authenticated
    When the client sends POST request to "/api/auth/signout"
    Then the response status should be 200
    And no session changes should occur

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Successful logout from header menu
    Given the user is logged in with username "testuser"
    And the user is on the home page
    When the user clicks the "Sign Out" button
    Then the user should be redirected to the home page
    And the user should see a "Sign In" link in the header
    And the user should see a "Sign Up" link in the header
    And the user should not see "testuser" in the header

  Scenario: [UI] Logout clears user session across tabs
    Given the user is logged in with username "testuser"
    And the user is on the home page
    When the user clicks the "Sign Out" button
    And the user refreshes the page
    Then the user should see a "Sign In" link in the header
    And the user should not see "testuser" in the header

  Scenario: [UI] Logout from profile page redirects to home
    Given the user is logged in with username "testuser"
    And the user is on the "/profile" page
    When the user clicks the "Sign Out" button
    Then the user should be redirected to the home page
    And the user should see a "Sign In" link in the header

  # --- Edge Cases ---

  Scenario: [UI] Session persists correctly before logout
    Given the user is logged in with username "testuser"
    And the user is on the home page
    When the user navigates to a post detail page
    Then the user should still see "testuser" displayed in the header
    And the user should still see a "Sign Out" button in the header

  Scenario: [UI] Logout button not visible for unauthenticated user
    Given the user is not logged in
    When the user visits the home page
    Then the user should not see a "Sign Out" button in the header
    And the user should see a "Sign In" link in the header
    And the user should see a "Sign Up" link in the header
