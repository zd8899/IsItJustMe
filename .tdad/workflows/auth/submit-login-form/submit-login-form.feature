Feature: Submit Login Form
  As a returning user
  I want to submit my login credentials
  So that I can access my account and personalized features

  # NOTE: Consistent error message for security - "Invalid username or password"


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Login API Success
    Given a user exists with username "testuser" and password "Password123"
    When the client sends POST request to "/api/auth/login" with username "testuser" and password "Password123"
    Then the response status should be 200
    And the response body should contain "token"
    And the response body should contain "userId"
    And the response body should contain "username" as "testuser"

  Scenario: [API] Login API Failure - Invalid Password
    Given a user exists with username "testuser" and password "Password123"
    When the client sends POST request to "/api/auth/login" with username "testuser" and password "wrongpassword"
    Then the response status should be 401
    And the response error should be "Invalid username or password"

  Scenario: [API] Login API Failure - User Not Found
    Given no user exists with username "nonexistent"
    When the client sends POST request to "/api/auth/login" with username "nonexistent" and password "Password123"
    Then the response status should be 401
    And the response error should be "Invalid username or password"

  Scenario: [API] Login API Failure - Missing Username
    When the client sends POST request to "/api/auth/login" with password "Password123" only
    Then the response status should be 400
    And the response error should be "Username is required"

  Scenario: [API] Login API Failure - Missing Password
    When the client sends POST request to "/api/auth/login" with username "testuser" only
    Then the response status should be 400
    And the response error should be "Password is required"

  Scenario: [API] Login API Failure - Empty Body
    When the client sends POST request to "/api/auth/login" with empty body
    Then the response status should be 400
    And the response error should be "Username is required"


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Successful login flow
    Given a user exists with username "testuser" and password "Password123"
    And the user is on the login page
    When the user enters "testuser" in the "Username" field
    And the user enters "Password123" in the "Password" field
    And the user clicks the "Log In" button
    Then the user should be redirected to the home page
    And the user should see their username "testuser" in the header

  Scenario: [UI] Failed login - Invalid credentials
    Given a user exists with username "testuser" and password "Password123"
    And the user is on the login page
    When the user enters "testuser" in the "Username" field
    And the user enters "wrongpassword" in the "Password" field
    And the user clicks the "Log In" button
    Then the user should see error message "Invalid username or password"
    And the user should remain on the login page

  Scenario: [UI] Failed login - User does not exist
    Given no user exists with username "nonexistent"
    And the user is on the login page
    When the user enters "nonexistent" in the "Username" field
    And the user enters "Password123" in the "Password" field
    And the user clicks the "Log In" button
    Then the user should see error message "Invalid username or password"
    And the user should remain on the login page

  Scenario: [UI] Client-side validation - Empty username
    Given the user is on the login page
    When the user leaves the "Username" field empty
    And the user enters "Password123" in the "Password" field
    And the user clicks the "Log In" button
    Then the user should see validation error "Username is required"

  Scenario: [UI] Client-side validation - Empty password
    Given the user is on the login page
    When the user enters "testuser" in the "Username" field
    And the user leaves the "Password" field empty
    And the user clicks the "Log In" button
    Then the user should see validation error "Password is required"

