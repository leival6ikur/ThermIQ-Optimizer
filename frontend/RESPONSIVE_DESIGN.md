# Responsive Design Guide

Thermi-Nator is optimized for all screen sizes: mobile phones, tablets, and desktops.

## Breakpoints

Using Tailwind CSS default breakpoints:

| Breakpoint | Width | Device |
|------------|-------|--------|
| **sm** | 640px+ | Large phones (landscape), small tablets |
| **md** | 768px+ | Tablets |
| **lg** | 1024px+ | Laptops, desktops |
| **xl** | 1280px+ | Large desktops |
| **2xl** | 1536px+ | Extra large screens |

## Design Principles

### 1. Mobile-First Approach

Base styles target mobile devices, with progressively enhanced layouts for larger screens:

```tsx
// Mobile: single column
// Tablet: two columns  
// Desktop: three columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {cards.map(...)}
</div>
```

### 2. Touch-Friendly Targets

All interactive elements meet the 44x44px minimum touch target size:

```tsx
// Buttons automatically have min-h-[44px] min-w-[44px]
<button className="btn-primary">Action</button>

// Custom elements
<div className="touch-target">
  <Icon />
</div>
```

### 3. Flexible Layouts

Content adapts fluidly to screen size without horizontal scrolling:

```tsx
// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">
  {content}
</div>

// Responsive card padding
<div className="card"> {/* auto: p-4 sm:p-6 */}
  {content}
</div>
```

### 4. Progressive Disclosure

Show more information as screen space increases:

```tsx
// Hide on mobile, show on larger screens
<span className="hidden sm:inline">Additional details</span>

// Show on mobile only
<div className="sm:hidden">Mobile menu</div>
```

## Component Patterns

### Responsive Grid

```tsx
// Auto-fit: adjusts columns based on content
<div className="grid-auto-fit">
  <Card title="Card 1" />
  <Card title="Card 2" />
  <Card title="Card 3" />
</div>

// Auto-fill: maintains min width
<div className="grid-auto-fill">
  {items.map(...)}
</div>
```

### Responsive Navigation

Desktop: Horizontal nav bar
Mobile: Bottom navigation bar or drawer

```tsx
// Bottom nav (mobile only)
<nav className="mobile-nav">
  <NavItem icon={<HomeIcon />} label="Home" />
  <NavItem icon={<ChartIcon />} label="Stats" />
  <NavItem icon={<SettingsIcon />} label="Settings" />
</nav>

// Drawer navigation
<div className="drawer" data-open={isOpen}>
  <NavLinks />
</div>
```

### Responsive Cards

```tsx
// Standard card with responsive padding
<div className="card">
  <h3 className="text-lg sm:text-xl font-semibold">Title</h3>
  <p className="text-mobile">Description</p>
</div>

// Collapsible card (mobile)
<div className="card-collapsible" data-collapsed={collapsed}>
  <div className="flex justify-between items-center">
    <h3>Title</h3>
    <button onClick={toggle} className="sm:hidden">
      <ChevronIcon />
    </button>
  </div>
  <div className="card-content">
    {/* Hidden when collapsed on mobile */}
  </div>
</div>
```

### Responsive Tables

```tsx
// Horizontal scroll on mobile
<div className="table-responsive">
  <table className="min-w-full">
    <thead>
      <tr>
        <th>Column 1</th>
        <th>Column 2</th>
        <th className="hidden md:table-cell">Column 3</th>
      </tr>
    </thead>
    <tbody>{/* ... */}</tbody>
  </table>
</div>

// Alternative: Card layout on mobile
<div className="hidden sm:block">
  <Table data={data} />
</div>
<div className="sm:hidden">
  {data.map(item => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

### Responsive Charts

```tsx
// Chart container with responsive height
<div className="chart-container">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      {/* Chart content */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

### Responsive Modals

```tsx
// Bottom sheet on mobile, centered modal on desktop
<div className="modal">
  <div className="modal-content">
    <div className="p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl">Modal Title</h2>
      {content}
    </div>
  </div>
</div>
```

## Typography

### Responsive Font Sizes

```tsx
// Headings scale with screen size
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Page Title
</h1>

<h2 className="text-xl sm:text-2xl font-semibold">
  Section Title
</h2>

<p className="text-sm sm:text-base">
  Body text
</p>

// Use text-mobile utility
<span className="text-mobile">Responsive text</span>
```

### Line Height & Spacing

```tsx
// More line height on mobile for better readability
<p className="leading-relaxed sm:leading-normal">
  Long paragraph text...
</p>

// Responsive margins
<div className="mb-4 sm:mb-6 lg:mb-8">
  {content}
</div>
```

## Layout Patterns

### Dashboard Grid

```tsx
// 1 column mobile, 2 columns tablet, 3 columns desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <StatCard title="Energy" value="82 kWh" />
  <StatCard title="Cost" value="€21.50" />
  <StatCard title="Savings" value="14%" />
</div>
```

### Sidebar Layout

```tsx
// Stacked on mobile, sidebar on desktop
<div className="flex flex-col lg:flex-row gap-4">
  {/* Sidebar */}
  <aside className="w-full lg:w-64 flex-shrink-0">
    <Navigation />
  </aside>
  
  {/* Main content */}
  <main className="flex-1">
    <Content />
  </main>
</div>
```

### Form Layout

```tsx
// Single column mobile, two column desktop
<form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div className="sm:col-span-2">
    <Input label="Full width field" />
  </div>
  <div>
    <Input label="Half width 1" />
  </div>
  <div>
    <Input label="Half width 2" />
  </div>
</form>
```

## Mobile-Specific Enhancements

### Safe Area Insets (iOS)

```css
/* Handle notches and rounded corners */
.mobile-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

.modal-content {
  padding-top: env(safe-area-inset-top);
}
```

### Disable Text Selection (Interactive Elements)

```tsx
<button className="select-none">
  Button
</button>
```

### Optimize Tap Delays

```tsx
// Automatically applied to all buttons
// via touch-manipulation in btn-primary/btn-secondary
```

### Horizontal Scrolling (When Necessary)

```tsx
// Snap scrolling for better UX
<div className="flex gap-4 overflow-x-auto snap-x snap-mandatory">
  {items.map(item => (
    <div className="flex-shrink-0 w-64 snap-start">
      <Card {...item} />
    </div>
  ))}
</div>
```

## Performance Considerations

### Images

```tsx
// Responsive images
<img
  src="/logo.svg"
  alt="Thermi-Nator"
  className="w-24 sm:w-32 lg:w-40 h-auto"
/>

// Lazy loading
<img loading="lazy" src="..." alt="..." />
```

### Conditional Rendering

```tsx
// Only render heavy components on larger screens
{isDesktop && <AdvancedChart data={data} />}
{isMobile && <SimplifiedChart data={data} />}

// Using media query hook
const isMobile = useMediaQuery('(max-width: 640px)');
```

### Debounced Resize Handlers

```tsx
useEffect(() => {
  const handleResize = debounce(() => {
    // Handle resize
  }, 250);

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Testing

### Responsive Testing Checklist

- [ ] Test on actual devices (iOS, Android)
- [ ] Test in DevTools responsive mode
- [ ] Test portrait and landscape orientations
- [ ] Test with browser zoom (150%, 200%)
- [ ] Test touch interactions (tap, swipe, pinch)
- [ ] Test keyboard navigation
- [ ] Test with large text (accessibility settings)

### Device Targets

**Primary:**
- iPhone 12/13/14 (390x844)
- Samsung Galaxy S21 (360x800)
- iPad (768x1024)
- MacBook (1440x900)

**Secondary:**
- iPhone SE (375x667)
- iPad Pro (1024x1366)
- Large desktop (1920x1080)

### Browser DevTools

**Chrome DevTools:**
1. F12 → Toggle device toolbar (Ctrl+Shift+M)
2. Select device preset or custom dimensions
3. Test touch events (click "Toggle touch" icon)

**Firefox DevTools:**
1. F12 → Responsive Design Mode (Ctrl+Shift+M)
2. Select device or custom size
3. Rotate device orientation

## Common Issues & Solutions

### Issue: Horizontal Scroll on Mobile

**Solution:** Add `overflow-x-hidden` to body:

```tsx
// In App.tsx or index.css
<div className="overflow-x-hidden">
  {content}
</div>
```

### Issue: Tap Delays on iOS

**Solution:** Already handled by `touch-manipulation` on buttons.

### Issue: Charts Too Small on Mobile

**Solution:** Use responsive height:

```tsx
<div className="h-64 sm:h-80 md:h-96">
  <Chart />
</div>
```

### Issue: Text Too Small on Mobile

**Solution:** Use responsive text sizes:

```tsx
// Instead of fixed text-base
<p className="text-sm sm:text-base">Text</p>
```

### Issue: Buttons Too Close Together

**Solution:** Add gap spacing:

```tsx
<div className="flex gap-2 sm:gap-4">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>
```

## Utilities Reference

### Responsive Padding

```
p-4    → padding: 1rem (all screens)
sm:p-6 → padding: 1.5rem (≥640px)
lg:p-8 → padding: 2rem (≥1024px)
```

### Responsive Grid

```
grid-cols-1    → 1 column (mobile)
sm:grid-cols-2 → 2 columns (≥640px)
lg:grid-cols-3 → 3 columns (≥1024px)
```

### Responsive Display

```
hidden        → display: none
sm:block      → display: block (≥640px)
lg:flex       → display: flex (≥1024px)
```

### Responsive Text

```
text-sm       → font-size: 0.875rem
sm:text-base  → font-size: 1rem (≥640px)
lg:text-lg    → font-size: 1.125rem (≥1024px)
```

## Resources

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)
- [Web.dev Responsive](https://web.dev/responsive-web-design-basics/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Material Design Responsive Layout](https://material.io/design/layout/responsive-layout-grid.html)

---

**Status**: ✅ Responsive design utilities added
**Coverage**: Mobile, tablet, desktop optimized
**Touch targets**: 44x44px minimum (iOS/Android standard)
**Testing**: Use actual devices for final validation
