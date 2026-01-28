Feature: Show Score Display
  As a user
  I want to see the current vote count on posts and comments
  So that I can gauge how much others relate to the content

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Score displays between vote arrows on post card
    Given the user is on the home page
    And there is at least one post in the feed
    Then the user should see the score displayed between the upvote and downvote arrows

  Scenario: [UI] Score displays positive value for upvoted post
    Given the user is on the home page
    And there is a post with more upvotes than downvotes
    Then the score should display a positive number

  Scenario: [UI] Score displays negative value for downvoted post
    Given the user is on the home page
    And there is a post with more downvotes than upvotes
    Then the score should display a negative number

  Scenario: [UI] Score displays zero for post with equal votes
    Given the user is on the home page
    And there is a post with equal upvotes and downvotes
    Then the score should display "0"

  Scenario: [UI] Score updates immediately after user upvotes
    Given the user is on the home page
    And there is a post with a score of "5"
    When the user clicks the upvote arrow on the post
    Then the score should display "6"

  Scenario: [UI] Score updates immediately after user downvotes
    Given the user is on the home page
    And there is a post with a score of "5"
    When the user clicks the downvote arrow on the post
    Then the score should display "4"

  Scenario: [UI] Score displays on post detail page
    Given the user is viewing a post detail page
    Then the user should see the score displayed between the upvote and downvote arrows

  Scenario: [UI] Score displays on comments
    Given the user is viewing a post detail page
    And the post has at least one comment
    Then the user should see the score displayed on the comment

  Scenario: [UI] Comment score updates after user votes
    Given the user is viewing a post detail page
    And there is a comment with a score of "3"
    When the user clicks the upvote arrow on the comment
    Then the comment score should display "4"
