#!/bin/bash
# Test script for the Marketplace Reputation System
# Run this after starting the API with: cd apps/api && npm run dev

API_URL="http://localhost:3001"

echo "=============================================="
echo "  Marketplace Reputation System - Test Script"
echo "=============================================="
echo ""

# Step 1: Get a worker user
echo "[1/6] Fetching a worker user..."
WORKER_RESPONSE=$(curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ workers { id userId } }"}')

WORKER_ID=$(echo $WORKER_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
USER_ID=$(echo $WORKER_RESPONSE | grep -o '"userId":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
    echo "❌ No workers found. Please seed the database first."
    echo "   Run: npm run db:seed --workspace=apps/api"
    exit 1
fi

echo "✅ Found Worker ID: $WORKER_ID"
echo "✅ Found User ID: $USER_ID"
echo ""

# Step 2: Get an offer for this worker
echo "[2/6] Fetching an offer for this worker..."
OFFER_RESPONSE=$(curl -s -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"{ offers(where: { workerId: \\\"$WORKER_ID\\\" }) { id employerId status } }\"}")

OFFER_ID=$(echo $OFFER_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
EMPLOYER_ID=$(echo $OFFER_RESPONSE | grep -o '"employerId":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$OFFER_ID" ]; then
    echo "⚠️  No offers found for this worker. Creating test data..."
    # You would need to create an offer here
    exit 1
fi

echo "✅ Found Offer ID: $OFFER_ID"
echo "✅ Found Employer ID: $EMPLOYER_ID"
echo ""

# Step 3: Submit a rating
echo "[3/6] Submitting a rating..."
RATING_RESPONSE=$(curl -s -X POST "$API_URL/ratings" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d "{
    \"offerId\": \"$OFFER_ID\",
    \"ratingOverall\": 4,
    \"ratingInterviewExperience\": 5,
    \"ratingTransparency\": 4,
    \"ratingCommunication\": 5,
    \"ratingOfferAccuracy\": 4,
    \"ratingWorkLifeBalance\": 3,
    \"wouldWorkAgain\": true,
    \"reviewText\": \"Great experience overall. The team was professional and the interview process was smooth.\",
    \"reviewTitle\": \"Professional and transparent\"
  }")

echo "✅ Rating Response:"
echo $RATING_RESPONSE | jq '.' 2>/dev/null || echo $RATING_RESPONSE
echo ""

# Step 4: Get employer ratings
echo "[4/6] Fetching employer ratings..."
curl -s "$API_URL/ratings/employer/$EMPLOYER_ID" | jq '.' 2>/dev/null || \
  curl -s "$API_URL/ratings/employer/$EMPLOYER_ID"
echo ""

# Step 5: Get employer rating stats
echo "[5/6] Fetching employer rating statistics..."
curl -s "$API_URL/ratings/employer/$EMPLOYER_ID/stats" | jq '.' 2>/dev/null || \
  curl -s "$API_URL/ratings/employer/$EMPLOYER_ID/stats"
echo ""

# Step 6: Get trust score
echo "[6/6] Fetching employer trust score..."
curl -s "$API_URL/ratings/employer/$EMPLOYER_ID/trust-score" | jq '.' 2>/dev/null || \
  curl -s "$API_URL/ratings/employer/$EMPLOYER_ID/trust-score"
echo ""

echo "=============================================="
echo "  Test Complete!"
echo "=============================================="
