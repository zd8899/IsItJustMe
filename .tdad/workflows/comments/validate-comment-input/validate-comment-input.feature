Feature: Validate Comment Input
  As a user
  I want to receive validation feedback on my comment input
  So that I can submit properly formatted comments

  # NOTE: Comment content must be 1-2000 characters


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Create Comment API Success with valid content
    Given a post exists in the system
    When the client sends POST request to "/api/comments" with content "This is a valid comment"
    Then the response status should be 201
    And the response body should contain "id"
    And the response body should contain "content"

  Scenario: [API] Create Comment API Failure (Empty content)
    Given a post exists in the system
    When the client sends POST request to "/api/comments" with empty content
    Then the response status should be 400
    And the response error should be "Comment cannot be empty"

  Scenario: [API] Create Comment API Failure (Content exceeds maximum length)
    Given a post exists in the system
    When the client sends POST request to "/api/comments" with content exceeding 2000 characters
    Then the response status should be 400
    And the response error should be "Comment must be less than 2000 characters"

  Scenario: [API] Create Comment API Success with minimum valid content
    Given a post exists in the system
    When the client sends POST request to "/api/comments" with content "X"
    Then the response status should be 201
    And the response body should contain "id"

  Scenario: [API] Create Comment API Success with maximum valid content
    Given a post exists in the system
    When the client sends POST request to "/api/comments" with content of exactly 2000 characters
    Then the response status should be 201
    And the response body should contain "id"
