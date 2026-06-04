/* Still at Nine — Welcome / Onboarding email (first touch after purchase) */

const WELCOME = {
  fromName: "Still at Nine",
  fromEmail: "stories@stillatnine.com",
  subject: "You\u2019re in. The first story arrives tonight at 9.",
  preheader: "Three nights a week, after dark. Here\u2019s what to expect \u2014 and how to be sure it always reaches you.",
  dateLabel: "Today, 4:12 PM",

  eyebrow: "Welcome",
  title: "You\u2019re in. The lamp is lit.",
  lead: "Thank you for joining Still at Nine. Three nights a week, at nine o\u2019clock, a single strange and true story will arrive in this inbox \u2014 documented, carefully told, and yours to read by whatever light you keep.",
  intro: "There\u2019s nothing to download and nothing to log into. The stories simply come to you. Here\u2019s the shape of what you\u2019ve signed up for.",

  expect: [
    { label: "The rhythm", text: "Three stories a week, delivered at 9 PM \u2014 twenty-four in all, across eight weeks. Then the collection is yours to keep." },
    { label: "The promise", text: "Every story is true and built from the record. We tell you what was found, what was tested, and where the trail goes cold." },
    { label: "The light", text: "They\u2019re written for the end of the day. No feed, no urgency. Just one story, and the quiet that follows it." },
  ],

  deliverTitle: "One small thing",
  deliverBody: "So the stories always find you, add stories@stillatnine.com to your contacts. If tonight\u2019s doesn\u2019t appear by nine, a glance in Promotions or Spam usually turns it up \u2014 drag it to your inbox once and the rest will follow.",

  teaserKicker: "Tonight, at nine",
  teaserCategory: "Signals",
  teaserTitle: "A signal with no source. Forty years.",
  teaserHook: "For seventy-two seconds in the summer of 1977, a telescope in Ohio heard something it was built to hope for. Then the sky went quiet, and has stayed that way ever since.",
  teaserNote: "No link to open. It will simply arrive.",

  signoff: "Until nine,",
  signName: "The desk at Still at Nine",
};

if (typeof window !== "undefined") window.WELCOME = WELCOME;
