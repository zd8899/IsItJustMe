Feature: Show Post Card
  As a user
  I want to see post cards in the feed
  So that I can browse frustrations shared by the community

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Post card displays all essential information
    Given a post exists in the feed
    When the user views the feed
    Then the user should see the post card
    And the user should see the frustration text "Why is it so hard to [frustration]?"
    And the user should see the identity text "I am [identity]"
    And the user should see the category badge
    And the user should see the vote score
    And the user should see the comment count
    And the user should see the post date

  Scenario: [UI] Post card shows vote buttons
    Given a post exists in the feed
    When the user views the feed
    Then the user should see the upvote button
    And the user should see the downvote button
    And the user should see the current score

  Scenario: [UI] Post card shows anonymous author
    Given an anonymous post exists in the feed
    When the user views the feed
    Then the user should see "Anonymous" as the author

  Scenario: [UI] Post card shows username for registered user posts
    Given a post by a registered user exists in the feed
    When the user views the feed
    Then the user should see "by [username]" as the author

  Scenario: [UI] Post card is clickable and navigates to detail page
    Given a post exists in the feed
    When the user clicks on the post card
    Then the user should be redirected to the post detail page

  Scenario: [UI] Post card displays comment count correctly
    Given a post with comments exists in the feed
    When the user views the feed
    Then the user should see the comment count displayed as "[count] comments"
