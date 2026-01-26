Feature: Create Session
  As an authenticated user
  I want to receive a JWT token after successful credential verification
  So that I can access protected resources without re-authenticating

  # NOTE: Session tokens are created only after successful credential verification


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Create Session - Success
    Given the credentials have been verified for userId "user123" and username "testuser"
    When the client sends POST request to "/api/auth/create-session" with userId "user123" and username "testuser"
    Then the response status should be 200
    And the response body should contain "token"
    And the response body should contain "expiresIn"
    And the response body should contain "userId" as "user123"
    And the response body should contain "username" as "testuser"

  Scenario: [API] Create Session - Missing UserId
    When the client sends POST request to "/api/auth/create-session" with username "testuser" only
    Then the response status should be 400
    And the response error should be "User ID is required"

  Scenario: [API] Create Session - Missing Username
    When the client sends POST request to "/api/auth/create-session" with userId "user123" only
    Then the response status should be 400
    And the response error should be "Username is required"

  Scenario: [API] Create Session - Empty Body
    When the client sends POST request to "/api/auth/create-session" with empty body
    Then the response status should be 400
    And the response error should be "User ID is required"

  Scenario: [API] Create Session - Invalid UserId Format
    When the client sends POST request to "/api/auth/create-session" with userId "" and username "testuser"
    Then the response status should be 400
    And the response error should be "User ID is required"

  Scenario: [API] Create Session - User Not Found
    Given no user exists with userId "nonexistent123"
    When the client sends POST request to "/api/auth/create-session" with userId "nonexistent123" and username "testuser"
    Then the response status should be 404
    And the response error should be "User not found"
