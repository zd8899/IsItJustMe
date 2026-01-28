Feature: Show Login Form
  As a user
  I want to see a login form
  So that I can access my existing account on the platform

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Display login form with all required fields
    Given the user is on the home page
    When the user clicks the "Sign In" link in the header
    Then the user should see the login form
    And the user should see a "Username" input field
    And the user should see a "Password" input field
    And the user should see a "Sign In" button

  Scenario: [UI] Navigate directly to login page
    Given the user navigates to the "/auth/login" page
    Then the user should see the login form
    And the user should see a "Username" input field
    And the user should see a "Password" input field
    And the user should see a "Sign In" button

  Scenario: [UI] Form fields are empty by default
    Given the user is on the login page
    Then the "Username" field should be empty
    And the "Password" field should be empty

  Scenario: [UI] Password field masks input
    Given the user is on the login page
    When the user enters "secret123" in the "Password" field
    Then the password input should be masked

  Scenario: [UI] Display link to registration page for new users
    Given the user is on the login page
    Then the user should see a link to the registration page
