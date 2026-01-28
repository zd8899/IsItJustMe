Feature: Show Vote Buttons
  As a user
  I want to see upvote and downvote buttons on posts and comments
  So that I can express whether I relate to the content

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Vote buttons displayed on post card in feed
    Given the user is on the home page
    And there is at least one post in the feed
    Then the user should see an upvote arrow button on the post card
    And the user should see a downvote arrow button on the post card
    And the user should see the vote count between the arrows

  Scenario: [UI] Vote buttons displayed on post detail page
    Given the user is viewing a post detail page
    Then the user should see an upvote arrow button on the post
    And the user should see a downvote arrow button on the post
    And the user should see the vote count between the arrows

  Scenario: [UI] Vote buttons displayed on comments
    Given the user is viewing a post detail page
    And the post has at least one comment
    Then the user should see an upvote arrow button on the comment
    And the user should see a downvote arrow button on the comment
    And the user should see the vote count on the comment

  Scenario: [UI] Vote buttons show neutral state by default
    Given the user is on the home page
    And there is at least one post in the feed
    And the user has not voted on the post
    Then the upvote arrow should be in neutral state
    And the downvote arrow should be in neutral state

  Scenario: [UI] Vote count displays zero for new post
    Given the user is on the home page
    And there is a post with no votes
    Then the vote count should display "0"
