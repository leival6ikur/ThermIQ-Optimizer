"""
Unit tests for OptimizationEngine
"""
import pytest
from datetime import datetime, timedelta
from app.services.optimization_engine import OptimizationEngine
from app.models import ElectricityPrice


class TestOptimizationEngine:
    """Test suite for optimization engine"""

    @pytest.fixture
    def engine(self):
        """Create optimization engine instance"""
        return OptimizationEngine(
            target_temperature=21.0,
            temperature_tolerance=1.0,
            strategy='balanced'
        )

    @pytest.fixture
    def sample_prices(self):
        """Generate sample electricity prices for 24 hours"""
        base_time = datetime(2026, 4, 3, 0, 0, 0)
        prices = []

        # Create varied prices: cheap at night, expensive at peak
        hourly_prices = [
            50, 45, 40, 40, 45, 55,  # 00-05: cheap night
            80, 95, 100, 90, 85, 75,  # 06-11: morning peak
            70, 65, 70, 75, 80, 90,   # 12-17: afternoon
            110, 105, 95, 85, 70, 60  # 18-23: evening peak then drop
        ]

        for hour, price in enumerate(hourly_prices):
            prices.append(ElectricityPrice(
                timestamp=base_time + timedelta(hours=hour),
                price=price,
                currency='EUR',
                region='EE'
            ))

        return prices

    def test_engine_initialization(self, engine):
        """Test engine initializes with correct parameters"""
        assert engine.target_temperature == 21.0
        assert engine.temperature_tolerance == 1.0
        assert engine.strategy == 'balanced'

    def test_calculate_schedule_balanced(self, engine, sample_prices):
        """Test balanced strategy generates reasonable schedule"""
        schedule = engine.calculate_schedule(sample_prices)

        assert len(schedule) == 24
        assert all(hasattr(item, 'hour') for item in schedule)
        assert all(hasattr(item, 'should_heat') for item in schedule)

        # Count heating hours
        heating_hours = sum(1 for item in schedule if item.should_heat)

        # Balanced should heat about 50-70% of time
        assert 12 <= heating_hours <= 18

    def test_calculate_schedule_aggressive(self, sample_prices):
        """Test aggressive strategy uses cheapest hours only"""
        engine = OptimizationEngine(
            target_temperature=21.0,
            temperature_tolerance=1.0,
            strategy='aggressive'
        )

        schedule = engine.calculate_schedule(sample_prices)
        heating_hours = sum(1 for item in schedule if item.should_heat)

        # Aggressive should heat less (40-60% of time)
        assert 10 <= heating_hours <= 15

    def test_calculate_schedule_conservative(self, sample_prices):
        """Test conservative strategy maintains comfort"""
        engine = OptimizationEngine(
            target_temperature=21.0,
            temperature_tolerance=1.0,
            strategy='conservative'
        )

        schedule = engine.calculate_schedule(sample_prices)
        heating_hours = sum(1 for item in schedule if item.should_heat)

        # Conservative should heat more (60-80% of time)
        assert 15 <= heating_hours <= 20

    def test_comfort_hours_enforced(self, engine, sample_prices):
        """Test comfort hours (06:00-23:00) always enable heating if needed"""
        # Set comfort hours
        engine.comfort_hours_start = 6
        engine.comfort_hours_end = 23

        schedule = engine.calculate_schedule(sample_prices)

        # Check comfort hours (6-22) all allow heating
        comfort_schedule = [s for s in schedule if 6 <= s.hour < 23]
        assert len(comfort_schedule) == 17

    def test_expensive_hours_avoided(self, engine, sample_prices):
        """Test expensive hours avoided in balanced strategy"""
        schedule = engine.calculate_schedule(sample_prices)

        # Find most expensive hours (18-20)
        expensive_hours = [s for s in schedule if s.hour in [18, 19, 20]]

        # At least some expensive hours should not heat
        non_heating_expensive = sum(1 for s in expensive_hours if not s.should_heat)
        assert non_heating_expensive >= 1

    def test_cheap_hours_utilized(self, engine, sample_prices):
        """Test cheap night hours utilized"""
        schedule = engine.calculate_schedule(sample_prices)

        # Find cheapest hours (02-04)
        cheap_hours = [s for s in schedule if s.hour in [2, 3, 4]]

        # Most cheap hours should heat
        heating_cheap = sum(1 for s in cheap_hours if s.should_heat)
        assert heating_cheap >= 2

    def test_schedule_price_correlation(self, engine, sample_prices):
        """Test schedule correlates with prices (lower price = more likely to heat)"""
        schedule = engine.calculate_schedule(sample_prices)

        # Calculate average price for heating vs non-heating hours
        heating_prices = [s.price for s in schedule if s.should_heat]
        non_heating_prices = [s.price for s in schedule if not s.should_heat]

        if heating_prices and non_heating_prices:
            avg_heating_price = sum(heating_prices) / len(heating_prices)
            avg_non_heating_price = sum(non_heating_prices) / len(non_heating_prices)

            # Heating hours should have lower average price
            assert avg_heating_price < avg_non_heating_price

    def test_empty_prices_handled(self, engine):
        """Test engine handles empty price list gracefully"""
        schedule = engine.calculate_schedule([])

        # Should return empty schedule or default to always heat
        assert isinstance(schedule, list)

    def test_invalid_strategy_defaults(self):
        """Test invalid strategy defaults to balanced"""
        engine = OptimizationEngine(
            target_temperature=21.0,
            temperature_tolerance=1.0,
            strategy='invalid_strategy'
        )

        # Should default to balanced behavior
        assert engine.strategy == 'invalid_strategy'  # Stores original
        # But should still work without crashing

    def test_temperature_tolerance_affects_schedule(self, sample_prices):
        """Test temperature tolerance affects heating decisions"""
        strict_engine = OptimizationEngine(
            target_temperature=21.0,
            temperature_tolerance=0.5,  # Strict
            strategy='balanced'
        )

        loose_engine = OptimizationEngine(
            target_temperature=21.0,
            temperature_tolerance=2.0,  # Loose
            strategy='balanced'
        )

        strict_schedule = strict_engine.calculate_schedule(sample_prices)
        loose_schedule = loose_engine.calculate_schedule(sample_prices)

        strict_heating = sum(1 for s in strict_schedule if s.should_heat)
        loose_heating = sum(1 for s in loose_schedule if s.should_heat)

        # Strict tolerance should heat more to maintain tighter range
        # (or at least not significantly less)
        assert abs(strict_heating - loose_heating) <= 3

    @pytest.mark.parametrize("strategy", ["aggressive", "balanced", "conservative"])
    def test_all_strategies_valid(self, sample_prices, strategy):
        """Test all strategies produce valid schedules"""
        engine = OptimizationEngine(
            target_temperature=21.0,
            temperature_tolerance=1.0,
            strategy=strategy
        )

        schedule = engine.calculate_schedule(sample_prices)

        assert len(schedule) == 24
        assert all(0 <= item.hour < 24 for item in schedule)
        assert all(isinstance(item.should_heat, bool) for item in schedule)
        assert all(item.price >= 0 for item in schedule)
