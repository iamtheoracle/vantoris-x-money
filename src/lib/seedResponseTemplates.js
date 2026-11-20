/**
 * Production recovery safeguard: do not seed operator templates with canned
 * statements that could be mistaken for verified financial or compliance facts.
 * Add reviewed templates through the authenticated operations workflow instead.
 */
export async function seedResponseTemplates() {
  return { skipped: true, reason: 'Template seeding is disabled until reviewed templates are configured.' };
}
