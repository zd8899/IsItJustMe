Feature: Show Post Detail
  As a user
  I want to view the full details of a post
  So that I can read the complete frustration and see all comments

  # NOTE: Post detail page URL format: /post/{id}
  # NOTE: Post ID uses CUID format (e.g., "clxyz123abc456")


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Display post detail page with all content
    Given a post exists in the system
    When the user navigates to the post detail page
    Then the user should see the frustration text "Why is it so hard to..."
    And the user should see the identity text "I am..."
    And the user should see the category name
    And the user should see the post creation date

  Scenario: [UI] Display vote counts on post detail
    Given a post exists with votes
    When the user navigates to the post detail page
    Then the user should see the upvote count
    And the user should see the downvote count
    And the user should see the vote score

  Scenario: [UI] Display comments section on post detail
    Given a post exists with comments
    When the user navigates to the post detail page
    Then the user should see the comments section
    And the user should see the comment count
    And the user should see the list of comments

  Scenario: [UI] Display nested comments
    Given a post exists with nested comments
    When the user navigates to the post detail page
    Then the user should see parent comments
    And the user should see reply comments indented under their parent

  Scenario: [UI] Display post detail loading state
    Given the user is on the application
    When the user navigates to a post detail page
    Then the user should see a loading indicator while the post is being fetched

  Scenario: [UI] Display post not found error
    Given no post exists with the specified ID
    When the user navigates to the post detail page with a non-existent ID
    Then the user should see the error message "Post not found"

  Scenario: [UI] Display invalid post ID error
    When the user navigates to a post detail page with an invalid ID format
    Then the user should see the error message "Invalid post ID"

  Scenario: [UI] Display empty comments state
    Given a post exists with no comments
    When the user navigates to the post detail page
    Then the user should see the message "No comments yet"
    And the user should see the comment form

  Scenario: [UI] Navigate back to feed from post detail
    Given the user is viewing a post detail page
    When the user clicks the back navigation
    Then the user should be redirected to the feed page
