/**
 * The `mailto:` address link's href: the recipient, then the subject and the body the words module
 * supplies, in that order.
 *
 * The encoding has one home, here, so it happens once and a test can hold it. The recipient is
 * carried verbatim, because the content schema already holds it as an email and an email address
 * cannot break out of the href. The subject and the body are percent encoded, so a word added to
 * either of them later cannot end the query early or smuggle a second header into the message.
 *
 * It is a pure function: the same three strings always come back as the same href.
 * Spec 0008, AC-2.
 */
export function mailLinkHref(address: string, subject: string, body: string): string {
  const subjectPart = encodeURIComponent(subject)
  const bodyPart = encodeURIComponent(body)

  return `mailto:${address}?subject=${subjectPart}&body=${bodyPart}`
}
