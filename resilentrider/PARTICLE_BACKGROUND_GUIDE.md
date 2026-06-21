# Global Particle Background - Installation & Usage Guide

## ✅ Already Installed Dependencies

The following packages are already installed in your project:
- `@tsparticles/react@3.0.0`
- `@tsparticles/slim@3.9.1`
- `tsparticles@3.9.1`

## 📦 If You Need to Reinstall

If you need to reinstall the packages, run:

```bash
npm install @tsparticles/react @tsparticles/slim tsparticles
```

## 🎨 Features Implemented

### ✅ Global Coverage
- Particle background appears on **every page** of the website
- Fixed positioning behind all content
- Works seamlessly with React Router navigation

### ✅ Visual Effects
- **Small floating dots** with subtle glow (2-4px size)
- **Soft shadow effect** using accent color (#E0B88F)
- **Thin connecting lines** between nearby particles (opacity: 0.2)
- **Color palette**: Primary (#112250), Secondary (#3C5070), Accent (#E0B88F)

### ✅ Interactive Features
- **Hover Repulse**: Particles move away when cursor approaches (100px distance)
- **Grab Effect**: Lines appear connecting particles near cursor (150px distance)
- **Click to Add**: Click anywhere to add 2 new particles
- **Smooth animations**: Gentle floating movement in random directions

### ✅ Performance Optimizations
- **Desktop**: 70 particles
- **Mobile**: 40 particles (reduced for performance)
- **FPS Limit**: 60fps for smooth performance
- **Pause on blur**: Stops when tab is inactive
- **Reduced motion support**: Respects user accessibility preferences

### ✅ Mobile Optimizations
- Hover effects disabled on mobile (touch devices)
- Fewer particles on small screens
- Slightly reduced opacity (0.7) on mobile
- Optimized for touch interactions

## 📁 File Structure

```
src/
├── components/
│   ├── GlobalParticleBackground.jsx    # Main component
│   └── GlobalParticleBackground.css    # Styling
└── App.jsx                              # Integration point
```

## 🔧 Implementation Details

### Component Location
`src/components/GlobalParticleBackground.jsx`

### Integration in App.jsx
```jsx
import GlobalParticleBackground from './components/GlobalParticleBackground';

function App() {
  return (
    <BrowserRouter>
      <GlobalParticleBackground />  {/* Added at top level */}
      {/* Rest of your app */}
    </BrowserRouter>
  );
}
```

### CSS Positioning
- `position: fixed` - Stays in viewport
- `z-index: -1` - Behind all content
- `pointer-events: auto` - Allows interaction
- `width: 100%` and `height: 100%` - Full coverage

## 🎮 Interaction Modes

### 1. Hover Repulse
- **Distance**: 100px
- **Duration**: 0.4s
- **Effect**: Particles smoothly move away from cursor

### 2. Grab (Connect Lines)
- **Distance**: 150px
- **Line Color**: #E0B88F (accent)
- **Opacity**: 0.6
- **Effect**: Lines appear between cursor and nearby particles

### 3. Click to Push
- **Quantity**: 2 particles added per click
- **Effect**: New particles spawn at click location

## 🎨 Particle Configuration

### Colors
- Primary: `#112250` (Deep Navy)
- Secondary: `#3C5070` (Slate Blue)
- Accent: `#E0B88F` (Warm Beige)

### Movement
- **Speed**: 0.8 (slow, gentle)
- **Direction**: Random
- **Bounce**: Particles bounce off edges

### Appearance
- **Size**: 2-4px (animated)
- **Opacity**: 0.3-0.6 (animated)
- **Shadow**: 8px blur with accent color
- **Links**: 1px width, 150px distance

## 🚀 How to Run

1. **Navigate to project directory**:
   ```bash
   cd c:\Users\kaviy\OneDrive\Desktop\rrapp\resilentrider
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   - URL: `http://localhost:5173`
   - The particles will be visible on all pages

## 🐛 Troubleshooting

### Particles not visible?
1. Check browser console for errors (F12)
2. Verify packages are installed: `npm list @tsparticles/react`
3. Clear cache: `Ctrl + Shift + R` (hard refresh)
4. Restart dev server: `Ctrl + C` then `npm run dev`

### Performance issues?
- Reduce particle count in `GlobalParticleBackground.jsx`
- Change `value: isMobile ? 40 : 70` to lower numbers
- Disable shadow effect by setting `shadow.enable: false`

### Particles blocking UI?
- Check `z-index: -1` in CSS
- Verify `pointer-events: auto` is set correctly

## 📱 Mobile Considerations

The component automatically:
- Reduces particle count (40 vs 70)
- Disables hover effects
- Reduces opacity slightly
- Optimizes performance

## ♿ Accessibility

Respects `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  .global-particle-background {
    display: none;
  }
}
```

## 🎯 Testing Checklist

- [ ] Particles visible on Home page
- [ ] Particles visible on all other pages
- [ ] Hover repulse works (desktop)
- [ ] Lines appear on hover
- [ ] Click adds particles
- [ ] Smooth animations
- [ ] No performance lag
- [ ] Mobile optimization works
- [ ] Particles stay behind UI elements

## 📊 Performance Metrics

- **FPS**: Locked at 60fps
- **Particle Count**: 40-70 (adaptive)
- **CPU Usage**: Minimal (optimized with slim version)
- **Memory**: Low footprint

## 🔄 Updates & Customization

To customize, edit `GlobalParticleBackground.jsx`:

**Change particle count**:
```javascript
value: isMobile ? 40 : 70  // Adjust these numbers
```

**Change colors**:
```javascript
color: {
  value: ['#112250', '#3C5070', '#E0B88F']  // Your colors
}
```

**Change speed**:
```javascript
speed: 0.8  // Lower = slower, Higher = faster
```

**Change interaction distance**:
```javascript
repulse: {
  distance: 100  // Adjust repulse distance
}
```

## ✨ Result

You now have a beautiful, interactive particle background that:
- ✅ Works globally across all pages
- ✅ Responds to mouse movement
- ✅ Connects particles with lines
- ✅ Has smooth, fluid animations
- ✅ Is optimized for performance
- ✅ Works on mobile and desktop
- ✅ Stays behind all UI elements

Enjoy your interactive particle background! 🎉
