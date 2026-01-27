Feature: Create Post Record
  As a user
  I want to insert a new post into the database
  So that my frustration is saved and visible to the community

  # NOTE: Post creation requires validated input, anonymous ID (if anonymous), and calculates hot score


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Create post as anonymous user - success
    Given a valid category exists
    And the post input has been validated successfully
    And an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with valid frustration, identity, category, and anonymousId
    Then the response status should be 200
    And the response body should contain "id"
    And the response body should contain "frustration"
    And the response body should contain "identity"
    And the response body should contain "categoryId"
    And the response body should contain "anonymousId"
    And the response body should contain "createdAt"

  Scenario: [API] Create post as logged-in user - success
    Given a valid category exists
    And the post input has been validated successfully
    And a user is authenticated with a valid token
    When the client sends POST request to "/api/posts" with valid frustration, identity, category, and auth token
    Then the response status should be 200
    And the response body should contain "id"
    And the response body should contain "userId"
    And the response body "anonymousId" should be null

  Scenario: [API] Created post has correct default values
    Given a valid category exists
    And the post input has been validated successfully
    And an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with valid frustration, identity, category, and anonymousId
    Then the response status should be 200
    And the response body "upvotes" should be 0
    And the response body "downvotes" should be 0
    And the response body "score" should be 0
    And the response body "commentCount" should be 0

  Scenario: [API] Created post includes calculated hot score
    Given a valid category exists
    And the post input has been validated successfully
    And an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with valid frustration, identity, category, and anonymousId
    Then the response status should be 200
    And the response body should contain "hotScore"
    And the hot score should be based on creation time

  Scenario: [API] Create post with invalid category ID
    Given the post input has been validated successfully
    And an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with a non-existent category ID
    Then the response status should be 400
    And the response error should be "Category not found"

  Scenario: [API] Anonymous user rate limited after 5 posts per hour
    Given a valid category exists
    And the post input has been validated successfully
    And an anonymous user has already created 5 posts within the last hour
    When the client sends POST request to "/api/posts" with valid data
    Then the response status should be 429
    And the response error should be "Rate limit exceeded. Please try again later."

  Scenario: [API] Logged-in user rate limited after 20 posts per hour
    Given a valid category exists
    And the post input has been validated successfully
    And a user is authenticated with a valid token
    And the user has already created 20 posts within the last hour
    When the client sends POST request to "/api/posts" with valid data and auth token
    Then the response status should be 429
    And the response error should be "Rate limit exceeded. Please try again later."

  Scenario: [API] Post creation returns complete post object
    Given a valid category exists
    And the post input has been validated successfully
    And an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with frustration "find parking downtown" and identity "a commuter"
    Then the response status should be 200
    And the response body "frustration" should be "find parking downtown"
    And the response body "identity" should be "a commuter"
    And the response body should contain a valid CUID "id"

  Scenario: [API] Post creation stores category relationship
    Given a category exists with id "cat-123" and name "Daily Life"
    And the post input has been validated successfully
    And an anonymous ID has been generated
    When the client sends POST request to "/api/posts" with categoryId "cat-123"
    Then the response status should be 200
    And the response body "categoryId" should be "cat-123"
