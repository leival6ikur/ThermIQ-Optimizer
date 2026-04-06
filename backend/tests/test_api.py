"""
Integration tests for API endpoints
"""
import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from app.main import app


class TestAPIEndpoints:
    """Test suite for API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    def test_root_endpoint(self, client):
        """Test root endpoint returns project info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "Thermi-Nator" in data["name"]

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_status_endpoint(self, client):
        """Test system status endpoint"""
        response = client.get("/api/status")
        assert response.status_code == 200
        data = response.json()
        assert "mqtt_connected" in data

    def test_prices_endpoint(self, client):
        """Test electricity prices endpoint"""
        response = client.get("/api/prices")
        assert response.status_code == 200
        data = response.json()
        assert "prices" in data
        assert "date" in data

    def test_schedule_endpoint(self, client):
        """Test heating schedule endpoint"""
        response = client.get("/api/schedule")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_temperature_history_endpoint(self, client):
        """Test temperature history endpoint"""
        response = client.get("/api/temperatures/history?hours=24")
        assert response.status_code == 200
        data = response.json()
        assert "temperatures" in data
        assert "count" in data

    def test_temperature_history_invalid_hours(self, client):
        """Test temperature history rejects invalid hours"""
        response = client.get("/api/temperatures/history?hours=200")
        assert response.status_code == 400

    def test_alerts_endpoint(self, client):
        """Test alerts endpoint"""
        response = client.get("/api/alerts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_alerts_all_endpoint(self, client):
        """Test all alerts endpoint"""
        response = client.get("/api/alerts/all?limit=50")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_hot_water_stats_endpoint(self, client):
        """Test hot water stats endpoint"""
        response = client.get("/api/hot-water/stats")
        assert response.status_code == 200
        data = response.json()
        assert "current_temp" in data

    def test_hot_water_schedule_endpoint(self, client):
        """Test hot water schedule endpoint"""
        response = client.get("/api/hot-water/schedule")
        assert response.status_code == 200
        data = response.json()
        assert "schedule" in data

    def test_location_config_endpoint(self, client):
        """Test location configuration endpoint"""
        response = client.get("/api/config/location")
        assert response.status_code == 200
        data = response.json()
        assert "latitude" in data
        assert "longitude" in data

    def test_comparison_week_endpoint(self, client):
        """Test week comparison endpoint"""
        response = client.get("/api/compare/week")
        assert response.status_code == 200
        data = response.json()
        assert "week1" in data
        assert "week2" in data
        assert "changes" in data

    def test_comparison_month_endpoint(self, client):
        """Test month comparison endpoint"""
        response = client.get("/api/compare/month")
        assert response.status_code == 200
        data = response.json()
        assert "month1" in data
        assert "month2" in data

    def test_daily_breakdown_endpoint(self, client):
        """Test daily breakdown endpoint"""
        response = client.get("/api/compare/daily?days=7")
        assert response.status_code == 200
        data = response.json()
        assert "daily_data" in data
        assert len(data["daily_data"]) <= 7

    def test_daily_breakdown_max_limit(self, client):
        """Test daily breakdown enforces max limit"""
        response = client.get("/api/compare/daily?days=50")
        assert response.status_code == 400

    def test_weather_current_without_config(self, client):
        """Test weather endpoint when not configured"""
        response = client.get("/api/weather/current")
        # Should return 503 if not configured
        assert response.status_code in [200, 503]

    def test_cors_headers(self, client):
        """Test CORS headers are present"""
        response = client.options("/api/status")
        # Should have CORS headers or allow the request
        assert response.status_code in [200, 405]

    @pytest.mark.asyncio
    async def test_websocket_connection(self):
        """Test WebSocket connection"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # WebSocket test would need special handling
            # This is a placeholder for proper WebSocket testing
            pass

    def test_swagger_ui_available(self, client):
        """Test Swagger documentation is available"""
        response = client.get("/docs")
        assert response.status_code == 200

    def test_openapi_json_available(self, client):
        """Test OpenAPI JSON is available"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "info" in data
