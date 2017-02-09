// Configuration and credentials.

exports = {
  // Whether to output debug messages.
  debug: false,

  // Token for Slack bot.
  slackToken: '',

  // Token for api.ai.
  apiaiToken: '',

  // cleverbot.io credentials.
  cleverbot: {
    apiUser: '',
    apiKey: '',
  },

  // Salesforce-related credentials.
  salesforce: {
    oauth2: {
      loginUrl: '',
      clientId: '',
      clientSecret: '',
    },
    instanceUrl: '',
    refreshToken: '',
  },

  // Spotify.
  spotify: {
    clientId: '',
    clientSecret: '',
    redirectUri: 'http://www.example.com/callback',
  },
}

