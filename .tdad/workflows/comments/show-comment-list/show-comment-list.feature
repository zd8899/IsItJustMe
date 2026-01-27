Feature: Show Comment List
  As a user
  I want to see a list of comments on a post
  So that I can read the full discussion thread

  # NOTE: Comments support 2 levels of nesting (parent and replies)
  # NOTE: Comments are rendered using Comment Card component


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Display comment list with multiple comments
    Given a post exists with multiple comments
    When the user views the post detail page
    Then the user should see the comment list section
    And the user should see all top-level comments displayed
    And each comment should be rendered as a comment card

  Scenario: [UI] Display nested comment thread structure
    Given a post exists with comments that have replies
    When the user views the post detail page
    Then the user should see parent comments at the top level
    And the user should see replies indented below their parent comments
    And the nested structure should not exceed 2 levels deep

  Scenario: [UI] Display empty state when no comments exist
    Given a post exists with no comments
    When the user views the post detail page
    Then the user should see "No comments yet" message
    And the user should see the comment form to add the first comment

  Scenario: [UI] Display loading state while fetching comments
    Given a post exists with comments
    When the user navigates to the post detail page
    Then the user should see a loading indicator while comments load
    And the loading indicator should disappear when comments are displayed

  Scenario: [UI] Display comment count in list header
    Given a post exists with 5 comments
    When the user views the post detail page
    Then the user should see the comment count displayed
    And the comment count should show "5 Comments"

  Scenario: [UI] Display singular comment count for single comment
    Given a post exists with 1 comment
    When the user views the post detail page
    Then the comment count should show "1 Comment"

  Scenario: [UI] Comments maintain thread context with multiple replies
    Given a parent comment exists with multiple replies
    When the user views the post detail page
    Then the user should see the parent comment
    And the user should see all replies grouped under the parent
    And each reply should be visually connected to its parent thread

  Scenario: [UI] Scroll to comments section from post
    Given a post exists with comments
    When the user clicks on the comments section link
    Then the page should scroll to the comment list section
    And the comment list should be visible in the viewport
