#!/bin/bash
# ThermIQ API Test Script
# Quick tests to verify the system is working

echo "🧪 Testing ThermIQ API..."
echo ""

BASE_URL="http://localhost:8000"

# Test 1: Health check
echo "1️⃣  Health check..."
curl -s "$BASE_URL/health" | python3 -m json.tool
echo ""

# Test 2: System status
echo "2️⃣  System status..."
curl -s "$BASE_URL/api/status" | python3 -m json.tool
echo ""

# Test 3: Get prices (may fail if not fetched yet)
echo "3️⃣  Electricity prices..."
curl -s "$BASE_URL/api/prices" | python3 -m json.tool || echo "Prices not yet available"
echo ""

# Test 4: Get schedule
echo "4️⃣  Heating schedule..."
curl -s "$BASE_URL/api/schedule" | python3 -m json.tool || echo "Schedule not yet available"
echo ""

# Test 5: Manual override
echo "5️⃣  Manual override (set to 22°C)..."
curl -s -X POST "$BASE_URL/api/override" \
  -H "Content-Type: application/json" \
  -d '{"target_temperature": 22.0}' | python3 -m json.tool
echo ""

echo "✅ API tests complete!"
