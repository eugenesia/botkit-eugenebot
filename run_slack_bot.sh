#!/usr/bin/env bash
# Run Slack bot and restart if it dies.
# See http://stackoverflow.com/questions/696839/how-do-i-write-a-bash-script-to-restart-a-process-if-it-dies

#
# # Kill prev process
# pkill -f 'nodemon slack_bot.js'
# pkill -f 'node slack_bot.js'
# 
# # Run it again
# # Nodemon watches for code changes and restarts process.
# nodemon slack_bot.js &
# 

until nodemon slack_bot.js; do
  echo "Eugenebot crashed with exit code $?.  Respawning.." >&2
  sleep 1
done

