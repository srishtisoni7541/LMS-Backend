const forgotPasswordTemplate = (name, resetLink) => `
  <h2>Hello ${name},</h2>
  <p>You requested a password reset.</p>
  <p>Click the link below to reset your password:</p>
  <a href="${resetLink}">Reset Password</a>
  <p>If you did not request this, please ignore this email.</p>
`;

module.exports = { forgotPasswordTemplate };
