Feature: Update Comment Count
  As a user
  I want the post comment count to be incremented when a comment is created
  So that I can see how many comments a post has received

  # NOTE: This feature handles incrementing the post's commentCount after a comment is successfully inserted
  # Upstream: Create Comment Record (comment successfully created with 201 response)


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Comment count increments by 1 for new top-level comment
    Given a post exists with id "post-123" with commentCount 0
    When the client sends POST request to "/api/comments" with postId "post-123" and content "First comment"
    Then the response status should be 201
    And the post "post-123" commentCount should be 1

  Scenario: [API] Comment count increments by 1 for reply comment
    Given a post exists with id "post-123" with commentCount 5
    And a comment exists with id "parent-comment-456" on post "post-123"
    When the client sends POST request to "/api/comments" with postId "post-123", parentId "parent-comment-456" and content "This is a reply"
    Then the response status should be 201
    And the post "post-123" commentCount should be 6

  Scenario: [API] Comment count accumulates correctly with multiple comments
    Given a post exists with id "post-123" with commentCount 10
    When the client sends POST request to "/api/comments" with postId "post-123" and content "Comment eleven"
    Then the response status should be 201
    And the post "post-123" commentCount should be 11
    When the client sends POST request to "/api/comments" with postId "post-123" and content "Comment twelve"
    Then the response status should be 201
    And the post "post-123" commentCount should be 12

  Scenario: [API] Comment count is reflected when fetching post details
    Given a post exists with id "post-123" with commentCount 3
    When the client sends POST request to "/api/comments" with postId "post-123" and content "New comment"
    Then the response status should be 201
    When the client sends GET request to "/api/posts/post-123"
    Then the response status should be 200
    And the response body "commentCount" should be 4

  Scenario: [API] Comment count only updates for the target post
    Given a post exists with id "post-123" with commentCount 5
    And a post exists with id "post-456" with commentCount 10
    When the client sends POST request to "/api/comments" with postId "post-123" and content "Comment on first post"
    Then the response status should be 201
    And the post "post-123" commentCount should be 6
    And the post "post-456" commentCount should be 10
