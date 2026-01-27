Feature: Submit Comment Form
  As a user
  I want to submit comments on posts
  So that I can engage with the community and share my thoughts

  # NOTE: Anonymous users can comment. Rate limiting applies per IP (10/hour anonymous, 50/hour registered)
  # Upstream: Show Comment Form (user sees comment textarea and "Reply" button)
  # Downstream: Update Comment Count (comment count incremented on success)


  # ==========================================
  # API SCENARIOS (API Request & Response)
  # ==========================================
  Scenario: [API] Submit comment successfully
    Given a post exists with id "post-123"
    When the client sends POST request to "/api/comments" with postId "post-123" and content "This is my comment"
    Then the response status should be 201
    And the response body should contain "id"
    And the response body should contain "content"
    And the response body "content" should be "This is my comment"

  Scenario: [API] Submit reply to existing comment
    Given a post exists with id "post-123"
    And a comment exists with id "comment-456" on post "post-123"
    When the client sends POST request to "/api/comments" with postId "post-123", parentId "comment-456" and content "This is a reply"
    Then the response status should be 201
    And the response body "parentId" should be "comment-456"

  Scenario: [API] Submit comment with empty content
    Given a post exists with id "post-123"
    When the client sends POST request to "/api/comments" with postId "post-123" and content ""
    Then the response status should be 400
    And the response error should be "Comment is required"

  Scenario: [API] Submit comment with content too short
    Given a post exists with id "post-123"
    When the client sends POST request to "/api/comments" with postId "post-123" and content "ab"
    Then the response status should be 400
    And the response error should be "Comment must be at least 3 characters"

  Scenario: [API] Submit comment with content too long
    Given a post exists with id "post-123"
    When the client sends POST request to "/api/comments" with postId "post-123" and content exceeding 2000 characters
    Then the response status should be 400
    And the response error should be "Comment must be less than 2000 characters"

  Scenario: [API] Submit comment to non-existent post
    Given no post exists with id "nonexistent-post"
    When the client sends POST request to "/api/comments" with postId "nonexistent-post" and content "My comment"
    Then the response status should be 404
    And the response error should be "Post not found"

  Scenario: [API] Submit reply to non-existent parent comment
    Given a post exists with id "post-123"
    And no comment exists with id "nonexistent-comment"
    When the client sends POST request to "/api/comments" with postId "post-123", parentId "nonexistent-comment" and content "My reply"
    Then the response status should be 404
    And the response error should be "Parent comment not found"

  Scenario: [API] Comment response includes voting fields initialized to zero
    Given a post exists with id "post-123"
    When the client sends POST request to "/api/comments" with postId "post-123" and content "New comment"
    Then the response status should be 201
    And the response body "upvotes" should be 0
    And the response body "downvotes" should be 0
    And the response body "score" should be 0


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Submit comment successfully
    Given the user is on the post detail page
    When the user types "This is my comment" in the comment textarea
    And the user clicks the "Reply" button
    Then the user should see the comment "This is my comment" in the comment list
    And the comment textarea should be empty

  Scenario: [UI] Submit comment shows loading state
    Given the user is on the post detail page
    When the user types "My comment" in the comment textarea
    And the user clicks the "Reply" button
    Then the "Reply" button should show loading state

  Scenario: [UI] Submit empty comment shows validation error
    Given the user is on the post detail page
    When the user clicks the "Reply" button without entering text
    Then the user should see error message "Comment is required"

  Scenario: [UI] Submit comment with content too short shows validation error
    Given the user is on the post detail page
    When the user types "ab" in the comment textarea
    And the user clicks the "Reply" button
    Then the user should see error message "Comment must be at least 3 characters"

  Scenario: [UI] Comment count updates after successful submission
    Given the user is on the post detail page
    And the post shows comment count of 5
    When the user types "New comment" in the comment textarea
    And the user clicks the "Reply" button
    Then the post should show comment count of 6

  Scenario: [UI] Reply to existing comment
    Given the user is on the post detail page
    And the user sees a comment with "Reply" option
    When the user clicks the reply button on the comment
    And the user types "This is a reply" in the reply textarea
    And the user clicks the "Reply" button
    Then the user should see the reply "This is a reply" under the parent comment

  Scenario: [UI] Anonymous user can submit comment
    Given the user is not logged in
    And the user is on the post detail page
    When the user types "Anonymous comment" in the comment textarea
    And the user clicks the "Reply" button
    Then the user should see the comment "Anonymous comment" in the comment list
