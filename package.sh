#!/bin/bash

# Script to increment the version number in coi-serviceworker.js
# This forces cache invalidation for all users when deployed

SERVICE_WORKER_FILE="webapp/coi-serviceworker.js"

# Check if service worker file exists
if [ ! -f "$SERVICE_WORKER_FILE" ]; then
    echo "Error: $SERVICE_WORKER_FILE not found"
    exit 1
fi

# Extract current version number
CURRENT_VERSION=$(grep "const VERSION = 'v" "$SERVICE_WORKER_FILE" | sed -E "s/.*'v([0-9]+)'.*/\1/")

if [ -z "$CURRENT_VERSION" ]; then
    echo "Error: Could not extract current version from $SERVICE_WORKER_FILE"
    exit 1
fi

# Increment version
NEW_VERSION=$((CURRENT_VERSION + 1))

echo "Current version: v$CURRENT_VERSION"
echo "New version: v$NEW_VERSION"

# Update the version in the service worker file
sed -i.bak "s/const VERSION = 'v$CURRENT_VERSION'/const VERSION = 'v$NEW_VERSION'/" "$SERVICE_WORKER_FILE"

# Remove backup file
rm "${SERVICE_WORKER_FILE}.bak"

echo "✅ Version updated successfully in $SERVICE_WORKER_FILE"
echo ""
echo "Changes made:"
git diff "$SERVICE_WORKER_FILE" | grep "const VERSION"
