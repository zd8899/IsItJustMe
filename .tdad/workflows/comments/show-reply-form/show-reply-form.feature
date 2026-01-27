Feature: Show Reply Form
  As a user
  I want to see a reply form under a comment
  So that I can respond to other users' comments

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Reply form appears when clicking Reply button
    Given a top-level comment exists on a post
    And the user views the post detail page
    When the user clicks the "Reply" button on the comment
    Then the user should see the reply form below the comment
    And the user should see a text area for entering the reply
    And the user should see a "Post Reply" button
    And the user should see a "Cancel" button

  Scenario: [UI] Reply form has focus on text area when opened
    Given a top-level comment exists on a post
    And the user views the post detail page
    When the user clicks the "Reply" button on the comment
    Then the reply text area should be focused

  Scenario: [UI] Reply form closes when clicking Cancel
    Given a top-level comment exists on a post
    And the user views the post detail page
    And the user clicks the "Reply" button on the comment
    When the user clicks the "Cancel" button
    Then the reply form should not be visible
    And the "Reply" button should be visible on the comment

  Scenario: [UI] Only one reply form is open at a time
    Given multiple top-level comments exist on a post
    And the user views the post detail page
    And the user clicks the "Reply" button on the first comment
    When the user clicks the "Reply" button on the second comment
    Then the reply form should be visible below the second comment
    And the reply form should not be visible below the first comment

  Scenario: [UI] Reply form shows validation error for empty content
    Given a top-level comment exists on a post
    And the user views the post detail page
    And the user clicks the "Reply" button on the comment
    When the user clicks the "Post Reply" button without entering text
    Then the user should see an error message "Comment is required"

  Scenario: [UI] Reply form shows validation error for content too short
    Given a top-level comment exists on a post
    And the user views the post detail page
    And the user clicks the "Reply" button on the comment
    When the user enters "ab" in the reply text area
    And the user clicks the "Post Reply" button
    Then the user should see an error message "Comment must be at least 3 characters"

  Scenario: [UI] Reply form shows loading state during submission
    Given a top-level comment exists on a post
    And the user views the post detail page
    And the user clicks the "Reply" button on the comment
    And the user enters "This is my reply to your comment" in the reply text area
    When the user clicks the "Post Reply" button
    Then the "Post Reply" button should be disabled
    And the user should see a loading indicator

  Scenario: [UI] Reply form closes after successful submission
    Given a top-level comment exists on a post
    And the user views the post detail page
    And the user clicks the "Reply" button on the comment
    And the user enters "This is my reply to your comment" in the reply text area
    When the user clicks the "Post Reply" button
    And the reply is successfully submitted
    Then the reply form should not be visible
    And the user should see the new reply below the parent comment

  Scenario: [UI] Reply form clears content when reopened after cancel
    Given a top-level comment exists on a post
    And the user views the post detail page
    And the user clicks the "Reply" button on the comment
    And the user enters "Draft reply content" in the reply text area
    When the user clicks the "Cancel" button
    And the user clicks the "Reply" button on the same comment
    Then the reply text area should be empty

  Scenario: [UI] Reply form is not available on nested replies
    Given a second-level reply exists on a post
    When the user views the post detail page
    Then the user should not see the "Reply" button on the nested reply
