Feature: Validate Post Input
  As a user
  I want the system to validate my post input
  So that I can only submit properly formatted posts

  # NOTE: Validation uses Zod schema for frustration and identity fields


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Post validation success with valid input
    Given a valid category exists
    When the client sends POST request to "/api/posts" with valid frustration and identity
    Then the response status should be 200
    And the response body should contain "id"
    And the response body should contain "frustration"
    And the response body should contain "identity"

  Scenario: [API] Post validation failure - empty frustration
    Given a valid category exists
    When the client sends POST request to "/api/posts" with empty frustration
    Then the response status should be 400
    And the response error should be "Please describe your frustration"

  Scenario: [API] Post validation failure - empty identity
    Given a valid category exists
    When the client sends POST request to "/api/posts" with empty identity
    Then the response status should be 400
    And the response error should be "Please describe who you are"

  Scenario: [API] Post validation failure - frustration too long
    Given a valid category exists
    When the client sends POST request to "/api/posts" with frustration exceeding 500 characters
    Then the response status should be 400
    And the response error should be "Frustration must be less than 500 characters"

  Scenario: [API] Post validation failure - identity too long
    Given a valid category exists
    When the client sends POST request to "/api/posts" with identity exceeding 100 characters
    Then the response status should be 400
    And the response error should be "Identity must be less than 100 characters"

  Scenario: [API] Post validation failure - missing category
    When the client sends POST request to "/api/posts" with valid frustration and identity but missing category
    Then the response status should be 400
    And the response error should be "Please select a category"
