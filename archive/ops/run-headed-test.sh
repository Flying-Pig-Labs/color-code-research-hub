#!/bin/bash

echo "🖥️  Running HEADED browser test - this will open a VISIBLE browser window!"
echo "⚠️  Note: On headless servers, use xvfb-run to simulate display"
echo ""

# Check if we're on a headless server (no display)
if [ -z "$DISPLAY" ]; then
    echo "📺 No display detected. Running with xvfb-run to simulate display..."
    xvfb-run -a npx playwright test e2e/headed-test.spec.ts --project=chromium --reporter=list
else
    echo "🖥️  Display detected. Opening real browser window..."
    npx playwright test e2e/headed-test.spec.ts --project=chromium --reporter=list
fi

echo ""
echo "📸 Screenshot saved to: headed-browser-proof.png"
echo "🎥 Video saved to: test-results/"