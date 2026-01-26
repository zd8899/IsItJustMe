Feature: Show Register Form
  As a user
  I want to see a registration form
  So that I can create an account on the platform

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Display registration form with all required fields
    Given the user is on the home page
    When the user clicks the "Sign Up" link in the header
    Then the user should see the registration form
    And the user should see a "Username" input field
    And the user should see a "Password" input field
    And the user should see a "Create Account" button

  Scenario: [UI] Navigate directly to registration page
    Given the user navigates to the "/auth/register" page
    Then the user should see the registration form
    And the user should see a "Username" input field
    And the user should see a "Password" input field
    And the user should see a "Create Account" button

  Scenario: [UI] Form fields are empty by default
    Given the user is on the registration page
    Then the "Username" field should be empty
    And the "Password" field should be empty

  Scenario: [UI] Password field masks input
    Given the user is on the registration page
    When the user enters "secret123" in the "Password" field
    Then the password input should be masked

  Scenario: [UI] Display link to login page for existing users
    Given the user is on the registration page
    Then the user should see a link to the login page
