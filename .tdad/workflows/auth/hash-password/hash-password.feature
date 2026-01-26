Feature: Hash Password
  As a system
  I want to hash passwords using bcrypt with salt
  So that user passwords are stored securely

  # NOTE: bcrypt with cost factor 12 per security requirements
  # Hashes are always unique due to random salt generation


  # ==========================================
  # API SCENARIOS (Password Hashing Function)
  # ==========================================

  Scenario: [API] Hash Password Success
    Given a valid password "SecurePass123!"
    When the password hashing function is called
    Then the function should return a bcrypt hash
    And the hash should start with "$2b$" or "$2a$"
    And the hash should be 60 characters long
    And the hash should not equal the original password

  Scenario: [API] Hash Password with Salt Uniqueness
    Given a valid password "SamePassword123"
    When the password hashing function is called twice
    Then each hash should be different due to unique salt
    And both hashes should be valid bcrypt hashes

  Scenario: [API] Hash Password Verification
    Given a valid password "VerifyMe456!"
    When the password is hashed
    Then the original password should verify against the hash
    And an incorrect password "WrongPass789" should not verify

  Scenario: [API] Hash Password with Empty Input
    Given an empty password ""
    When the password hashing function is called
    Then the function should return an error
    And the error should indicate "Password is required"

  Scenario: [API] Hash Password with Whitespace Only
    Given a whitespace-only password "   "
    When the password hashing function is called
    Then the function should return an error
    And the error should indicate "Password is required"
