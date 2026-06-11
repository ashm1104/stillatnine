// Privacy Policy. Drafted for Phase 6 — tailored to the no-accounts,
// email+timezone-only model, Dodo as merchant of record, and Resend/Supabase/
// Vercel as sub-processors. NOT legal advice; to be reviewed before launch.
// [Mailing address] is a placeholder until the India Post P.O. Box is sourced.

import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Still at Nine",
  description:
    "What Still at Nine collects (email and timezone, little else), why, who processes it, and your rights. We don't sell your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="11 June 2026">
      <p className="legal-lead">
        Still at Nine is email and nothing else — so there&rsquo;s very little
        about you for us to hold. This policy explains exactly what we collect,
        why, and what stays off-limits.
      </p>

      <h2>Who we are</h2>
      <p>
        Still at Nine (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is an independent
        project operated by Aayush as a sole proprietor, based in Ranchi,
        Jharkhand, India. We are the data controller (the &ldquo;Data
        Fiduciary&rdquo; under India&rsquo;s DPDP Act, 2023) for the information
        described here. You can reach a real person at{" "}
        <a href="mailto:hello@stillatnine.com">hello@stillatnine.com</a>.
      </p>

      <h2>What we collect</h2>
      <p>We deliberately keep this short:</p>
      <ul>
        <li>
          <strong>Your email address</strong> — so we can send the stories you
          bought. It&rsquo;s entered on our payment processor&rsquo;s checkout,
          not on our site, and passed to us with your order.
        </li>
        <li>
          <strong>Your timezone</strong> — captured from your browser after
          purchase so each story arrives at 9 PM your time. You can send a
          correction by email.
        </li>
        <li>
          <strong>Order details</strong> — a payment reference, the amount and
          currency you paid, and the date, provided by our payment processor. We
          never receive or store your card number.
        </li>
        <li>
          <strong>Delivery data</strong> — which stories we&rsquo;ve sent you,
          and whether an email bounced, was marked as spam, or was unsubscribed,
          so we can deliver reliably and stop contacting addresses that
          don&rsquo;t want us.
        </li>
        <li>
          <strong>Approximate country</strong> — derived from your IP address
          when the page loads, used only to show the right currency. We
          don&rsquo;t store it against you.
        </li>
      </ul>
      <p>
        We don&rsquo;t ask for your name, and we don&rsquo;t run accounts,
        logins, or advertising/tracking cookies.
      </p>

      <h2>How we use it</h2>
      <p>
        Solely to run the product: to deliver your 24 stories on schedule, send
        your welcome email, process your order and any refund, reply when you
        write to us, and keep our email deliverability healthy. That&rsquo;s it.
      </p>

      <h2>Our legal basis</h2>
      <p>
        We process your email and timezone to perform the contract you entered
        when you purchased — delivering what you paid for — and we keep order
        data to meet legal and tax obligations. Where consent is the appropriate
        basis under your local law, your purchase and the timezone you provide
        constitute that consent, and you can withdraw it any time by
        unsubscribing.
      </p>

      <h2>Payments</h2>
      <p>
        Payments are handled by <strong>Dodo Payments</strong>, which acts as
        the <strong>merchant of record</strong> for your purchase. They collect
        and process your payment information under their own privacy policy and
        handle applicable taxes. We receive only the order confirmation
        described above — never your full card details.
      </p>

      <h2>Who we share it with</h2>
      <p>
        We don&rsquo;t sell, rent, or trade your data, and we don&rsquo;t share
        it for anyone else&rsquo;s marketing. We rely on a small set of trusted
        service providers (&ldquo;sub-processors&rdquo;) purely to operate the
        product:
      </p>
      <ul>
        <li>
          <strong>Dodo Payments</strong> — payment processing (merchant of
          record).
        </li>
        <li>
          <strong>Resend</strong> — sending our emails.
        </li>
        <li>
          <strong>Supabase</strong> — our database, where your email, timezone,
          and delivery records are stored.
        </li>
        <li>
          <strong>Vercel</strong> — hosting our website.
        </li>
      </ul>
      <p>
        Each processes data only on our instructions. We may also disclose
        information if required by law.
      </p>

      <h2>Where your data is stored</h2>
      <p>
        Our providers may process and store data on servers outside India and
        outside your own country. Wherever it goes, it stays limited to what
        this policy describes.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your record for as long as needed to deliver your collection and
        meet legal and accounting obligations, after which we delete or
        anonymize it. If you unsubscribe, we retain the minimum needed to honor
        that choice so we don&rsquo;t email you again. You can ask us to delete
        your data sooner — see below.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us to <strong>see, correct, or delete</strong> the
        information we hold about you, or to <strong>stop emailing you</strong>{" "}
        entirely. Every email also carries a one-click unsubscribe. To make any
        request, write to{" "}
        <a href="mailto:hello@stillatnine.com">hello@stillatnine.com</a> and a
        person will handle it. Depending on where you live — for example under
        India&rsquo;s DPDP Act, the GDPR, or similar laws — you may have
        additional rights, including the right to complain to your local
        data-protection authority.
      </p>

      <h2>Children</h2>
      <p>
        Still at Nine is intended for adults and is not directed to children.
        Please don&rsquo;t purchase or sign up if you are under 18, or under the
        age of digital consent where you live.
      </p>

      <h2>Security</h2>
      <p>
        We use reputable providers and limit who can access your data, but no
        method of transmission or storage is perfectly secure. If a breach ever
        affects you, we&rsquo;ll act and notify you as required by law.
      </p>

      <h2>Changes</h2>
      <p>
        If we update this policy, we&rsquo;ll change the date at the top.
        Significant changes that affect you may also be sent by email.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests:{" "}
        <a href="mailto:hello@stillatnine.com">hello@stillatnine.com</a>.
      </p>
      <address className="legal-address">
        Still at Nine, operated by Aayush (sole proprietor)
        <br />
        [Mailing address — to be added]
        <br />
        Ranchi, Jharkhand, India
      </address>
    </LegalPage>
  );
}
