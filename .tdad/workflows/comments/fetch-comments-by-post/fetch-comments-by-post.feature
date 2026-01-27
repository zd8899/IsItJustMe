Feature: Fetch Comments By Post
  As a user
  I want to retrieve comments for a specific post
  So that I can read the discussion and responses

  # NOTE: Post ID uses CUID format (e.g., "clxyz123abc456")
  # NOTE: Comments support 2 levels of nesting (parent and replies)


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Fetch comments by post ID success
    Given a post exists with comments
    When the client sends GET request to "/api/comments?postId={id}" with a valid post ID
    Then the response status should be 200
    And the response body should contain an array of comments
    And each comment should contain "id"
    And each comment should contain "content"
    And each comment should contain "postId"
    And each comment should contain "createdAt"

  Scenario: [API] Fetch comments returns vote counts
    Given a post exists with comments that have votes
    When the client sends GET request to "/api/comments?postId={id}" with a valid post ID
    Then the response status should be 200
    And each comment should contain "upvotes"
    And each comment should contain "downvotes"
    And each comment should contain "score"

  Scenario: [API] Fetch comments returns nested replies
    Given a post exists with comments that have replies
    When the client sends GET request to "/api/comments?postId={id}" with a valid post ID
    Then the response status should be 200
    And the response should include parent comments
    And parent comments should contain their nested "replies"

  Scenario: [API] Fetch comments for post with no comments
    Given a post exists with no comments
    When the client sends GET request to "/api/comments?postId={id}" with a valid post ID
    Then the response status should be 200
    And the response body should contain an empty array

  Scenario: [API] Fetch comments failure - post not found
    Given no post exists with the specified ID
    When the client sends GET request to "/api/comments?postId={id}" with a non-existent post ID
    Then the response status should be 404
    And the response error should be "Post not found"

  Scenario: [API] Fetch comments failure - invalid post ID format
    When the client sends GET request to "/api/comments?postId={id}" with an invalid ID format
    Then the response status should be 400
    And the response error should be "Invalid post ID"

  Scenario: [API] Fetch comments failure - missing post ID parameter
    When the client sends GET request to "/api/comments" without postId parameter
    Then the response status should be 400
    And the response error should be "Post ID is required"
