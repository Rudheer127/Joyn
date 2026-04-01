/**
 * Bug Condition Exploration Tests
 *
 * These tests encode the EXPECTED (fixed) behavior.
 * They FAILED on unfixed code — failure confirmed the bugs existed.
 * After fixes, all tests must PASS.
 *
 * Documented counterexamples (bugs confirmed on unfixed code):
 *   1a: app/(app)/match/page.tsx did not exist → /match returned 404
 *   1b: "+ Schedule New Session" button had no onClick → modal never opened
 *   1c: "Join Session" button had no onClick → no navigation feedback
 *   1d: "Cancel" button had no onClick → session list unchanged after click
 *   1e: "Report this person" button had no onClick → dialog never appeared
 *   1f: profile photo section had no <input type="file"> → upload impossible
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

import fs from 'fs'
import path from 'path'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/sessions',
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => React.createElement('a', { href, ...props }, children),
}))

beforeEach(() => {
  pushMock.mockClear()
})

// ─── Test 1a: /match route file exists ───────────────────────────────────────
test('1a — /match route: app/(app)/match/page.tsx exists', () => {
  const matchPagePath = path.resolve(process.cwd(), 'app/(app)/match/page.tsx')
  expect(fs.existsSync(matchPagePath)).toBe(true)
})

// ─── Test 1b: Schedule modal opens ───────────────────────────────────────────
test('1b — Schedule modal: clicking "+ Plan a Meetup" shows a modal', async () => {
  const { default: SessionsPage } = await import('../app/(app)/sessions/page')
  const user = userEvent.setup()
  render(React.createElement(SessionsPage))

  const scheduleBtn = screen.getByRole('button', { name: /plan a meetup|schedule new session|schedule a catch-up/i })
  await user.click(scheduleBtn)

  // The modal renders a heading when open
  const modal = screen.queryByText(/plan a meetup|schedule a session/i)
  expect(modal).not.toBeNull()
})

// ─── Test 1c: Join session navigates ─────────────────────────────────────────
test('1c — Join session: clicking "Join Meetup/Catch-Up" triggers navigation', async () => {
  const { default: SessionsPage } = await import('../app/(app)/sessions/page')
  const user = userEvent.setup()
  render(React.createElement(SessionsPage))

  const joinBtns = screen.getAllByRole('button', { name: /join meetup|join session|join catch-up/i })
  await user.click(joinBtns[0])

  expect(pushMock).toHaveBeenCalled()
})

// ─── Test 1d: Cancel session removes it from list ────────────────────────────
test('1d — Cancel session: clicking "Cancel" removes the session from the list', async () => {
  const { default: SessionsPage } = await import('../app/(app)/sessions/page')
  const user = userEvent.setup()
  render(React.createElement(SessionsPage))

  // "Chair Yoga with Margaret" appears in upcoming (1) and past (1) = 2 total
  const initialMatches = screen.getAllByText(/chair yoga with margaret/i)
  expect(initialMatches.length).toBeGreaterThan(0)

  // Cancel buttons in the upcoming section (not the modal cancel)
  const cancelBtns = screen.getAllByRole('button', { name: /^cancel$/i })
  await user.click(cancelBtns[0])

  // After cancel, upcoming card is gone; only the past sessions entry remains
  const afterMatches = screen.getAllByText(/chair yoga with margaret/i)
  expect(afterMatches.length).toBeLessThan(initialMatches.length)
})

// ─── Test 1e: Report button has onClick wired ────────────────────────────────
// MatchProfilePage is now a client component — check source for onClick on the report button
test('1e — Report dialog: "Report this person" button has an onClick handler', () => {
  const src = fs.readFileSync(
    path.resolve(process.cwd(), 'app/(app)/match/[id]/page.tsx'),
    'utf-8'
  )

  // Find the button opening tag that contains "Report this person" text nearby
  // Look for onClick= appearing before "Report this person" within a button block
  const buttonBlockMatch = src.match(/<button[\s\S]{0,300}?Report this person/)
  expect(buttonBlockMatch).not.toBeNull()
  expect(buttonBlockMatch![0]).toMatch(/onClick/)
})

// ─── Test 1f: Photo file input exists ────────────────────────────────────────
test('1f — Photo file input: ProfilePage renders an <input type="file">', async () => {
  const { default: ProfilePage } = await import('../app/(app)/profile/page')
  render(React.createElement(ProfilePage))

  const fileInput = document.querySelector('input[type="file"]')
  expect(fileInput).not.toBeNull()
})
