# Part Notes Feature Design

Add the ability to attach personal notes to parts in the TUI. Notes are user data that lives on top of the scraped data, similar to bookmarks. Parts with notes appear in a dedicated "Notes" screen accessible from the home menu.

## Database Schema

Add a new `notes` table to `scraper/src/db/schema.ts`:

```sql
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

- `part_id` has UNIQUE constraint (one note per part)
- `content` stores the note text (required - empty notes are deleted)
- `updated_at` tracks when the note was last edited
- No foreign key cascade to preserve notes across re-scrapes

## Database Operations

Add to `tui/db/db.go`:

```go
// SetNote creates or updates a note for a part
func (d *DB) SetNote(partID int, content string) error
  → "INSERT INTO notes (part_id, content) VALUES (?, ?)
      ON CONFLICT(part_id) DO UPDATE SET content=?, updated_at=CURRENT_TIMESTAMP"

// RemoveNote deletes a note for a part
func (d *DB) RemoveNote(partID int) error
  → "DELETE FROM notes WHERE part_id = ?"

// GetNote retrieves the note for a part (returns nil if none)
func (d *DB) GetNote(partID int) (*string, error)
  → "SELECT content FROM notes WHERE part_id = ?"

// GetNotes retrieves all parts with notes (for the notes screen)
func (d *DB) GetNotes() ([]NoteResult, error)
  → Joins notes → parts → groups → subgroups
  → Returns: ID, PartID, Content, UpdatedAt, PartNumber, PNC, Description, GroupName, SubgroupName
  → Ordered by updated_at DESC (most recently edited first)

// GetNoteCount returns the number of parts with notes
func (d *DB) GetNoteCount() (int, error)
  → "SELECT COUNT(*) FROM notes"
```

Add to `tui/db/types.go`:

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

## Part Detail Screen

Modify `tui/model/part.go` to support inline note editing.

### State

```go
type PartDetailModel struct {
  // ... existing fields ...
  note        *string            // Current note content (nil if none)
  editingNote bool               // True when textarea is active
  noteInput   textarea.Model     // Bubble Tea textarea component (multiline)
}
```

### Behavior

- On init: fetch existing note with `GetNote(partID)`
- Press `n`:
  - Enter edit mode, populate textarea with existing note (or empty)
  - Set `editingNote = true`, focus the textarea
- While editing:
  - `Enter` → inserts newline (normal textarea behavior)
  - `Ctrl+S` → save note (if non-empty) or delete note (if empty), exit edit mode
  - `Esc` → cancel editing, discard changes, exit edit mode

### Footer

- Normal mode: `"n note"` or `"n edit note"` (if note exists)
- Edit mode: `"ctrl+s save  esc cancel"`

### View

- When `editingNote` is true, render textarea at bottom of right pane (3-4 lines tall)
- When note exists (not editing), show it in part info section after specs

## Notes Screen

Create new file `tui/model/notes.go`, mirroring the bookmarks screen.

### Model

```go
type NotesModel struct {
  db    *db.DB
  notes []db.NoteResult
  menu  *ui.Menu
}
```

### Initialization

- Fetch all notes with `GetNotes()`
- Build menu items:
  - Label: `[PNC] PART_NUMBER` (same format as bookmarks)
  - Hint: the note content (truncated if too long)

### Navigation

- `↑/↓` or `j/k` — navigate notes list
- `Enter` — go to part detail screen
- `Esc` — back to home

### View

Split pane layout (like bookmarks):
- Left pane: "NOTES" header + count + instructions
- Right pane: scrollable list of parts with notes

Empty state: "No notes yet. Navigate to a part and press 'n' to add a note."

## Home Screen

Modify `tui/model/home.go`:

### State

```go
type HomeModel struct {
  // ... existing fields ...
  noteCount int  // Fetched on init alongside bookmarkCount
}
```

### Menu

```
/ Search         Find parts by number or name
* Bookmarks      5 saved
# Notes          3 parts
```

- Menu item ID: `"__notes__"`
- Label: `"# Notes"`
- Hint: count if > 0 (e.g., "3 parts")
- Selection navigates to `NotesScreen()`

## Key Bindings

Add to `tui/ui/keys.go`:

```go
func IsNote(msg tea.KeyMsg) bool {
  return msg.String() == "n"
}

func IsSaveNote(msg tea.KeyMsg) bool {
  return msg.String() == "ctrl+s"
}
```

## Files Changed

| File | Changes |
|------|---------|
| `scraper/src/db/schema.ts` | Add `notes` table migration |
| `tui/db/types.go` | Add `NoteResult` struct |
| `tui/db/db.go` | Add `SetNote`, `RemoveNote`, `GetNote`, `GetNotes`, `GetNoteCount` |
| `tui/ui/keys.go` | Add `IsNote()`, `IsSaveNote()` |
| `tui/model/part.go` | Add note state, textarea, edit mode logic, display |
| `tui/model/home.go` | Add `noteCount`, `"# Notes"` menu item, navigation |
| `tui/model/notes.go` | New file: notes list screen |

## Design Decisions

- **Single note per part**: Simpler model, sufficient for personal use (e.g., "ordered from Amayama 2024-01")
- **Independent from bookmarks**: Notes and bookmarks are orthogonal features
- **Multiline with Ctrl+S save**: Allows flexible note content without Enter conflicts
- **Inline editing**: Keeps user in context, matches lightweight feel of bookmark toggle
- **Part info primary in list**: Consistent with bookmarks screen, users identify parts first
