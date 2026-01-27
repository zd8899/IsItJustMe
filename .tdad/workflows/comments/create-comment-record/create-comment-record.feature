Feature: Create Comment Record
  As a user
  I want my validated comment to be saved to the database
  So that it becomes part of the post's discussion

  # NOTE: This feature handles database insertion after comment validation passes
  # Upstream: Validate Comment Input (comment content is 1-2000 characters)


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Create Comment Record Success for existing post
    Given the comment content has passed validation
    And a post exists with id "post-123"
    When the client sends POST request to "/api/comments" with postId "post-123" and content "This is my comment"
    Then the response status should be 201
    And the response body should contain "id"
    And the response body should contain "content"
    And the response body should contain "postId"
    And the response body should contain "createdAt"

  Scenario: [API] Create Comment Record Failure (Post not found)
    Given the comment content has passed validation
    And no post exists with id "non-existent-post"
    When the client sends POST request to "/api/comments" with postId "non-existent-post" and content "This is my comment"
    Then the response status should be 404
    And the response error should be "Post not found"

  Scenario: [API] Create Comment Record Success with authenticated user
    Given the comment content has passed validation
    And a post exists with id "post-123"
    And the user is authenticated with userId "user-456"
    When the client sends POST request to "/api/comments" with postId "post-123" and content "Authenticated user comment"
    Then the response status should be 201
    And the response body should contain "id"
    And the response body should contain "userId"

  Scenario: [API] Create Comment Record Success with anonymous user
    Given the comment content has passed validation
    And a post exists with id "post-123"
    And the user is anonymous with anonymousId "anon-789"
    When the client sends POST request to "/api/comments" with postId "post-123" and content "Anonymous user comment"
    Then the response status should be 201
    And the response body should contain "id"
    And the response body should contain "anonymousId"

  Scenario: [API] Create Reply Comment Record Success (nested comment)
    Given the comment content has passed validation
    And a post exists with id "post-123"
    And a comment exists with id "parent-comment-456" on post "post-123"
    When the client sends POST request to "/api/comments" with postId "post-123", parentId "parent-comment-456" and content "This is a reply"
    Then the response status should be 201
    And the response body should contain "id"
    And the response body should contain "parentId"

  Scenario: [API] Create Reply Comment Record Failure (Parent comment not found)
    Given the comment content has passed validation
    And a post exists with id "post-123"
    And no comment exists with id "non-existent-parent"
    When the client sends POST request to "/api/comments" with postId "post-123", parentId "non-existent-parent" and content "This is a reply"
    Then the response status should be 404
    And the response error should be "Parent comment not found"

  Scenario: [API] Create Comment Record increments post comment count
    Given the comment content has passed validation
    And a post exists with id "post-123" with commentCount 5
    When the client sends POST request to "/api/comments" with postId "post-123" and content "New comment"
    Then the response status should be 201
    And the post "post-123" commentCount should be 6

  Scenario: [API] Create Comment Record initializes vote counts to zero
    Given the comment content has passed validation
    And a post exists with id "post-123"
    When the client sends POST request to "/api/comments" with postId "post-123" and content "Fresh comment"
    Then the response status should be 201
    And the response body "upvotes" should be 0
    And the response body "downvotes" should be 0
    And the response body "score" should be 0
