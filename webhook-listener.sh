#!/bin/bash

stripe listen --forward-to localhost:3000/api/webhooks --print-secret

