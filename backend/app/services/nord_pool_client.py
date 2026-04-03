"""
Nord Pool API Client

Fetches day-ahead electricity prices from Nord Pool for Estonia (EE) region.
"""
import logging
import asyncio
import httpx
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any

from app.models import ElectricityPrice
from app.config import get_config


logger = logging.getLogger(__name__)


class NordPoolClient:
    """Client for fetching Nord Pool electricity prices"""

    def __init__(self):
        self.config = get_config()
        nordpool_config = self.config.nordpool

        self.region = nordpool_config.get('region', 'EE')
        self.currency = nordpool_config.get('currency', 'EUR')
        # Updated to new Nord Pool Data Portal API
        self.api_url = nordpool_config.get('api_url', 'https://dataportal-api.nordpoolgroup.com/api/DayAheadPrices')
        self.retry_attempts = nordpool_config.get('retry_attempts', 3)

        self.client = httpx.AsyncClient(timeout=30.0)

    async def fetch_day_ahead_prices(self, target_date: Optional[date] = None) -> List[ElectricityPrice]:
        """
        Fetch day-ahead prices for specified date.

        Args:
            target_date: Date to fetch prices for. Defaults to today.

        Returns:
            List of hourly electricity prices
        """
        if target_date is None:
            target_date = date.today()

        logger.info(f"Fetching Nord Pool prices for {target_date} (region: {self.region})")

        # Nord Pool publishes prices for the next day around 12:45 UTC
        # We can fetch today's prices and tomorrow's prices (if available)

        for attempt in range(self.retry_attempts):
            try:
                # Format date for API (YYYY-MM-DD for new API)
                date_str = target_date.strftime('%Y-%m-%d')

                # Build API URL with required parameters
                url = f"{self.api_url}?date={date_str}&market=DayAhead&deliveryArea={self.region}&currency={self.currency}"

                logger.debug(f"Fetching from: {url}")

                response = await self.client.get(url)
                response.raise_for_status()

                data = response.json()

                # Parse the response
                prices = self._parse_response(data, target_date)

                if prices:
                    logger.info(f"Successfully fetched {len(prices)} prices for {target_date}")
                    return prices
                else:
                    logger.warning(f"No prices found for {target_date}")
                    return []

            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error fetching prices (attempt {attempt + 1}/{self.retry_attempts}): {e}")
                if attempt < self.retry_attempts - 1:
                    await asyncio.sleep(5 * (attempt + 1))  # Exponential backoff
                else:
                    raise

            except Exception as e:
                logger.error(f"Error fetching prices (attempt {attempt + 1}/{self.retry_attempts}): {e}")
                if attempt < self.retry_attempts - 1:
                    await asyncio.sleep(5 * (attempt + 1))
                else:
                    raise

        return []

    def _parse_response(self, data: Dict[str, Any], target_date: date) -> List[ElectricityPrice]:
        """
        Parse Nord Pool API response.

        Supports both old and new API formats.
        """
        try:
            prices = []

            # Try new API format first (Data Portal API)
            if 'multiAreaEntries' in data:
                entries = data.get('multiAreaEntries', [])

                # Group by hour since API returns 15-minute intervals
                hourly_prices = {}

                for entry in entries:
                    # Parse delivery start time
                    start_time_str = entry.get('deliveryStart')
                    if not start_time_str:
                        continue

                    try:
                        timestamp = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                    except:
                        timestamp = datetime.strptime(start_time_str[:19], '%Y-%m-%dT%H:%M:%S')

                    # Check if this is for our target date (CET timezone)
                    # Nord Pool data for date X spans from (X-1) 22:00 UTC to X 21:59 UTC
                    # So we need to include timestamps from target_date AND target_date-1
                    if timestamp.date() != target_date and timestamp.date() != (target_date - timedelta(days=1)):
                        continue

                    # Get price for our region
                    entry_per_area = entry.get('entryPerArea', {})
                    region_price = entry_per_area.get(self.region)

                    if region_price is not None:
                        try:
                            price_value = float(region_price)

                            # Group by hour (take average of 15-min intervals)
                            hour_key = timestamp.replace(minute=0, second=0, microsecond=0)

                            if hour_key not in hourly_prices:
                                hourly_prices[hour_key] = []
                            hourly_prices[hour_key].append(price_value)

                        except (ValueError, TypeError) as e:
                            logger.warning(f"Could not parse price {region_price}: {e}")

                # Create ElectricityPrice objects from hourly averages
                for hour_timestamp, price_values in hourly_prices.items():
                    avg_price = sum(price_values) / len(price_values)
                    prices.append(
                        ElectricityPrice(
                            timestamp=hour_timestamp,
                            price=avg_price,
                            currency=self.currency,
                            region=self.region,
                        )
                    )

            # Fall back to old API format
            elif 'data' in data and 'Rows' in data['data']:
                rows = data['data']['Rows']
                for row in rows:
                    start_time_str = row.get('StartTime')
                    if not start_time_str:
                        continue

                    try:
                        timestamp = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                    except:
                        timestamp = datetime.strptime(start_time_str[:19], '%Y-%m-%dT%H:%M:%S')

                    if timestamp.date() != target_date:
                        continue

                    columns = row.get('Columns', [])
                    region_price = None

                    for col in columns:
                        col_name = col.get('Name', '')
                        if self.region in col_name:
                            price_str = col.get('Value')
                            if price_str and price_str != '-':
                                price_str = price_str.replace(' ', '').replace(',', '.')
                                try:
                                    region_price = float(price_str)
                                    break
                                except ValueError:
                                    logger.warning(f"Could not parse price: {price_str}")

                    if region_price is not None:
                        prices.append(
                            ElectricityPrice(
                                timestamp=timestamp,
                                price=region_price,
                                currency=self.currency,
                                region=self.region,
                            )
                        )

            return sorted(prices, key=lambda p: p.timestamp)

        except Exception as e:
            logger.error(f"Error parsing Nord Pool response: {e}")
            logger.debug(f"Response data: {data}")
            return []

    async def fetch_today_and_tomorrow(self) -> Dict[str, List[ElectricityPrice]]:
        """
        Fetch prices for today and tomorrow (if available).

        Returns:
            Dict with keys 'today' and 'tomorrow'
        """
        today = date.today()
        tomorrow = today + timedelta(days=1)

        result = {
            'today': [],
            'tomorrow': []
        }

        try:
            result['today'] = await self.fetch_day_ahead_prices(today)
        except Exception as e:
            logger.error(f"Failed to fetch today's prices: {e}")

        try:
            # Tomorrow's prices may not be available yet (published around 12:45 UTC)
            result['tomorrow'] = await self.fetch_day_ahead_prices(tomorrow)
        except Exception as e:
            logger.warning(f"Tomorrow's prices not yet available: {e}")

        return result

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Global client instance
_nordpool_client: Optional[NordPoolClient] = None


def get_nordpool_client() -> NordPoolClient:
    """Get global Nord Pool client instance"""
    global _nordpool_client
    if _nordpool_client is None:
        _nordpool_client = NordPoolClient()
    return _nordpool_client


# Import asyncio for sleep
import asyncio
