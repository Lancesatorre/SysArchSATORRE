# SitInSatorre Design Guide

This document outlines the design system, color palette, and UI patterns used in the **SitInSatorre** College of Computer Studies Sit-in Monitoring System. Use this guide to maintain consistency when creating new pages or components.

## 🎨 Color Palette

The system uses a vibrant palette with high-contrast accents, primarily orange and deep purple.

### Primary Colors
| Color | Hex | Usage | Tailwind Class |
| :--- | :--- | :--- | :--- |
| **Orange (Action)** | `#ff9100` | Buttons, Active Links, Highlights, Primary Icons | `bg-[#ff9100]`, `text-[#ff9100]` |
| **Deep Purple (Brand)** | `#3c096c` | Headers, Badges, Brand Text, Secondary Buttons | `bg-[#3c096c]`, `text-[#3c096c]` |
| **Deepest Purple** | `#1a0030` | Main Headings, Hero Text | `text-[#1a0030]` |

### Status Colors
| Status | Background (Alpha) | Text/Stroke | Usage |
| :--- | :--- | :--- | :--- |
| **Success / Reservation** | `rgba(74,222,128,0.12)` | `#4ade80` | Confirmed reservations, success alerts |
| **Warning / Sit-in** | `rgba(255,145,0,0.15)` | `#ff9100` | Active sit-ins, warning messages |
| **System / Neutral** | `rgba(100,100,120,0.15)` | `#7b5fa8` | General notifications, system logs |
| **Academic / Blue** | `bg-blue-50` | `text-blue-600` | Academic announcements |
| **General / Violet** | `bg-violet-50` | `text-violet-600` | General notices |

---

## 🔡 Typography

- **Primary Font:** `Poppins, sans-serif`
- **Headings:** Bold to Black (weight 700-900), tracking-tight.
- **Body:** Regular (weight 400), gray-500 for secondary text.

```css
body {
  font-family: "Poppins", sans-serif;
}
```

---

## 🧩 UI Components & Patterns

### 1. Buttons
Buttons should be highly rounded (`rounded-full`) and have hover transitions.

- **Primary Button:**
  ```jsx
  <button className="bg-[#ff9100] text-[#3c096c] font-bold px-8 py-3 rounded-full hover:bg-orange-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
    Action Text
  </button>
  ```
- **Secondary/Outline Button:**
  ```jsx
  <button className="text-[#3c096c] font-semibold px-8 py-3 rounded-full border-2 border-[#3c096c]/30 hover:border-[#3c096c] hover:bg-[#3c096c]/5 transition-all duration-300">
    Secondary Action
  </button>
  ```

### 2. Cards & Containers
- **Border Radius:** Use `rounded-2xl` for large cards and `rounded-xl` for smaller ones.
- **Glassmorphism:** Use low-opacity backgrounds for a modern feel.
  ```jsx
  <div className="bg-[#3c096c]/10 border border-[#3c096c]/20 rounded-full px-4 py-2">
    Badge Content
  </div>
  ```

### 3. Navigation Links
Active links should use a bottom border and the primary orange color.
```jsx
<Link
  to={to}
  style={{
    color: isActive ? '#ff9100' : undefined,
    borderBottom: isActive ? '2.5px solid #ff9100' : '2.5px solid transparent',
  }}
  className="hover:text-[#ff9100] transition duration-300 px-3"
>
  Link Name
</Link>
```

---

## 🖼️ Iconography

- **Library:** `lucide-react` is installed and preferred.
- **Custom Icons:** Use `strokeWidth={1.8}` and `currentColor` for SVG icons.
- **Icon Color:** Use `#ff9100` for featured icons on light backgrounds.

---

## 📐 Layout & Spacing

- **Max Width:** Most pages should be wrapped in `max-w-6xl mx-auto px-6`.
- **Transitions:** Default transition is `duration-300`.
- **Spacing:** Use consistent Tailwind spacing (e.g., `gap-4`, `p-6`, `mb-8`).

---

## 🌑 Future Considerations: Dark Mode

When implementing dark mode:
- **Background:** `#1a1a1a`
- **Surface:** `#2d2d2d`
- **Text:** `#f5f5f5`
- **Borders:** `#404040`

Refer to `STUDENT_FEATURES.md` for the full Dark Mode implementation plan.
