Feature: Validate Username
  As a user registering for an account
  I want my username to be validated
  So that I can have a unique and properly formatted username

  # NOTE: Username rules - 3-20 chars, alphanumeric and underscores only, must be unique

  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Validate Username - Valid and Available
    When the client sends POST request to "/api/auth/validate-username" with username "testuser123"
    Then the response status should be 200
    And the response body should contain "valid" as true
    And the response body should contain "available" as true

  Scenario: [API] Validate Username - Too Short
    When the client sends POST request to "/api/auth/validate-username" with username "ab"
    Then the response status should be 400
    And the response error should be "Username must be at least 3 characters"

  Scenario: [API] Validate Username - Too Long
    When the client sends POST request to "/api/auth/validate-username" with username "thisusernameiswaytoolongtobevalid"
    Then the response status should be 400
    And the response error should be "Username must be at most 20 characters"

  Scenario: [API] Validate Username - Invalid Characters
    When the client sends POST request to "/api/auth/validate-username" with username "user@name!"
    Then the response status should be 400
    And the response error should be "Username can only contain letters, numbers, and underscores"

  Scenario: [API] Validate Username - Already Taken
    Given a user already exists with username "existinguser"
    When the client sends POST request to "/api/auth/validate-username" with username "existinguser"
    Then the response status should be 200
    And the response body should contain "valid" as true
    And the response body should contain "available" as false
    And the response body should contain "message" as "Username is already taken"

  Scenario: [API] Validate Username - Empty Username
    When the client sends POST request to "/api/auth/validate-username" with username ""
    Then the response status should be 400
    And the response error should be "Username is required"

  Scenario: [API] Validate Username - Whitespace Only
    When the client sends POST request to "/api/auth/validate-username" with username "   "
    Then the response status should be 400
    And the response error should be "Username is required"

  Scenario: [API] Validate Username - Starting with Underscore (Valid)
    When the client sends POST request to "/api/auth/validate-username" with username "_validuser"
    Then the response status should be 200
    And the response body should contain "valid" as true

  Scenario: [API] Validate Username - Case Insensitive Uniqueness Check
    Given a user already exists with username "TestUser"
    When the client sends POST request to "/api/auth/validate-username" with username "testuser"
    Then the response status should be 200
    And the response body should contain "available" as false
