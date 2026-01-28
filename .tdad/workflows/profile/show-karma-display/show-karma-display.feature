Feature: Show Karma Display
  As a registered user
  I want to see my karma score displayed on my profile
  So that I can understand my reputation in the community

  # NOTE: Karma badge displays totalKarma from the API
  # The breakdown (postKarma, commentKarma) may also be shown


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================
  Scenario: [UI] Display karma score on profile page
    Given the user is logged in
    And the user has a total karma of 25
    When the user visits the profile page
    Then the user should see the karma badge
    And the karma badge should display "25"

  Scenario: [UI] Display zero karma for new user
    Given the user is logged in
    And the user has a total karma of 0
    When the user visits the profile page
    Then the user should see the karma badge
    And the karma badge should display "0"

  Scenario: [UI] Display karma breakdown (post and comment karma)
    Given the user is logged in
    And the user has post karma of 15
    And the user has comment karma of 10
    When the user visits the profile page
    Then the user should see the karma badge
    And the user should see "Post Karma: 15"
    And the user should see "Comment Karma: 10"

  Scenario: [UI] Display negative karma score
    Given the user is logged in
    And the user has a total karma of -5
    When the user visits the profile page
    Then the user should see the karma badge
    And the karma badge should display "-5"

  Scenario: [UI] Karma display updates after receiving votes
    Given the user is logged in
    And the user has a total karma of 10
    When the user visits the profile page
    Then the karma badge should display "10"
    When the user's karma increases to 11
    And the user refreshes the profile page
    Then the karma badge should display "11"

  Scenario: [UI] Karma badge visible in profile header
    Given the user is logged in
    And the user has a total karma of 50
    When the user visits the profile page
    Then the karma badge should be visible in the profile header section
    And the karma badge should be styled as a badge element
