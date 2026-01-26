Feature: Verify Credentials
  As a user
  I want to verify my username and password
  So that I can securely log in to my account

  # NOTE: Consistent error message for security - prevents username enumeration


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Verify Credentials - Valid Username and Password
    Given a user exists with username "testuser" and password "SecurePass123!"
    When the client sends POST request to "/api/auth/verify-credentials" with username "testuser" and password "SecurePass123!"
    Then the response status should be 200
    And the response body should contain "valid" as true
    And the response body should contain "userId"
    And the response body should contain "username" as "testuser"

  Scenario: [API] Verify Credentials - User Not Found
    Given no user exists with username "nonexistent"
    When the client sends POST request to "/api/auth/verify-credentials" with username "nonexistent" and password "AnyPassword123"
    Then the response status should be 401
    And the response error should be "Invalid username or password"

  Scenario: [API] Verify Credentials - Wrong Password
    Given a user exists with username "testuser" and password "CorrectPass123!"
    When the client sends POST request to "/api/auth/verify-credentials" with username "testuser" and password "WrongPassword456"
    Then the response status should be 401
    And the response error should be "Invalid username or password"

  Scenario: [API] Verify Credentials - Empty Username
    When the client sends POST request to "/api/auth/verify-credentials" with username "" and password "SomePassword123"
    Then the response status should be 400
    And the response error should be "Username is required"

  Scenario: [API] Verify Credentials - Empty Password
    When the client sends POST request to "/api/auth/verify-credentials" with username "testuser" and password ""
    Then the response status should be 400
    And the response error should be "Password is required"

  Scenario: [API] Verify Credentials - Missing Both Fields
    When the client sends POST request to "/api/auth/verify-credentials" with empty body
    Then the response status should be 400
    And the response error should be "Username is required"

  Scenario: [API] Verify Credentials - Case Sensitive Password
    Given a user exists with username "testuser" and password "CaseSensitive123"
    When the client sends POST request to "/api/auth/verify-credentials" with username "testuser" and password "casesensitive123"
    Then the response status should be 401
    And the response error should be "Invalid username or password"

  Scenario: [API] Verify Credentials - Case Insensitive Username
    Given a user exists with username "TestUser" and password "MyPassword123!"
    When the client sends POST request to "/api/auth/verify-credentials" with username "testuser" and password "MyPassword123!"
    Then the response status should be 200
    And the response body should contain "valid" as true
