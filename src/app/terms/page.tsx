// Terms of Service. Drafted for Phase 6 — one-time purchase, 24 stories by
// email, no accounts, Dodo as merchant of record, 7-day refund, governed by
// Indian law (Ranchi, Jharkhand). NOT legal advice; to be reviewed before launch.

import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Still at Nine",
  description:
    "The terms for buying and reading Still at Nine: one payment, 24 stories by email, a 7-day refund, and how it all works.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="11 June 2026">
      <p className="legal-lead">
        The short version: you pay once, we send you 24 stories, and you can walk
        away whenever you like. The longer version is below.
      </p>

      <h2>Agreement</h2>
      <p>
        These Terms govern your purchase and use of Still at Nine (the
        &ldquo;Service&rdquo;), operated by Aayush, a sole proprietor based in
        Ranchi, Jharkhand, India (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By
        purchasing, you agree to them. If you don&rsquo;t agree, please
        don&rsquo;t buy.
      </p>

      <h2>What you&rsquo;re buying</h2>
      <p>
        Still at Nine is a one-time purchase of a fixed collection of{" "}
        <strong>24 original stories</strong>, delivered to your email address
        over roughly eight weeks — three nights a week, at around 9 PM in your
        timezone, beginning the night of purchase. It is delivered entirely by
        email: there is no account, app, or login. All buyers receive the same
        24 stories in the same order.
      </p>

      <h2>Price and payment</h2>
      <p>
        The price is a{" "}
        <strong>one-time payment of $19 USD (₹499 in India)</strong>; the price
        shown at checkout applies to your order. Payment is processed by{" "}
        <strong>Dodo Payments as merchant of record</strong>, which handles the
        transaction and any applicable taxes under its own terms. Your purchase
        is for personal use.
      </p>

      <h2>Refunds</h2>
      <p>
        If Still at Nine isn&rsquo;t for you, email{" "}
        <a href="mailto:hello@stillatnine.com">hello@stillatnine.com</a>{" "}
        <strong>within 7 days</strong> of your purchase and we&rsquo;ll refund
        you in full, processed through Dodo Payments. After 7 days, sales are
        final. Nothing here limits any non-waivable refund rights you may have
        under your local law.
      </p>

      <h2>Delivery</h2>
      <p>
        We send each story on its schedule using reasonable efforts, but
        delivery depends on your email provider and a working address. If our
        emails repeatedly bounce or are marked as spam, we may pause sending to
        protect deliverability — write to us and we&rsquo;ll help sort it out.
        Minor timing variation and occasional provider delays are normal.
      </p>

      <h2>Your use of the stories</h2>
      <p>
        The stories and related content are our intellectual property, or used
        with permission, and are provided for your{" "}
        <strong>personal, non-commercial use</strong>. Please don&rsquo;t
        republish, resell, or redistribute them. You&rsquo;re welcome to share a
        quote with a friend.
      </p>

      <h2>About the content</h2>
      <p>
        Stories are based on real events and public record, with sources
        provided, and are offered for general interest. They are not
        professional, legal, medical, or investigative advice, and we make no
        warranty that every detail is complete or error-free.
      </p>

      <h2>Disclaimers and liability</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranties of any
        kind. To the fullest extent permitted by law, we are not liable for
        indirect or consequential losses, and our total liability for any claim
        relating to the Service is limited to the amount you paid for it. Some
        jurisdictions don&rsquo;t allow certain limitations, so parts of this may
        not apply to you.
      </p>

      <h2>Stopping</h2>
      <p>
        You can unsubscribe at any time using the link in any email; that ends
        future delivery. Because it&rsquo;s a one-time purchase, there&rsquo;s
        nothing to cancel. We may suspend or end the Service, or stop serving a
        particular buyer, if these Terms are misused.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms or adjust the Service — for example, the
        delivery schedule — and the &ldquo;last updated&rdquo; date will reflect
        any change. Continued use after a change means you accept it.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of India, and you agree that the
        courts of <strong>Ranchi, Jharkhand</strong> have exclusive jurisdiction
        over any dispute, subject to any mandatory rights under your local law.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:hello@stillatnine.com">hello@stillatnine.com</a> — it
        reaches a person.
      </p>
    </LegalPage>
  );
}
