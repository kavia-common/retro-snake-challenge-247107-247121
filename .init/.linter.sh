#!/bin/bash
cd /home/kavia/workspace/code-generation/retro-snake-challenge-247107-247121/backend_express
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

