// Cypress E2E support file

// Ignore HTTPS errors for self-signed certs
Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('SSL')) {
    return false;
  }
});
