# Part Notes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add ability to attach personal notes to parts, with a dedicated notes list screen.

**Architecture:** Mirror the bookmarks feature - notes table in SQLite, Go functions for CRUD, inline textarea editor on part detail screen, dedicated notes list screen accessible from home menu.

**Tech Stack:** SQLite, Go (Bubble Tea TUI framework), Deno (schema migrations)

---

## Task 1: Add Notes Table Schema

**Files:**
- Modify: `scraper/src/db/schema.ts:75-83` (after bookmarks table)

**Step 1: Add notes table creation**

Add after the bookmarks table creation (line 83):

```typescript
  // Notes table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_id INTEGER NOT NULL UNIQUE,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
```

**Step 2: Test migration runs**

Run: `cd scraper && deno task scrape --help`
Expected: No errors (schema loads successfully)

**Step 3: Commit**

```bash
git add scraper/src/db/schema.ts
git commit -m "feat(schema): add notes table for user part notes"
```

---

## Task 2: Add Notes Table to TUI Database Open

**Files:**
- Modify: `tui/db/db.go:21-33` (after bookmarks table creation in Open function)

**Step 1: Add notes table creation in Open()**

Add after the bookmarks table creation (around line 33), before the `return`:

```go
	// Ensure notes table exists
	err = sqlitex.ExecuteTransient(conn, `
		CREATE TABLE IF NOT EXISTS notes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			part_id INTEGER NOT NULL UNIQUE,
			content TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP
		)
	`, nil)
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("create notes table: %w", err)
	}
```

**Step 2: Test build**

Run: `cd tui && go build ./...`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add tui/db/db.go
git commit -m "feat(db): ensure notes table exists on TUI startup"
```

---

## Task 3: Add NoteResult Type

**Files:**
- Modify: `tui/db/types.go:62` (after BookmarkResult)

**Step 1: Add NoteResult struct**

Add after `BookmarkResult` struct (after line 62):

```go
type NoteResult struct {
	ID           int
	PartID       int
	Content      string
	PartNumber   string
	PNC          *string
	Description  *string
	GroupName    string
	SubgroupName *string
	UpdatedAt    string
}
```

**Step 2: Test build**

Run: `cd tui && go build ./...`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add tui/db/types.go
git commit -m "feat(db): add NoteResult type"
```

---

## Task 4: Add Note Database Functions

**Files:**
- Modify: `tui/db/db.go:280` (after GetBookmarkCount)

**Step 1: Add SetNote function**

Add after `GetBookmarkCount` (after line 280):

```go
func (d *DB) SetNote(partID int, content string) error {
	return sqlitex.ExecuteTransient(d.conn, `
		INSERT INTO notes (part_id, content) VALUES (?, ?)
		ON CONFLICT(part_id) DO UPDATE SET content = ?, updated_at = CURRENT_TIMESTAMP
	`, &sqlitex.ExecOptions{
		Args: []any{partID, content, content},
	})
}
```

**Step 2: Add RemoveNote function**

```go
func (d *DB) RemoveNote(partID int) error {
	return sqlitex.ExecuteTransient(d.conn, "DELETE FROM notes WHERE part_id = ?", &sqlitex.ExecOptions{
		Args: []any{partID},
	})
}
```

**Step 3: Add GetNote function**

```go
func (d *DB) GetNote(partID int) (*string, error) {
	var content *string
	err := sqlitex.Execute(d.conn, "SELECT content FROM notes WHERE part_id = ?", &sqlitex.ExecOptions{
		Args: []any{partID},
		ResultFunc: func(stmt *sqlite.Stmt) error {
			c := stmt.ColumnText(0)
			content = &c
			return nil
		},
	})
	return content, err
}
```

**Step 4: Add GetNotes function**

```go
func (d *DB) GetNotes() ([]NoteResult, error) {
	var notes []NoteResult
	err := sqlitex.Execute(d.conn, `
		SELECT n.id, n.part_id, n.content, n.updated_at,
			   p.part_number, p.pnc, p.description,
			   g.name, s.name
		FROM notes n
		JOIN parts p ON n.part_id = p.id
		JOIN groups g ON p.group_id = g.id
		LEFT JOIN subgroups s ON p.subgroup_id = s.id
		ORDER BY n.updated_at DESC
	`, &sqlitex.ExecOptions{
		ResultFunc: func(stmt *sqlite.Stmt) error {
			notes = append(notes, NoteResult{
				ID:           stmt.ColumnInt(0),
				PartID:       stmt.ColumnInt(1),
				Content:      stmt.ColumnText(2),
				UpdatedAt:    stmt.ColumnText(3),
				PartNumber:   stmt.ColumnText(4),
				PNC:          nullableString(stmt, 5),
				Description:  nullableString(stmt, 6),
				GroupName:    stmt.ColumnText(7),
				SubgroupName: nullableString(stmt, 8),
			})
			return nil
		},
	})
	return notes, err
}
```

**Step 5: Add GetNoteCount function**

```go
func (d *DB) GetNoteCount() (int, error) {
	var count int
	err := sqlitex.Execute(d.conn, "SELECT COUNT(*) FROM notes", &sqlitex.ExecOptions{
		ResultFunc: func(stmt *sqlite.Stmt) error {
			count = stmt.ColumnInt(0)
			return nil
		},
	})
	return count, err
}
```

**Step 6: Test build**

Run: `cd tui && go build ./...`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add tui/db/db.go
git commit -m "feat(db): add note CRUD functions"
```

---

## Task 5: Add Key Bindings

**Files:**
- Modify: `tui/ui/keys.go:31` (after IsBookmark)

**Step 1: Add IsNote function**

Add after `IsBookmark` (after line 31):

```go
func IsNote(msg tea.KeyMsg) bool {
	return msg.String() == "n"
}

func IsSaveNote(msg tea.KeyMsg) bool {
	return msg.Type == tea.KeyCtrlS
}
```

**Step 2: Test build**

Run: `cd tui && go build ./...`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add tui/ui/keys.go
git commit -m "feat(ui): add note key bindings (n, ctrl+s)"
```

---

## Task 6: Add Notes Screen Type

**Files:**
- Modify: `tui/model/screen.go`

**Step 1: Add ScreenNotes constant**

Update the const block (lines 5-12) to add `ScreenNotes`:

```go
const (
	ScreenHome ScreenType = iota
	ScreenGroup
	ScreenSubgroup
	ScreenPartDetail
	ScreenSearch
	ScreenBookmarks
	ScreenNotes
)
```

**Step 2: Add NotesScreen function**

Add after `BookmarksScreen` (after line 45):

```go
func NotesScreen() Screen {
	return Screen{Type: ScreenNotes}
}
```

**Step 3: Test build**

Run: `cd tui && go build ./...`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add tui/model/screen.go
git commit -m "feat(model): add ScreenNotes type"
```

---

## Task 7: Create Notes Screen Model

**Files:**
- Create: `tui/model/notes.go`

**Step 1: Create notes.go**

Create `tui/model/notes.go`:

```go
package model

import (
	"fmt"
	"strings"

	"delica-tui/db"
	"delica-tui/ui"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type NotesModel struct {
	db    *db.DB
	notes []db.NoteResult
	menu  *ui.Menu
}

func NewNotesModel(database *db.DB) *NotesModel {
	notes, _ := database.GetNotes()

	var items []ui.MenuItem
	for _, n := range notes {
		label := n.PartNumber
		if n.PNC != nil {
			label = fmt.Sprintf("[%s] %s", *n.PNC, n.PartNumber)
		}

		// Truncate note content for hint display
		hint := n.Content
		if len(hint) > 60 {
			hint = hint[:57] + "..."
		}
		// Replace newlines with spaces for single-line display
		hint = strings.ReplaceAll(hint, "\n", " ")

		items = append(items, ui.MenuItem{
			ID:    fmt.Sprintf("%d", n.PartID),
			Label: label,
			Hint:  hint,
		})
	}

	return &NotesModel{
		db:    database,
		notes: notes,
		menu:  ui.NewMenu(items),
	}
}

func (m *NotesModel) Update(msg tea.Msg) (*NotesModel, tea.Cmd, *Screen) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		if ui.IsUp(msg) {
			m.menu.Up()
		}
		if ui.IsDown(msg) {
			m.menu.Down()
		}
		if ui.IsEnter(msg) {
			if item := m.menu.Selected(); item != nil {
				var partID int
				fmt.Sscanf(item.ID, "%d", &partID)
				s := PartDetailScreen(partID, false)
				return m, nil, &s
			}
		}
	}
	return m, nil, nil
}

func (m *NotesModel) View(width, height int) string {
	if width == 0 {
		width = 80
	}
	if height == 0 {
		height = 24
	}

	// Header
	headerStyle := lipgloss.NewStyle().
		Width(width - 2).
		Padding(1, 1, 0, 1).
		Align(lipgloss.Right)

	header := headerStyle.Render(ui.DimStyle.Render("esc back"))

	// Split pane content
	splitHeight := height - 5
	if splitHeight < 10 {
		splitHeight = 10
	}

	leftContent := m.renderLeftPane(splitHeight)
	rightContent := m.renderRightPane(splitHeight)

	split := ui.RenderSplitPane(leftContent, rightContent, width-2, splitHeight)

	return header + "\n" + split
}

func (m *NotesModel) renderLeftPane(height int) string {
	var lines []string

	lines = append(lines, ui.HeaderStyle.Render("NOTES"))
	lines = append(lines, "")
	lines = append(lines, fmt.Sprintf("%d parts with notes", len(m.notes)))
	lines = append(lines, "")
	lines = append(lines, ui.DimStyle.Render("Press n on any part"))
	lines = append(lines, ui.DimStyle.Render("to add a note"))

	// Pad to fill height
	for len(lines) < height {
		lines = append(lines, "")
	}

	return strings.Join(lines, "\n")
}

func (m *NotesModel) renderRightPane(height int) string {
	var b strings.Builder

	// Header
	b.WriteString(ui.HeaderStyle.Render("PARTS WITH NOTES"))
	b.WriteString("\n")
	b.WriteString(ui.DimStyle.Render("─────────────────────────────────"))

	// Adjust menu visible items based on available height (max 15)
	menuHeight := height - 5
	if menuHeight < 5 {
		menuHeight = 5
	}
	if menuHeight > 15 {
		menuHeight = 15
	}
	m.menu.MaxVisibleItems = menuHeight

	// One less blank line if menu scrolls (to account for scroll indicator)
	if len(m.menu.Items) > m.menu.MaxVisibleItems {
		b.WriteString("\n")
	} else {
		b.WriteString("\n\n")
	}

	// Menu
	if len(m.notes) == 0 {
		b.WriteString(ui.DimStyle.Render("No notes yet"))
		b.WriteString("\n\n")
		b.WriteString(ui.DimStyle.Render("Navigate to a part and"))
		b.WriteString("\n")
		b.WriteString(ui.DimStyle.Render("press 'n' to add a note"))
	} else {
		b.WriteString(m.menu.View())
	}

	b.WriteString("\n\n")
	b.WriteString(ui.DimStyle.Render("↑↓ navigate   enter select"))

	return b.String()
}
```

**Step 2: Test build**

Run: `cd tui && go build ./...`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add tui/model/notes.go
git commit -m "feat(model): add notes screen"
```

---

## Task 8: Add Notes to Home Screen

**Files:**
- Modify: `tui/model/home.go`

**Step 1: Add noteCount field to HomeModel**

Update `HomeModel` struct (lines 39-44):

```go
type HomeModel struct {
	db            *db.DB
	groups        []db.Group
	bookmarkCount int
	noteCount     int
	menu          *ui.Menu
}
```

**Step 2: Fetch note count in NewHomeModel**

Update `NewHomeModel` (around line 48), after `bookmarkCount`:

```go
func NewHomeModel(database *db.DB) *HomeModel {
	groups, _ := database.GetGroups()
	bookmarkCount, _ := database.GetBookmarkCount()
	noteCount, _ := database.GetNoteCount()
```

**Step 3: Add notes menu item**

Update the menu items section (after bookmarks item, around line 60):

```go
	bookmarkHint := ""
	if bookmarkCount > 0 {
		bookmarkHint = fmt.Sprintf("%d saved", bookmarkCount)
	}
	items = append(items, ui.MenuItem{ID: "__bookmarks__", Label: "* Bookmarks", Hint: bookmarkHint})

	noteHint := ""
	if noteCount > 0 {
		noteHint = fmt.Sprintf("%d parts", noteCount)
	}
	items = append(items, ui.MenuItem{ID: "__notes__", Label: "# Notes", Hint: noteHint})
```

**Step 4: Update HomeModel return to include noteCount**

Update the return statement (around line 70):

```go
	return &HomeModel{
		db:            database,
		groups:        groups,
		bookmarkCount: bookmarkCount,
		noteCount:     noteCount,
		menu:          ui.NewMenu(items),
	}
```

**Step 5: Handle notes navigation in Update**

Update the switch in `Update` (around line 101-103), add after `__bookmarks__` case:

```go
				case "__bookmarks__":
					s := BookmarksScreen()
					return m, nil, &s
				case "__notes__":
					s := NotesScreen()
					return m, nil, &s
```

**Step 6: Test build**

Run: `cd tui && go build ./...`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add tui/model/home.go
git commit -m "feat(home): add notes entry to home menu"
```

---

## Task 9: Wire Notes Screen in Main Model

**Files:**
- Modify: `tui/model/model.go` (main model that handles screen transitions)

**Step 1: Find and read model.go**

Run: `cat tui/model/model.go` to understand the structure.

**Step 2: Add NotesModel field**

Add `notes *NotesModel` to the Model struct fields.

**Step 3: Add ScreenNotes case in navigation**

In the screen transition logic, add handling for `ScreenNotes`:

```go
case ScreenNotes:
	m.notes = NewNotesModel(m.db)
```

**Step 4: Add ScreenNotes case in Update**

In the Update method's switch on screen type:

```go
case ScreenNotes:
	var next *Screen
	m.notes, cmd, next = m.notes.Update(msg)
	if next != nil {
		return m.navigate(*next)
	}
```

**Step 5: Add ScreenNotes case in View**

In the View method's switch on screen type:

```go
case ScreenNotes:
	return m.notes.View(m.width, m.height)
```

**Step 6: Test build**

Run: `cd tui && go build ./...`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add tui/model/model.go
git commit -m "feat(model): wire notes screen into main model"
```

---

## Task 10: Add Note Editing to Part Detail Screen

**Files:**
- Modify: `tui/model/part.go`

**Step 1: Add imports**

Add to imports (around line 3):

```go
import (
	// ... existing imports ...
	"github.com/charmbracelet/bubbles/textarea"
)
```

**Step 2: Add note fields to PartDetailModel**

Update `PartDetailModel` struct (after `cursor` field, around line 32):

```go
type PartDetailModel struct {
	db         *db.DB
	partID     int
	part       *db.PartWithDiagram
	diagram    *db.Diagram
	group      *db.Group
	subgroup   *db.Subgroup
	isBookmark bool
	img        *image.KittyImage
	imgError   string
	subgroups  []db.SubgroupWithGroup
	links      []string
	cursor     int
	// Note editing
	note        *string
	editingNote bool
	noteInput   textarea.Model
}
```

**Step 3: Initialize note state in NewPartDetailModel**

Add after `isBookmark, _ := database.IsBookmarked(partID)` (around line 48):

```go
	isBookmark, _ := database.IsBookmarked(partID)
	note, _ := database.GetNote(partID)

	// Initialize textarea for note editing
	ti := textarea.New()
	ti.Placeholder = "Add a note..."
	ti.SetWidth(40)
	ti.SetHeight(3)
	ti.CharLimit = 500
```

**Step 4: Add note fields to model initialization**

Update the model return (around line 92), add before the closing brace:

```go
	m := &PartDetailModel{
		// ... existing fields ...
		note:        note,
		editingNote: false,
		noteInput:   ti,
	}
```

**Step 5: Update Update method for note editing**

Update the `Update` method. Add at the beginning of the switch, before other key handling:

```go
func (m *PartDetailModel) Update(msg tea.Msg) (*PartDetailModel, tea.Cmd, *Screen) {
	// Handle note editing mode
	if m.editingNote {
		switch msg := msg.(type) {
		case tea.KeyMsg:
			if ui.IsSaveNote(msg) {
				// Save or delete note
				content := strings.TrimSpace(m.noteInput.Value())
				if content == "" {
					m.db.RemoveNote(m.partID)
					m.note = nil
				} else {
					m.db.SetNote(m.partID, content)
					m.note = &content
				}
				m.editingNote = false
				return m, nil, nil
			}
			if ui.IsBack(msg) {
				// Cancel editing
				m.editingNote = false
				return m, nil, nil
			}
		}
		// Pass all other keys to textarea
		var cmd tea.Cmd
		m.noteInput, cmd = m.noteInput.Update(msg)
		return m, cmd, nil
	}

	switch msg := msg.(type) {
	case tea.KeyMsg:
		// ... existing key handling ...
```

**Step 6: Add note key handler**

Add after the bookmark key handler (around line 188):

```go
		if ui.IsBookmark(msg) {
			// ... existing bookmark code ...
		}

		if ui.IsNote(msg) {
			// Enter note editing mode
			m.editingNote = true
			if m.note != nil {
				m.noteInput.SetValue(*m.note)
			} else {
				m.noteInput.SetValue("")
			}
			m.noteInput.Focus()
			return m, textarea.Blink, nil
		}
```

**Step 7: Update renderPartInfo to show note**

In `renderPartInfo`, add note display after the Notes field (around line 308):

```go
	if m.part.Notes != nil {
		b.WriteString("\n")
		b.WriteString(ui.DimStyle.Render("Notes:"))
		b.WriteString("\n")
		b.WriteString(strings.ToUpper(*m.part.Notes))
		b.WriteString("\n")
	}

	// User note
	if m.note != nil && !m.editingNote {
		b.WriteString("\n")
		b.WriteString(ui.DimStyle.Render("My Note:"))
		b.WriteString("\n")
		b.WriteString(*m.note)
		b.WriteString("\n")
	}

	// Note editor
	if m.editingNote {
		b.WriteString("\n")
		b.WriteString(ui.DimStyle.Render("My Note:"))
		b.WriteString("\n")
		b.WriteString(m.noteInput.View())
		b.WriteString("\n")
	}
```

**Step 8: Update footer**

Update the footer (around line 361):

```go
	// Footer
	if m.editingNote {
		b.WriteString(ui.DimStyle.Render("ctrl+s save   esc cancel"))
	} else {
		bookmarkAction := "bookmark"
		if m.isBookmark {
			bookmarkAction = "unbookmark"
		}
		noteAction := "note"
		if m.note != nil {
			noteAction = "edit note"
		}
		b.WriteString(ui.DimStyle.Render(fmt.Sprintf("esc back   ↑↓ navigate   enter select   b %s   n %s", bookmarkAction, noteAction)))
	}
```

**Step 9: Test build**

Run: `cd tui && go build ./...`
Expected: Build succeeds

**Step 10: Commit**

```bash
git add tui/model/part.go
git commit -m "feat(part): add inline note editing with textarea"
```

---

## Task 11: Manual Testing

**Step 1: Run the TUI**

```bash
make tui
```

**Step 2: Test notes flow**

1. Navigate to any part
2. Press `n` to open note editor
3. Type a multi-line note
4. Press `Ctrl+S` to save
5. Verify note appears in part info
6. Press `Esc` to go back
7. Navigate to Home
8. Verify "# Notes" shows "1 parts"
9. Select "# Notes"
10. Verify note appears in list
11. Select the note to return to part
12. Press `n` to edit
13. Clear the note and press `Ctrl+S`
14. Verify note is removed

**Step 3: Commit any fixes**

If fixes were needed, commit them with descriptive messages.

---

## Task 12: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update TUI Navigation section**

Add `n` key to the navigation section:

```markdown
## TUI Navigation

- `↑/↓` or `j/k` — navigate menus
- `Enter` — select item or open link
- `Esc` — go back
- `/` — search (from any screen)
- `b` — toggle bookmark (on part detail)
- `n` — add/edit note (on part detail)
- `q` — quit
```

**Step 2: Update Database Schema section**

Add notes table:

```markdown
## Database Schema

- **groups** → top-level categories (e.g., "engine", "lubrication")
- **subgroups** → subcategories linked to groups
- **diagrams** → parts diagrams with image URLs and local paths
- **parts** → individual parts with part_number, PNC, description, specs
- **bookmarks** → user-saved parts
- **notes** → user notes attached to parts
- **scrape_progress** → URL tracking (pending/completed/failed)
- **parts_fts** → FTS5 virtual table for full-text search
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add notes feature to CLAUDE.md"
```

---

## Final: Merge to Main

**Step 1: Verify all tests pass**

Run: `cd tui && go build ./...`
Expected: Build succeeds

**Step 2: Review commits**

Run: `git log --oneline main..HEAD`

**Step 3: Merge**

Use superpowers:finishing-a-development-branch to complete the merge.
