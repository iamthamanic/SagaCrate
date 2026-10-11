# review-ticket — sagatree-core-workflows-real-apis (#606)

## Summary
Adds live core-workflow proof against regular sagadrive compose (Auth → Project →
Session join → mutate → Storage → Edge member) plus static contract for CI.

## Risk
Low — test/evidence only; no production schema change. Explicit BLOCKED_* for
needs-human siblings #604/#605.
