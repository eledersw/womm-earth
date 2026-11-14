# Handoffs

One short note per Claude session, written by `/handoff <role>`. `/resume` reads the 3 newest, so name files so they sort by time:

`YYYY-MM-DD-HHMM-<role>-<topic>.md`, e.g. `2026-11-14-1530-coder-b-zarr-spike.md`

## Template (under 30 lines)

```markdown
# <role> · <topic> · H<hour>

## Done
- …

## Decisions made (also logged in PROJECT.md or METHODS.md)
- …

## State of things
- Works: …
- Not yet / broken: …

## For other roles
- @<role>: …

## Next step for whoever continues
- The exact next action, with the file or command
```
