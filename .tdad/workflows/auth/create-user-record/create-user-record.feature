Feature: Create User Record
  As a user registering for an account
  I want my account to be created in the database
  So that I can log in and track my activity

  # NOTE: User record creation after validation passes
  # Username must be valid and available, password must be hashed

  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Create User Record Success
    Given the username "newuser123" is valid and available
    And the password "SecurePass123!" has been hashed
    When the client sends POST request to "/api/auth/register" with username "newuser123" and password "SecurePass123!"
    Then the response status should be 201
    And the response body should contain "id"
    And the response body should contain "username" as "newuser123"
    And the response body should contain "karma" as 0
    And the response body should not contain "passwordHash"

  Scenario: [API] Create User Record - Username Already Taken
    Given a user already exists with username "existinguser"
    When the client sends POST request to "/api/auth/register" with username "existinguser" and password "ValidPass123!"
    Then the response status should be 409
    And the response error should be "Username is already taken"

  Scenario: [API] Create User Record - Invalid Username Format
    When the client sends POST request to "/api/auth/register" with username "ab" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username must be at least 3 characters"

  Scenario: [API] Create User Record - Username Too Long
    When the client sends POST request to "/api/auth/register" with username "thisusernameiswaytoolongtobevalid" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username must be at most 20 characters"

  Scenario: [API] Create User Record - Username Invalid Characters
    When the client sends POST request to "/api/auth/register" with username "user@name!" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username can only contain letters, numbers, and underscores"

  Scenario: [API] Create User Record - Missing Username
    When the client sends POST request to "/api/auth/register" with username "" and password "ValidPass123!"
    Then the response status should be 400
    And the response error should be "Username is required"

  Scenario: [API] Create User Record - Missing Password
    When the client sends POST request to "/api/auth/register" with username "validuser" and password ""
    Then the response status should be 400
    And the response error should be "Password is required"

  Scenario: [API] Create User Record - Password Stored as Hash
    Given the username "hashtest" is valid and available
    When the client sends POST request to "/api/auth/register" with username "hashtest" and password "TestPassword123!"
    Then the response status should be 201
    And the user record in database should have a passwordHash starting with "$2b$" or "$2a$"
    And the passwordHash should not equal "TestPassword123!"

  Scenario: [API] Create User Record - Case Insensitive Username Uniqueness
    Given a user already exists with username "TestUser"
    When the client sends POST request to "/api/auth/register" with username "testuser" and password "ValidPass123!"
    Then the response status should be 409
    And the response error should be "Username is already taken"

  Scenario: [API] Create User Record - Default Karma Value
    Given the username "karmatest" is valid and available
    When the client sends POST request to "/api/auth/register" with username "karmatest" and password "ValidPass123!"
    Then the response status should be 201
    And the user record should have karma value of 0

  Scenario: [API] Create User Record - Timestamps Set
    Given the username "timetest" is valid and available
    When the client sends POST request to "/api/auth/register" with username "timetest" and password "ValidPass123!"
    Then the response status should be 201
    And the user record should have createdAt timestamp
    And the user record should have updatedAt timestamp
