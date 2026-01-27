Feature: Generate Anonymous ID
  As an anonymous user
  I want to receive a unique anonymous ID
  So that I can create posts, comments, and votes without registration

  # NOTE: Anonymous ID is a UUID v4 used for session tracking and vote deduplication


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================

  Scenario: [API] Generate Anonymous ID - Success
    When the client sends GET request to "/api/posts/anonymous-id"
    Then the response status should be 200
    And the response body should contain "anonymousId"
    And the "anonymousId" should be a valid UUID v4 format

  Scenario: [API] Generate Anonymous ID - Unique Per Request
    When the client sends GET request to "/api/posts/anonymous-id"
    And the client sends another GET request to "/api/posts/anonymous-id"
    Then both responses should have status 200
    And each response should contain a different "anonymousId"

  Scenario: [API] Generate Anonymous ID - Response Structure
    When the client sends GET request to "/api/posts/anonymous-id"
    Then the response status should be 200
    And the response content-type should be "application/json"
    And the response body should only contain "anonymousId" field
