Feature: Show Post Form
  As a user
  I want to see a post creation form on the home page
  So that I can share my frustrations with the community

  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Post form is displayed on home page
    Given the user is on the home page
    Then the user should see the post creation form
    And the user should see the label "Why is it so hard to..."
    And the user should see an input field with placeholder "e.g., get a good night's sleep"
    And the user should see the label "I am..."
    And the user should see an input field with placeholder "e.g., a new parent"
    And the user should see the label "Category"
    And the user should see a category dropdown
    And the user should see the "Ask" button

  Scenario: [UI] Category dropdown displays all options
    Given the user is on the home page
    When the user clicks the category dropdown
    Then the user should see the following category options:
      | Category      |
      | Work          |
      | Relationships |
      | Technology    |
      | Health        |
      | Parenting     |
      | Finance       |
      | Daily Life    |
      | Social        |
      | Other         |

  Scenario: [UI] Form fields are required
    Given the user is on the home page
    Then the frustration input field should be required
    And the identity input field should be required
    And the category dropdown should be required
