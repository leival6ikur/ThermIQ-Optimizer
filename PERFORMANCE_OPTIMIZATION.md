# Performance Optimization Guide

Strategies and implementations for optimizing Thermi-Nator performance.

## Current Performance

### Frontend Build (April 4, 2026)
```
dist/index.html               1.47 kB │ gzip:   0.70 kB
dist/assets/index-*.css      37.01 kB │ gzip:   6.58 kB
dist/assets/index-*.js      697.89 kB │ gzip: 196.13 kB ⚠️
```

**Issues:**
- ⚠️ JS bundle >500 kB (warning threshold exceeded)
- Large recharts library inclusion
- No code splitting

## Optimization Strategies

### 1. Code Splitting (High Priority)

Split large bundles into smaller chunks loaded on demand.

#### Route-Based Splitting

```tsx
// Before: All pages loaded upfront
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

// After: Lazy load pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Expected Savings:** 30-40% initial bundle size reduction

#### Component-Based Splitting

```tsx
// Heavy components (charts, modals)
const AdvancedChart = lazy(() => import('./components/AdvancedChart'));
const ComparisonModal = lazy(() => import('./components/ComparisonModal'));

// Use with Suspense
<Suspense fallback={<ChartSkeleton />}>
  <AdvancedChart data={data} />
</Suspense>
```

#### Library Splitting

```tsx
// Split recharts (largest dependency)
const LineChart = lazy(() => import('./charts/LineChartWrapper'));
const BarChart = lazy(() => import('./charts/BarChartWrapper'));
```

**Implementation:**

```tsx
// Create chart wrappers
// src/charts/LineChartWrapper.tsx
import { LineChart, Line, XAxis, YAxis, ... } from 'recharts';

export default function LineChartWrapper(props) {
  return <LineChart {...props}>{props.children}</LineChart>;
}
```

**Expected Savings:** 200-300 kB initial bundle

### 2. Tree Shaking

Ensure unused code is eliminated during build.

#### Import Granularly

```tsx
// ❌ Bad: Imports entire library
import { debounce, throttle, cloneDeep } from 'lodash';

// ✅ Good: Import only what's needed
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// ✅ Better: Use native alternatives
const debounce = (fn, ms) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
};
```

#### Configure Vite

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
});
```

**Expected Savings:** 50-100 kB

### 3. Image Optimization

Optimize assets for faster loading.

#### SVG Optimization

```bash
# Install svgo
npm install -D svgo

# Optimize SVGs
npx svgo public/logo_v*.svg --multipass
```

#### Lazy Load Images

```tsx
// Add loading="lazy" to images
<img src="/logo.svg" alt="Logo" loading="lazy" />
```

#### Use WebP Format

```bash
# Convert PNGs to WebP (if using raster images)
cwebp pwa-icon-512.png -o pwa-icon-512.webp
```

**Expected Savings:** 30-50% image file size

### 4. Database Query Optimization

Optimize backend database queries.

#### Add Indexes

```sql
-- Add indexes to frequently queried columns
CREATE INDEX idx_temp_timestamp ON temperature_readings(timestamp);
CREATE INDEX idx_prices_timestamp ON electricity_prices(timestamp);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
```

#### Limit Query Results

```python
# Before: Load all data
async def get_temperature_history():
    rows = await db.execute("SELECT * FROM temperature_readings")
    return rows

# After: Limit and paginate
async def get_temperature_history(hours=24, offset=0, limit=1000):
    query = """
        SELECT * FROM temperature_readings
        WHERE timestamp >= datetime('now', '-' || ? || ' hours')
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    """
    rows = await db.execute(query, (hours, limit, offset))
    return rows
```

#### Use Prepared Statements

Already implemented via aiosqlite, but ensure parameterized queries:

```python
# ✅ Good: Parameterized
await db.execute("SELECT * FROM readings WHERE id = ?", (id,))

# ❌ Bad: String concatenation (SQL injection risk + no caching)
await db.execute(f"SELECT * FROM readings WHERE id = {id}")
```

**Expected Improvement:** 50-80% faster queries

### 5. API Response Optimization

Reduce API payload sizes.

#### Compress Responses

```python
# Add gzip middleware to FastAPI
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

#### Pagination

```python
# Add pagination to large responses
@router.get("/temperatures/history")
async def get_temperatures(
    hours: int = 24,
    page: int = 1,
    page_size: int = 100
):
    offset = (page - 1) * page_size
    data = await db.get_temperatures(hours, offset, page_size)
    total = await db.count_temperatures(hours)
    
    return {
        "data": data,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "pages": (total + page_size - 1) // page_size
        }
    }
```

#### Response Caching

```python
from functools import lru_cache
from datetime import datetime, timedelta

# Cache expensive calculations
@lru_cache(maxsize=128)
def calculate_cop(supply_temp, return_temp, power):
    # Expensive calculation
    return result

# HTTP caching headers
@router.get("/prices")
async def get_prices():
    prices = await fetch_prices()
    
    # Cache for 1 hour
    return Response(
        content=prices.json(),
        headers={
            "Cache-Control": "public, max-age=3600",
            "ETag": f'"{hash(prices)}"'
        }
    )
```

**Expected Improvement:** 60-80% smaller payloads, 3-5x faster responses

### 6. WebSocket Optimization

Reduce WebSocket message frequency and size.

#### Throttle Updates

```python
# Backend: Send updates at most once per second
class MQTTManager:
    def __init__(self):
        self.last_broadcast = 0
        self.broadcast_interval = 1.0  # seconds
    
    async def on_message(self, message):
        now = time.time()
        if now - self.last_broadcast >= self.broadcast_interval:
            await self.broadcast_to_clients(message)
            self.last_broadcast = now
```

#### Delta Updates

```python
# Send only changed fields, not entire state
previous_state = {}

async def broadcast_changes(new_state):
    changes = {
        k: v for k, v in new_state.items()
        if k not in previous_state or previous_state[k] != v
    }
    
    if changes:
        await broadcast({"type": "update", "changes": changes})
        previous_state.update(changes)
```

**Expected Improvement:** 70-90% less WebSocket traffic

### 7. Frontend Rendering Optimization

Reduce unnecessary re-renders.

#### Use React.memo

```tsx
// Prevent re-renders when props don't change
export const TemperatureCard = React.memo(({ temperature }) => {
  return <div>{temperature}°C</div>;
});

// With custom comparison
export const ChartCard = React.memo(
  ({ data }) => <Chart data={data} />,
  (prev, next) => prev.data.length === next.data.length
);
```

#### Virtualize Long Lists

```tsx
// For long lists (100+ items)
import { FixedSizeList } from 'react-window';

function AlertsList({ alerts }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={alerts.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <AlertItem alert={alerts[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

#### Debounce Input Handlers

```tsx
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useMemo(
  () => debounce((term) => performSearch(term), 300),
  []
);

<input
  onChange={(e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  }}
/>
```

**Expected Improvement:** 40-60% fewer renders

### 8. Caching Strategy

Implement multi-layer caching.

#### Browser Cache (Service Worker)

Already implemented in PWA service worker:
- Static assets: Cache-first
- API responses: Network-first with fallback

#### HTTP Cache Headers

```python
# In backend responses
return Response(
    content=data,
    headers={
        # Public, cache for 1 hour
        "Cache-Control": "public, max-age=3600",
        
        # Or: Private, must revalidate
        "Cache-Control": "private, must-revalidate",
        
        # Expires header
        "Expires": (datetime.now() + timedelta(hours=1)).strftime(...),
        
        # ETag for conditional requests
        "ETag": f'"{hash(data)}"'
    }
)
```

#### Frontend Data Cache

```tsx
// Simple cache hook
function useCachedData(url, ttl = 60000) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const cached = localStorage.getItem(url);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < ttl) {
        setData(data);
        return;
      }
    }
    
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setData(data);
        localStorage.setItem(url, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      });
  }, [url, ttl]);
  
  return data;
}
```

**Expected Improvement:** 80-95% faster subsequent loads

### 9. Lighthouse Audit

Measure and track performance over time.

```bash
# Run Lighthouse audit
npm run build
npm run preview
npx lighthouse http://localhost:4173 --view
```

**Target Scores:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90
- PWA: > 90

### 10. Bundle Analysis

Visualize bundle composition.

```bash
# Install analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});

# Build and view
npm run build
# Opens stats.html in browser
```

## Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Add gzip compression (backend)
2. ✅ Add database indexes
3. ✅ Implement API response pagination
4. ✅ Add lazy loading to images

### Phase 2: Code Splitting (2-3 hours)
5. ⏳ Implement route-based code splitting
6. ⏳ Split recharts library
7. ⏳ Configure manual chunks in Vite

### Phase 3: Rendering (1-2 hours)
8. ⏳ Add React.memo to heavy components
9. ⏳ Implement virtualization for long lists
10. ⏳ Debounce expensive operations

### Phase 4: Caching (2-3 hours)
11. ⏳ Implement HTTP cache headers
12. ⏳ Add frontend data caching
13. ⏳ Optimize WebSocket updates

## Monitoring

### Performance Metrics

Track these metrics in production:

```typescript
// Frontend
performance.measure('initial-load');
performance.measure('time-to-interactive');
performance.measure('largest-contentful-paint');

// Backend
import time

async def track_request_time(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    
    response.headers['X-Response-Time'] = f"{duration:.3f}s"
    logger.info(f"{request.url.path} - {duration:.3f}s")
    
    return response
```

### Database Query Timing

```python
import time

async def execute_with_timing(query, params):
    start = time.time()
    result = await db.execute(query, params)
    duration = time.time() - start
    
    if duration > 0.1:  # Log slow queries
        logger.warning(f"Slow query ({duration:.3f}s): {query[:100]}")
    
    return result
```

## Testing

### Performance Testing Checklist

- [ ] Run Lighthouse audit (score > 90)
- [ ] Test on 3G network (DevTools → Network → Slow 3G)
- [ ] Test on low-end device (throttle CPU 6x)
- [ ] Measure bundle size (target < 500 kB)
- [ ] Check API response times (target < 100ms)
- [ ] Monitor database query times (target < 50ms)
- [ ] Test WebSocket performance (messages/sec)

## Expected Results

### Before Optimization
- Initial load: ~3-4s (3G)
- Bundle size: 698 kB (197 kB gzipped)
- Time to Interactive: ~4-5s
- API response: 100-200ms
- Database queries: 50-100ms

### After Optimization
- Initial load: ~1-2s (3G) ⬇️ 50%
- Bundle size: 300 kB (100 kB gzipped) ⬇️ 60%
- Time to Interactive: ~2-3s ⬇️ 50%
- API response: 30-50ms ⬇️ 70%
- Database queries: 10-20ms ⬇️ 80%

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [FastAPI Performance](https://fastapi.tiangolo.com/deployment/)
- [SQLite Performance](https://www.sqlite.org/performance.html)

---

**Status**: ⏳ Optimization strategies documented
**Priority**: Code splitting (Phase 2) for biggest impact
**Target**: <300 kB bundle, <2s load time, >90 Lighthouse score
