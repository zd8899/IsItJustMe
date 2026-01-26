Feature: Submit Register Form
  As a user
  I want to submit the registration form
  So that I can create an account and access member features

  # NOTE: Form submission handles validation, API call, and user feedback
  # Error messages must match upstream Create User Record API responses


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Submit registration with valid credentials
    Given the username "newuser123" is valid and available
    When the client sends POST request to "/api/auth/register" with username "newuser123" and password "SecurePass123!"
    Then the response status should be 201
    And the response body should contain "id"
    And the response body should contain "username" as "newuser123"

  Scenario: [API] Submit registration with username already taken
    Given a user already exists with username "existinguser"
    When the client sends POST request to "/api/auth/register" with username "existinguser" and password "ValidPass123!"
    Then the response status should be 409
    And the response error should be "Username is already taken"

  Scenario: [API] Submit registration with username too short
    When the client sends POST request to "/api/auth/register" with username "ab" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username must be at least 3 characters"

  Scenario: [API] Submit registration with username too long
    When the client sends POST request to "/api/auth/register" with username "thisusernameiswaytoolongtobevalid" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username must be at most 20 characters"

  Scenario: [API] Submit registration with invalid username characters
    When the client sends POST request to "/api/auth/register" with username "user@name!" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username can only contain letters, numbers, and underscores"

  Scenario: [API] Submit registration with missing username
    When the client sends POST request to "/api/auth/register" with username "" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username is required"

  Scenario: [API] Submit registration with missing password
    When the client sends POST request to "/api/auth/register" with username "validuser" and password ""
    Then the response status should be 400
    And the response error should be "Password is required"


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Successful registration redirects to home page
    Given the user is on the registration page
    And the user has entered "newuser123" in the "Username" field
    And the user has entered "SecurePass123!" in the "Password" field
    When the user clicks the "Create Account" button
    Then the user should be redirected to the home page
    And the user should see their username "newuser123" in the header

  Scenario: [UI] Display loading state during form submission
    Given the user is on the registration page
    And the user has entered "newuser123" in the "Username" field
    And the user has entered "SecurePass123!" in the "Password" field
    When the user clicks the "Create Account" button
    Then the "Create Account" button should be disabled
    And the user should see a loading indicator

  Scenario: [UI] Display error message when username is already taken
    Given the user is on the registration page
    And a user already exists with username "existinguser"
    When the user enters "existinguser" in the "Username" field
    And the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username is already taken"

  Scenario: [UI] Display validation error for short username
    Given the user is on the registration page
    When the user enters "ab" in the "Username" field
    And the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username must be at least 3 characters"

  Scenario: [UI] Display validation error for long username
    Given the user is on the registration page
    When the user enters "thisusernameiswaytoolongtobevalid" in the "Username" field
    And the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username must be at most 20 characters"

  Scenario: [UI] Display validation error for invalid username characters
    Given the user is on the registration page
    When the user enters "user@name!" in the "Username" field
    And the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username can only contain letters, numbers, and underscores"

  Scenario: [UI] Display error when username field is empty on submit
    Given the user is on the registration page
    When the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username is required"

  Scenario: [UI] Display error when password field is empty on submit
    Given the user is on the registration page
    When the user enters "validuser" in the "Username" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Password is required"

  Scenario: [UI] Form fields retain values after validation error
    Given the user is on the registration page
    When the user enters "ab" in the "Username" field
    And the user enters "ValidPass123!" in the "Password" field
    And the user clicks the "Create Account" button
    Then the user should see error message "Username must be at least 3 characters"
    And the "Username" field should contain "ab"
