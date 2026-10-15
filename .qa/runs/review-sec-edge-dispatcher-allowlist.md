# Review — sec-edge-dispatcher-allowlist (#668)

**Verdict:** ACCEPT

## Findings (all severities)

| Severity | Finding |
|---|---|
| Info | Legacy worker source trees remain in repo but are unreachable via main — intentional Non-Goal. |
| Info | Frontend `functions.invoke` callers already use allowlisted slugs only. |
| Low | Adding a new hardened Edge function requires updating `EDGE_DISPATCHER_ALLOWLIST` — document in PR. |

No Critical / Important blockers.
