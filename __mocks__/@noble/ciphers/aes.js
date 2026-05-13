const gcm = jest.fn(() => ({
  decrypt: jest.fn(),
}))

module.exports = { gcm }
