#!/usr/bin/env bash

# Set your Slack token and Api.ai token here.
# Then run using nohup run_slack_bot.js &

# Kill prev process
pkill -f 'nodemon slack_bot.js'
pkill -f 'node slack_bot.js'

# Run it again
SLACK_TOKEN=ABCDE APIAI_TOKEN=FGHIJ nodemon slack_bot.js &

