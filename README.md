# Wall Calendar Assignment

A polished Next.js wall calendar component with an elegant physical design and intuitive date planning features.

## ✨ Key Features

### 📅 Calendar & Date Selection
- **Physical wall-calendar design** with hanging threads and nails
- **Drag-to-select** date ranges directly on the calendar
- **Click-based selection** for single dates or quick ranges
- **Visual range preview** while dragging
- **Clear button** to reset selected range

### 📝 Notes & Annotations
- **Monthly memo** - add reminders, goals, or deadlines for the entire month
- **Range notes** - attach tagged notes to specific dates or date ranges
- **Emoji tagging** - label notes with Birthday 🎂, Office 🏢, Holiday 🏖️, or Travel ✈️
- **Bookmark icons** - automatic bookmark pin (📌) for plain text notes
- **Hover tooltips** - see linked notes and their details when hovering over calendar dates
- **Saved annotations** - view all range notes for the month organized by date

### ✅ Task Management
- **Monthly to-do list** with up to 90 characters per task
- **Priority system** with 3 color-coded indicators:
  - 🔴 **Urgent** (red) - high priority tasks
  - ⚫ **Complete Today** (black) - tasks for today
  - ⚪ **Rest** (white) - general/low priority
- **Task completion** - mark tasks as done with checkboxes
- **Quick delete** - remove tasks with one click

### 🎨 Design & Customization
- **Hero image upload** - personalize with custom header image
- **Background tone presets** - choose calming color schemes (Warm, Cool, Neutral, etc.)
- **IPL live scores** - real-time cricket match updates (desktop view only)
- **Responsive design** - optimized layouts for desktop, tablet, and mobile
- **Enhanced visuals** - 3D thread and nail effects with refined shadows

### 📱 Mobile Experience
On phones, the layout reorganizes for better usability:
1. Hero image
2. Selection note area
3. Calendar grid
4. Monthly memo
5. To-do list
6. Saved annotations

### 💾 Data Persistence
- **IndexedDB** - stores uploaded hero images
- **localStorage** - persists all calendar state (notes, tasks, selections, settings)
- **Auto-save** - changes save instantly as you edit


## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - type-safe development
- **CSS Modules** - component-scoped styling
- **IndexedDB** - browser-based storage for media
- **localStorage** - persistent app state
