Feature: Show Post List
  As a user
  I want to see a list of post cards in the feed
  So that I can browse frustrations shared by the community

  # NOTE: Post cards display frustration text, identity text, category badge, vote count, and comment count
  # Posts are rendered based on the active feed type (Hot/New) and optional category filter


  # ==========================================
  # UI SCENARIOS (User Actions & UI)
  # ==========================================

  Scenario: [UI] Post list displays post cards with all required elements
    Given the user is on the home page
    And posts exist in the database
    When the feed loads
    Then the user should see a list of post cards
    And each post card should display the frustration text starting with "Why is it so hard to"
    And each post card should display the identity text starting with "I am"
    And each post card should display a category badge
    And each post card should display the vote count
    And each post card should display the comment count

  Scenario: [UI] Post list shows empty state when no posts exist
    Given the user is on the home page
    And no posts exist in the database
    When the feed loads
    Then the user should see an empty feed state
    And no post cards should be displayed

  Scenario: [UI] Post list shows loading state while fetching posts
    Given the user is on the home page
    When the feed is loading
    Then the user should see a loading indicator

  Scenario: [UI] Post list displays posts sorted by hot score on Hot tab
    Given the user is on the home page
    And the "Hot" tab is active
    And posts exist with different hot scores
    When the feed loads
    Then the user should see post cards sorted by hot score
    And higher scored posts should appear before lower scored posts

  Scenario: [UI] Post list displays posts sorted by creation date on New tab
    Given the user is on the home page
    And the "New" tab is active
    And posts exist with different creation dates
    When the feed loads
    Then the user should see post cards sorted by newest first
    And more recent posts should appear before older posts

  Scenario: [UI] Post list displays only filtered category posts
    Given the user is on the home page
    And the user has filtered by "Technology" category
    And posts exist in multiple categories
    When the feed loads
    Then the user should see only post cards from the "Technology" category
    And each post card should display the "Technology" category badge

  Scenario: [UI] Post list updates when switching feed type
    Given the user is on the home page
    And the "Hot" tab is active
    And posts are displayed in the feed
    When the user clicks the "New" tab button
    Then the post list should refresh
    And the user should see post cards sorted by newest first

  Scenario: [UI] Post list updates when applying category filter
    Given the user is on the home page
    And posts are displayed from all categories
    When the user clicks the category filter dropdown
    And the user selects "Work" from the dropdown
    Then the post list should refresh
    And the user should see only post cards from the "Work" category

  Scenario: [UI] Post card is clickable and navigates to post detail
    Given the user is on the home page
    And posts are displayed in the feed
    When the user clicks on a post card
    Then the user should be navigated to the post detail page

  Scenario: [UI] Post list supports infinite scroll pagination
    Given the user is on the home page
    And more posts exist than the initial page size
    And posts are displayed in the feed
    When the user scrolls to the bottom of the post list
    Then additional post cards should load
    And the user should see more posts appended to the list
