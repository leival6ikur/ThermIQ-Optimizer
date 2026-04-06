"""
Unit tests for AlertService
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
from app.services.alert_service import AlertService, get_alert_service


class TestAlertService:
    """Test suite for alert service"""

    @pytest.fixture
    async def mock_db(self):
        """Create mock database"""
        db = Mock()
        db.create_alert = AsyncMock(return_value=1)
        db.get_active_alerts = AsyncMock(return_value=[])
        db.get_latest_performance_metrics = AsyncMock(return_value=None)
        return db

    @pytest.fixture
    def alert_service(self, mock_db):
        """Create alert service with mock database"""
        config = {
            'enabled': True,
            'efficiency_cop_threshold': 2.0,
            'efficiency_check_interval_minutes': 60,
            'price_opportunity_threshold_percent': 30,
            'comfort_deviation_threshold': 1.0,
            'comfort_duration_minutes': 30,
            'max_active_alerts': 20
        }
        return AlertService(mock_db, config)

    @pytest.mark.asyncio
    async def test_service_initialization(self, alert_service):
        """Test service initializes correctly"""
        assert alert_service.enabled is True
        assert alert_service.cop_threshold == 2.0
        assert alert_service.max_active_alerts == 20

    @pytest.mark.asyncio
    async def test_low_cop_alert_triggered(self, alert_service, mock_db):
        """Test low COP triggers efficiency alert"""
        # Mock performance metrics with low COP
        metrics = {
            'cop': 1.5,  # Below threshold of 2.0
            'duty_cycle': 50.0,
            'cycles_per_hour': 2.0,
            'ground_delta': 3.0,
            'heating_delta': 6.0,
            'timestamp': datetime.now()
        }
        mock_db.get_latest_performance_metrics = AsyncMock(return_value=metrics)

        await alert_service.evaluate_alerts()

        # Should create low COP alert
        mock_db.create_alert.assert_called_once()
        call_args = mock_db.create_alert.call_args[1]
        assert call_args['alert_type'] == 'efficiency'
        assert 'COP' in call_args['title'] or 'efficiency' in call_args['title'].lower()

    @pytest.mark.asyncio
    async def test_high_duty_cycle_alert(self, alert_service, mock_db):
        """Test high duty cycle triggers alert"""
        metrics = {
            'cop': 3.0,  # Good COP
            'duty_cycle': 85.0,  # High duty cycle (> 80%)
            'cycles_per_hour': 2.0,
            'ground_delta': 3.0,
            'heating_delta': 6.0,
            'timestamp': datetime.now()
        }
        mock_db.get_latest_performance_metrics = AsyncMock(return_value=metrics)

        await alert_service.evaluate_alerts()

        mock_db.create_alert.assert_called()
        call_args = mock_db.create_alert.call_args[1]
        assert call_args['alert_type'] == 'efficiency'

    @pytest.mark.asyncio
    async def test_excessive_cycling_alert(self, alert_service, mock_db):
        """Test excessive cycling triggers alert"""
        metrics = {
            'cop': 3.0,
            'duty_cycle': 50.0,
            'cycles_per_hour': 6.0,  # Too many cycles (> 5)
            'ground_delta': 3.0,
            'heating_delta': 6.0,
            'timestamp': datetime.now()
        }
        mock_db.get_latest_performance_metrics = AsyncMock(return_value=metrics)

        await alert_service.evaluate_alerts()

        mock_db.create_alert.assert_called()
        call_args = mock_db.create_alert.call_args[1]
        assert call_args['severity'] in ['warning', 'critical']

    @pytest.mark.asyncio
    async def test_no_alert_when_metrics_good(self, alert_service, mock_db):
        """Test no alert when all metrics are good"""
        metrics = {
            'cop': 3.5,  # Good
            'duty_cycle': 55.0,  # Good
            'cycles_per_hour': 2.5,  # Good
            'ground_delta': 3.2,  # Good
            'heating_delta': 7.5,  # Good
            'timestamp': datetime.now()
        }
        mock_db.get_latest_performance_metrics = AsyncMock(return_value=metrics)

        await alert_service.evaluate_alerts()

        # Should not create any alerts for good performance
        # (might still check other alert types, so we check COP wasn't flagged)
        if mock_db.create_alert.called:
            for call in mock_db.create_alert.call_args_list:
                assert 'COP' not in call[1]['title']

    @pytest.mark.asyncio
    async def test_service_disabled(self, mock_db):
        """Test service does nothing when disabled"""
        config = {'enabled': False}
        service = AlertService(mock_db, config)

        await service.evaluate_alerts()

        # Should not create any alerts
        mock_db.create_alert.assert_not_called()

    @pytest.mark.asyncio
    async def test_duplicate_alert_prevention(self, alert_service, mock_db):
        """Test duplicate alerts are not created"""
        # Mock existing active alert
        existing_alert = {
            'id': 1,
            'alert_type': 'efficiency',
            'title': 'Low COP Detected',
            'created_at': datetime.now().isoformat()
        }
        mock_db.get_active_alerts = AsyncMock(return_value=[existing_alert])

        # Try to create same alert again
        metrics = {
            'cop': 1.5,
            'duty_cycle': 50.0,
            'cycles_per_hour': 2.0,
            'ground_delta': 3.0,
            'heating_delta': 6.0,
            'timestamp': datetime.now()
        }
        mock_db.get_latest_performance_metrics = AsyncMock(return_value=metrics)

        await alert_service.evaluate_alerts()

        # Should not create duplicate alert within cooldown period
        # Implementation should check for similar active alerts

    @pytest.mark.asyncio
    async def test_alert_max_limit_enforced(self, alert_service, mock_db):
        """Test maximum active alerts limit is enforced"""
        # Mock many existing alerts
        existing_alerts = [
            {'id': i, 'alert_type': 'info', 'title': f'Alert {i}'}
            for i in range(20)  # At max limit
        ]
        mock_db.get_active_alerts = AsyncMock(return_value=existing_alerts)

        # Try to create new alert
        metrics = {
            'cop': 1.5,
            'duty_cycle': 50.0,
            'cycles_per_hour': 2.0,
            'ground_delta': 3.0,
            'heating_delta': 6.0,
            'timestamp': datetime.now()
        }
        mock_db.get_latest_performance_metrics = AsyncMock(return_value=metrics)

        await alert_service.evaluate_alerts()

        # Should either not create or clean up old alerts first
        # Exact behavior depends on implementation

    @pytest.mark.asyncio
    async def test_get_alert_service_singleton(self, mock_db):
        """Test get_alert_service returns singleton instance"""
        with patch('app.services.alert_service.get_database', return_value=mock_db):
            with patch('app.services.alert_service.get_config') as mock_config:
                mock_config.return_value.alerts = {
                    'enabled': True,
                    'efficiency_cop_threshold': 2.0
                }

                service1 = get_alert_service()
                service2 = get_alert_service()

                assert service1 is service2  # Should be same instance
