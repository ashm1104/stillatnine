// Welcome email assembly.
//
// The canonical template is /emails/welcome-template.html (send-ready, do not
// modify its structure — see CLAUDE.md). We read it at runtime and swap the
// {{manage_url}} / {{unsubscribe_url}} placeholders. next.config.ts pins the
// file into the serverless bundle via `outputFileTracingIncludes` so it's
// readable on Vercel.

import { readFileSync } from "node:fs";
import path from "node:path";

export const WELCOME_SUBJECT =
  "You're in. Your first story arrives tonight at 9.";

let cachedTemplate: string | null = null;

function loadTemplate(): string {
  if (cachedTemplate === null) {
    cachedTemplate = readFileSync(
      path.join(process.cwd(), "emails", "welcome-template.html"),
      "utf8",
    );
  }
  return cachedTemplate;
}

/** Render the welcome email HTML with the recipient's manage/unsubscribe links. */
export function renderWelcomeEmail(opts: {
  manageUrl: string;
  unsubscribeUrl: string;
}): string {
  return loadTemplate()
    .replaceAll("{{manage_url}}", opts.manageUrl)
    .replaceAll("{{unsubscribe_url}}", opts.unsubscribeUrl);
}
