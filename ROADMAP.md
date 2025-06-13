DNS Records UI Redesign – Context Snapshot (June 2025)
Overall Goals:

Modern, clean UI for DNS record viewer with powerful but intuitive filtering/sorting

Mobile and desktop UX tailored separately

Prioritize common real-world use cases: quick lookup > sorting > advanced filtering

✅ Layout Paradigm
Mobile:

Sticky top bar with global search (searches all fields)

Hamburger icon opens slide-in modal for filters and sort

Sort + filters are secondary (hidden by default)

Desktop:

Sticky top bar with global search only

Hamburger icon opens a left sidebar for filters and sort (persistent or toggleable)

Optionally modal-based filter/sort panel is acceptable if better UX

✅ Sorting UX
Default sort = dnsRecord.name, ascending

Use chips for active sort criteria:

[Record Name ↑ ✕] [Host ↓ ✕] [+ Add]

Clicking chip opens modal to edit sort field + direction

Clicking ✕ removes that sort level

+ Add button opens modal with remaining available sort fields

✅ Filtering UX
Use pill-style selectable chips (not plain checkboxes)

Organize filters into logical groups (Record Type, Hostname, etc.)

Style filters as cards in a grid layout (on desktop)

Support text input filters (e.g. container name) with unified styling

✅ Component Plan
TopBar.tsx: sticky bar with search and filter toggle

FilterSortDrawer.tsx: filter/sort sidebar (desktop) or modal (mobile)

SortChips.tsx: chip UI for displaying/modifying current sort

SortModal.tsx: modal for adding/editing sort levels

StyledFacet.tsx: pill-style multi-select input for filters

🧠 Design Principles
Search-first, filter/sort secondary

Clean visual hierarchy and spacing

Avoid clunky native elements (unstyled checkboxes, selects)

Responsive and unified UX between mobile and desktop

You can paste this into ChatGPT later and say:

“Here’s my design context — I want to implement [component]. Stick with these paradigms.”

Let me know if you want it as a downloadable .md file too.