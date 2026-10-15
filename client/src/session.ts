import type { UserDto } from '@dice/shared'
import { useCallback, useState } from 'react'

export type Slot = 'p1' | 'p2'
export interface Session {
  token: string
  user: UserDto
}
export type Sessions = Record<Slot, Session | null>

const KEY = 'dice.sessions'

// sessionStorage can be missing or blocked, so every access is guarded.
function load(): Sessions {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) return { p1: null, p2: null, ...JSON.parse(raw) }
  } catch {
    /* fall through to the empty state */
  }
  return { p1: null, p2: null }
}

function save(s: Sessions) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* the app still works, it just won't survive a reload */
  }
}

/** Two players share one page, so there are two independent logins ("slots"). */
export function useSessions() {
  const [sessions, setSessions] = useState<Sessions>(load)

  const set = useCallback((slot: Slot, value: Session | null) => {
    setSessions((prev) => {
      const next = { ...prev, [slot]: value }
      save(next)
      return next
    })
  }, [])

  return { sessions, setSession: set }
}
