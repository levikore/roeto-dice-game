import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from './api/client.ts'
import type { Session } from './session.ts'

interface Props {
  title: string
  session: Session | null
  onChange: (session: Session | null) => void
}

export default function AuthPanel({ title, session, onChange }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const submit = useMutation({
    mutationFn: () =>
      mode === 'login' ? api.login(username, password) : api.register(username, password),
    onSuccess: ({ token, user }) => {
      onChange({ token, user })
      setPassword('')
    },
  })

  if (session) {
    return (
      <section className="panel" aria-label={title}>
        <h2>{title}</h2>
        <p className="who">
          Signed in as <strong>{session.user.username}</strong>
        </p>
        <p className="muted">Wins: {session.user.wins}</p>
        <button type="button" onClick={() => onChange(null)}>
          Log out
        </button>
      </section>
    )
  }

  return (
    <section className="panel" aria-label={title}>
      <h2>{title}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit.mutate()
        }}
      >
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </label>
        <div role="alert" className="error">
          {submit.error?.message}
        </div>
        <button type="submit" disabled={submit.isPending}>
          {submit.isPending ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            submit.reset()
          }}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
        </button>
      </form>
    </section>
  )
}
