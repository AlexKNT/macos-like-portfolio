/*
 * Every word this window says that is not portfolio content: the heading it opens with, the
 * invitation line under that heading, the subject and the body the address link carries, and the
 * two words the Copy control needs.
 *
 * The address itself is never written here. It comes from the profile, so the address a visitor
 * reads, the address a press takes and the address a mail link is addressed to stay one value.
 * Each function is named for what it says rather than for where it sits on screen.
 * Spec 0008, AC-10.
 */

/** The heading the window opens with, printed through the stage's own heading slot. */
export function headingLine(): string {
  return "Let's work together"
}

/** The line under the heading that says what the address and the Copy control each do. */
export function invitationLine(): string {
  return 'Press the address to open a message, or take it with Copy.'
}

/** The subject the address link carries, so a message arrives already labelled. */
export function mailSubject(): string {
  return 'Hello from your portfolio'
}

/**
 * The body the address link carries, so the visitor starts from a sentence rather than from an
 * empty page. It is written to be sent, not received, because the visitor's mail app is the one
 * that sends it.
 */
export function mailBody(): string {
  return 'Hi, I found your portfolio and wanted to reach out.'
}

/** The word printed on the Copy control. The address is named in the control's accessible name. */
export function copyControlLabel(): string {
  return 'Copy'
}

/**
 * The Copy control's accessible name: the visible word plus the address it takes, so a screen
 * reader user hears what the press copies rather than a bare `Copy`.
 */
export function addressCopyName(address: string): string {
  return `${copyControlLabel()} ${address}`
}
