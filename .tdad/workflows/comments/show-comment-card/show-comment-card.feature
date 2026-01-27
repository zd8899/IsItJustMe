Feature: Show Comment Card
  As a user
  I want to see comment cards on the post detail page
  So that I can read community responses to posts

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Comment card displays all essential information
    Given a comment exists on a post
    When the user views the post detail page
    Then the user should see the comment card
    And the user should see the comment content text
    And the user should see the vote score
    And the user should see the author name
    And the user should see the comment date

  Scenario: [UI] Comment card shows vote buttons
    Given a comment exists on a post
    When the user views the post detail page
    Then the user should see the upvote button
    And the user should see the downvote button
    And the user should see the current score

  Scenario: [UI] Comment card shows anonymous author
    Given an anonymous comment exists on a post
    When the user views the post detail page
    Then the user should see "Anonymous" as the comment author

  Scenario: [UI] Comment card shows username for registered user comments
    Given a comment by a registered user exists on a post
    When the user views the post detail page
    Then the user should see the username as the comment author

  Scenario: [UI] Comment card shows reply button at first level
    Given a top-level comment exists on a post
    When the user views the post detail page
    Then the user should see the "Reply" button on the comment

  Scenario: [UI] Comment card hides reply button at maximum nesting depth
    Given a second-level reply exists on a post
    When the user views the post detail page
    Then the user should not see the "Reply" button on the nested reply

  Scenario: [UI] Comment card displays nested replies
    Given a comment with replies exists on a post
    When the user views the post detail page
    Then the user should see the parent comment
    And the user should see the nested replies indented below the parent

  Scenario: [UI] Clicking reply button shows reply form
    Given a top-level comment exists on a post
    When the user clicks the "Reply" button on the comment
    Then the user should see the reply form below the comment
