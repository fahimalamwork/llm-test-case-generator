# Customer login

As a returning customer, I want to sign in to my account using my email and
password so I can resume shopping where I left off.

The login screen contains an email field, a password field, a Sign-In button,
and a "Forgot password" link. After a successful login the customer lands on
the home page.

## Acceptance Criteria

- A customer with valid credentials is signed in and redirected to the home page.
- A customer with an incorrect password sees an inline error "Email or password is incorrect".
- A customer with an unknown email sees the same inline error to avoid account enumeration.
- The Sign-In button is disabled while the request is in flight.
- After five consecutive failed attempts within ten minutes the account is locked for fifteen minutes.
