# Thermi-Nator Logo Specifications

## Quick Answer

**Recommended size: 48×48 pixels (square icon)**

Alternative: 40×40px if you prefer smaller, or 160×48px for wide logo with text.

---

## Header Layout Analysis

Current header specifications:
- **Vertical padding**: 16px top + 16px bottom
- **Title font**: 24px (text-2xl) → ~32-40px line height
- **Subtitle**: 14px (text-sm) → ~20px line height  
- **Total header height**: ~84-96px
- **Layout**: Flex container with items-center alignment

---

## Primary Recommendation: 48×48px Square Icon

### Why 48×48px?

✅ **Perfect alignment** with 2xl title text (24px font size)  
✅ **Industry standard** - Matches iOS/Android app icons (48dp)  
✅ **Highly visible** - Large enough to show detail clearly  
✅ **Scales well** - Easy to generate favicon (16×16, 32×32)  
✅ **Professional** - Common size for modern web apps

### Design Considerations

**Must work in both themes:**
- Light mode: White background
- Dark mode: Gray-800 (#1F2937) background

**Keep it simple:**
- Recognizable at small sizes
- Clear, bold shapes
- Minimal detail
- Good contrast

**Theme ideas for heat pump optimization:**
1. **Temperature gauge** with smart indicators
2. **Circular arrows** (cycle/optimization)
3. **Snowflake + flame** merged design
4. **Graph trending up** (efficiency gains)
5. **IQ brain** with temperature elements
6. **House with energy waves**
7. **Heat pump symbol** stylized
8. **Neural network** pattern (AI theme)

---

## Alternative Options

### Option A: 40×40px Square Icon
- Slightly smaller, less prominent
- Good if 48px feels too large
- Still perfectly functional

### Option B: 160×48px Wide Logo
- Horizontal: [Icon 48×48] + "Thermi-Nator" text
- Could replace entire title text
- Better branding integration
- Example: `[🔥] Thermi-Nator`

### Option C: 32×32px Compact Icon
- Minimal, subtle presence
- Matches favicon size
- Might be too small for header
- Better for mobile-only view

---

## Implementation Preview

Logo will be placed like this:

```tsx
<header className="bg-white dark:bg-gray-800 shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      
      {/* Left side: Logo + Title */}
      <div className="flex items-center gap-3">
        <img 
          src="/logo.svg" 
          alt="Thermi-Nator Logo" 
          className="w-12 h-12"  // 48×48px
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Thermi-Nator Optimizer
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your Location
          </p>
        </div>
      </div>

      {/* Right side: Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications, Theme Toggle, etc. */}
      </div>
      
    </div>
  </div>
</header>
```

---

## File Format Recommendations

### 1. SVG (Strongly Recommended)

**Advantages:**
- ✅ Scales to any size perfectly
- ✅ Very small file size (~1-5KB)
- ✅ Can adapt colors for light/dark themes via CSS
- ✅ Crisp on all displays (retina, 4K, etc.)
- ✅ Easy to animate if needed

**Usage:**
```html
<img src="/logo.svg" className="w-12 h-12" alt="Thermi-Nator" />
```

### 2. PNG (Fallback)

**If SVG not available:**
- Export at **2x or 3x size** (96×96 or 144×144)
- Transparent background required
- Separate versions for light/dark themes
- Larger file size (~5-20KB)

---

## Complete Asset Checklist

When generating your logo, create these sizes:

### Header Logo
- [ ] **48×48px** SVG - Main header logo (primary)
- [ ] **96×96px** PNG - Retina fallback (2x)
- [ ] **144×144px** PNG - High DPI fallback (3x)

### Icons & Favicons
- [ ] **16×16px** PNG - Browser favicon
- [ ] **32×32px** PNG - Browser favicon (retina)
- [ ] **180×180px** PNG - Apple touch icon (iOS)
- [ ] **192×192px** PNG - Android PWA icon
- [ ] **512×512px** PNG - PWA splash screen

### Optional
- [ ] **160×48px** SVG - Wide logo variant
- [ ] **40×40px** SVG - Compact variant

---

## Color Palette

Based on your current theme:

**Primary colors:**
- `#3B82F6` - Blue 500 (primary brand color)
- `#10B981` - Emerald 500 (secondary/accent)

**Background contexts:**
- Light mode: `#FFFFFF` (white)
- Dark mode: `#1F2937` (gray-800)

**Text colors:**
- Light mode text: `#111827` (gray-900)
- Dark mode text: `#F9FAFB` (gray-100)

**Recommendations:**
1. Use primary blue (#3B82F6) as main logo color
2. Add emerald green (#10B981) as accent/highlight
3. Test on both white and gray-800 backgrounds
4. Ensure at least 4.5:1 contrast ratio (WCAG AA)

---

## Responsive Behavior

### Desktop (≥1024px)
- Display full **48×48px** logo
- Show complete "Thermi-Nator Optimizer" text

### Tablet (768-1023px)
- Keep **48×48px** or scale to **40×40px**
- Show full text

### Mobile (<768px)
- Use **40×40px** or **32×32px** to save space
- Consider: Icon only, abbreviate text to "Thermi-Nator"
- Or: Keep icon, move location to second line

---

## Design Inspiration

### Conceptual Themes

**Temperature & Optimization:**
- Thermometer with gradient (cold blue → warm red)
- Temperature dial/gauge with optimal zone marked
- Graph line trending upward (efficiency)

**Energy & Smart Tech:**
- Lightning bolt inside house outline
- Circuit board pattern forming "IQ"
- Neural network nodes (AI optimization)

**Heat Pump Specific:**
- Circular arrows (heat cycle)
- Snowflake + flame merged/balanced
- Radiator/heat exchanger symbol stylized

**Minimalist & Modern:**
- Letter "T" + "Q" monogram
- Abstract wave pattern (temperature curves)
- Hexagon with interior detail (tech/precision)

### Style References

Look at logos from:
- **Nest Thermostat** - Simple, recognizable, works at any size
- **Ecobee** - Clean, modern, tech-forward
- **Tado** - Minimal, professional
- **Sense Energy** - Bold, clear icon

---

## Next Steps

1. **Generate logo at 48×48px** (SVG preferred)
2. **Test on both themes** - Light and dark backgrounds
3. **Export required sizes** - See checklist above
4. **Place files in** `/frontend/public/` directory
5. **Update header component** - Add `<img>` tag as shown above
6. **Add to PWA manifest** - For installable app icon

---

## File Locations

After generation, place files here:

```
frontend/public/
├── logo.svg              # Main header logo (48×48)
├── logo-wide.svg         # Optional wide variant (160×48)
├── favicon.ico           # Browser favicon (contains 16×16, 32×32)
├── apple-touch-icon.png  # iOS home screen (180×180)
├── icon-192.png          # Android PWA (192×192)
└── icon-512.png          # PWA splash (512×512)
```

Update manifest.json:
```json
{
  "name": "Thermi-Nator Optimizer",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Questions Before Designing?

**Logo style preference?**
- Minimalist/abstract vs. illustrative/detailed
- Icon only vs. icon + text
- Colorful vs. monochrome (with theme variants)

**Brand personality?**
- Technical/professional vs. friendly/approachable
- Modern/cutting-edge vs. reliable/established
- Smart/AI-focused vs. practical/straightforward

Let me know your preferences and I can provide more specific design direction!
