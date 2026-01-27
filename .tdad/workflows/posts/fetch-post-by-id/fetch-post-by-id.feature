Feature: Fetch Post By ID
  As a user
  I want to retrieve a single post by its ID
  So that I can view the full post details and comments

  # NOTE: Post ID uses CUID format (e.g., "clxyz123abc456")


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Fetch post by ID success
    Given a post exists in the database
    When the client sends GET request to "/api/posts/{id}" with a valid post ID
    Then the response status should be 200
    And the response body should contain "id"
    And the response body should contain "frustration"
    And the response body should contain "identity"
    And the response body should contain "categoryId"
    And the response body should contain "createdAt"

  Scenario: [API] Fetch post by ID returns post with category details
    Given a post exists in the database with a category
    When the client sends GET request to "/api/posts/{id}" with a valid post ID
    Then the response status should be 200
    And the response body should contain category "name"
    And the response body should contain category "slug"

  Scenario: [API] Fetch post by ID returns vote counts
    Given a post exists in the database with votes
    When the client sends GET request to "/api/posts/{id}" with a valid post ID
    Then the response status should be 200
    And the response body should contain "upvotes"
    And the response body should contain "downvotes"
    And the response body should contain "score"

  Scenario: [API] Fetch post by ID failure - post not found
    Given no post exists with the specified ID
    When the client sends GET request to "/api/posts/{id}" with a non-existent post ID
    Then the response status should be 404
    And the response error should be "Post not found"

  Scenario: [API] Fetch post by ID failure - invalid ID format
    When the client sends GET request to "/api/posts/{id}" with an invalid ID format
    Then the response status should be 400
    And the response error should be "Invalid post ID"
