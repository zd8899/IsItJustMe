Feature: Show User Menu
  As a user
  I want to see a user menu in the header
  So that I can access authentication options and my profile

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  # --- Unauthenticated User Scenarios ---

  Scenario: [UI] Display authentication options for unauthenticated user
    Given the user is not logged in
    When the user visits the home page
    Then the user should see a "Sign In" link in the header
    And the user should see a "Sign Up" link in the header

  Scenario: [UI] Sign In link navigates to login page
    Given the user is not logged in
    And the user is on the home page
    When the user clicks the "Sign In" link in the header
    Then the user should be navigated to the "/auth/login" page

  Scenario: [UI] Sign Up link navigates to registration page
    Given the user is not logged in
    And the user is on the home page
    When the user clicks the "Sign Up" link in the header
    Then the user should be navigated to the "/auth/register" page

  # --- Authenticated User Scenarios ---

  Scenario: [UI] Display user menu for authenticated user
    Given the user is logged in with username "testuser"
    When the user visits the home page
    Then the user should see "testuser" displayed in the header
    And the user should see a "Sign Out" button in the header
    And the user should not see the "Sign In" link
    And the user should not see the "Sign Up" link

  Scenario: [UI] Username link navigates to profile page
    Given the user is logged in with username "testuser"
    And the user is on the home page
    When the user clicks on their username in the header
    Then the user should be navigated to the "/profile" page

  Scenario: [UI] Sign Out button logs out the user
    Given the user is logged in with username "testuser"
    And the user is on the home page
    When the user clicks the "Sign Out" button
    Then the user should see a "Sign In" link in the header
    And the user should see a "Sign Up" link in the header
    And the user should not see "testuser" in the header

  # --- Edge Cases ---

  Scenario: [UI] User menu persists across page navigation
    Given the user is logged in with username "testuser"
    And the user is on the home page
    When the user navigates to a post detail page
    Then the user should still see "testuser" displayed in the header
    And the user should still see a "Sign Out" button in the header
