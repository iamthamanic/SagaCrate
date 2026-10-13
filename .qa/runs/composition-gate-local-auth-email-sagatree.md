# Composition Gate — local-auth-email-sagatree

- HEAD_SHA: 18ed48cec625c6cd485e682323985f6de1ecccb3
- BASE_SHA: 0a05fb2b6a1a41065d44be486a6dacaa12c31d90
- Date: 2026-10-13
- Verdict: CLEAR

## Event
Local Admin / Player shortcut logs in via GoTrue with `@sagatree.local` emails. One successful password grant yields one JWT (`role=authenticated`). Library REST uses that JWT once per request; `anon` remains fail-closed (42501).

## Hop chain
`auth-context` shortcut → `signInWithPassword(LOCAL_ADMIN_EMAIL|LOCAL_PLAYER_EMAIL)` → GoTrue `auth.users` / `auth.identities` (emails aligned by 011/074/080) → JWT `authenticated` → PostgREST → RLS helpers with EXECUTE granted only to `authenticated` → library list 200.

## Simulations
| Case | Intended | Composed | Result |
|------|----------|----------|--------|
| N-actors | Admin and player each get their own JWT/UID | Seed UUIDs `…0001` / `…0002`; login returns distinct users | pass |
| Invalid/missing | Wrong email / anon key cannot SELECT protected tables | Anon REST still 42501 on characters helper | pass |
| Two consumers / crash | Re-apply 080 and re-login after rename does not duplicate users | Idempotent UPDATE by seed id / legacy email; identities provider_id updated | pass |

## Flags
none

## Skip reason
n/a
