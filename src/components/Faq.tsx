// FAQ section. NEW for Phase 6 (no mock counterpart) — copy drafted in the
// brand voice to answer purchase objections and add long-tail SEO. Uses native
// <details>/<summary> so it works without JS and stays accessible. Also emits
// FAQPage JSON-LD for rich results.

import { SectionWrap, Eyebrow } from "./Shared";

type QA = { q: string; a: string };

const FAQS: QA[] = [
  {
    q: "What exactly do I get?",
    a: "Twenty-four original stories — strange, true, and never fully explained — delivered to your inbox over about eight weeks. One payment, and the whole collection is yours.",
  },
  {
    q: "Is this a subscription?",
    a: "No. You pay once. There's nothing recurring, nothing to renew, and nothing to cancel.",
  },
  {
    q: "When do the stories arrive?",
    a: "At 9 PM in your own timezone, three nights a week, in a steady rhythm. The first one comes the night you join — so if it's already evening, you start tonight.",
  },
  {
    q: "Are the stories actually real?",
    a: "Yes. Each one is drawn from real events and public record, with sources listed at the foot of every email. It isn't fiction, and it isn't dramatized true-crime — just things that happened and were never tidily resolved.",
  },
  {
    q: "Do I need an account or an app?",
    a: "Neither. Still at Nine is email and nothing else. No login, no feed, no algorithm — just the story, when the night comes.",
  },
  {
    q: "How do I pay, and is it secure?",
    a: "Checkout is handled by Dodo Payments, our payment processor and merchant of record. They handle the card details securely — we never see them. It's a one-time $19 (₹499 in India).",
  },
  {
    q: "What if I change my mind?",
    a: "Every email has a one-click unsubscribe, so you can step away any time. And if it isn't for you, write to us within 7 days of buying and we'll refund you in full.",
  },
  {
    q: "What happens after I finish all 24?",
    a: "You'll have read the whole collection — and it stays yours. When the next collection of 24 is ready, we'll send you a note so you can pick it up if you'd like more. Nothing renews and nothing is charged automatically; the next one is always your choice.",
  },
  {
    q: "I bought it but nothing arrived — what now?",
    a: "Check your spam or Promotions folder first, and add stories@stillatnine.com to your contacts. Still nothing? Reply to any of our emails, or write to hello@stillatnine.com — it reaches a person.",
  },
];

export function Faq({ dark }: { dark: boolean }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <SectionWrap dark={dark} id="faq" className="sec--narrow">
      <Eyebrow dark={dark}>Questions</Eyebrow>
      <h2 className="sec-h2">Before you decide.</h2>
      <div className="faq-list">
        {FAQS.map(({ q, a }, i) => (
          <details key={i} className="faq-item">
            <summary className="faq-q">
              <span>{q}</span>
              <span className="faq-mark" aria-hidden="true" />
            </summary>
            <p className="faq-a">{a}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </SectionWrap>
  );
}
