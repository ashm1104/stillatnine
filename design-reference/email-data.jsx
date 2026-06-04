/* Still at Nine — Story Email: content + config for "The Wow! Signal" */

const EMAIL = {
  // ---- inbox row / deliverability ----
  fromName: "Still at Nine",
  fromEmail: "stories@stillatnine.com",
  subject: "A signal with no source. Forty years.",
  // Preheader = the preview text shown after the subject in most inboxes.
  // Strategy: continue the hook, never repeat the subject, end mid-thought.
  preheader: "For seventy-two seconds, something spoke. Then nothing — for the rest of recorded history.",
  dateLabel: "Friday, 9:00 PM",
  storyNo: 11,
  storyTotal: 24,
  category: "Signals",
  readMins: 6,

  title: "A signal with no source. Forty years.",

  // ---- body, in locked story structure ----
  // Each block: kind = 'lead' | 'p' | 'section' | 'quote' | 'list'
  body: [
    { kind: "lead", text: "On the night of August 15, 1977, a narrow beam of radio energy crossed the state of Ohio and was gone. It lasted seventy-two seconds. Three days later, a volunteer astronomer reviewing the printout circled six characters in red ink and wrote a single word beside them: Wow!" },

    { kind: "p", text: "He was not being dramatic. He was being precise. In the language of the machine that recorded it, those six characters described something that should not have been there \u2014 a sound from the direction of deep space, far louder than the silence around it, arriving on a frequency that nature is not supposed to use." },

    { kind: "section", label: "The listening" },
    { kind: "p", text: "The instrument was called Big Ear: a radio telescope the size of three football fields, built on a former golf course at Ohio State University. It did not move. It lay flat against the sky and let the Earth's own rotation drag the heavens slowly across its view, scanning a thin ribbon of the cosmos one strip at a time. For years it had been quietly enrolled in the search for extraterrestrial intelligence \u2014 not the dramatic kind, but the patient kind, where you point an antenna at nothing in particular and wait." },
    { kind: "p", text: "Each night the telescope printed its findings as columns of numbers and letters, a code in which louder signals were assigned higher characters. Most of the page was ones and twos: the ordinary hiss of the universe. A volunteer named Jerry Ehman took the printouts home in batches and read them by hand." },

    { kind: "section", label: "Six characters" },
    { kind: "p", text: "On the printout dated August 19, in a column corresponding to the constellation Sagittarius, Ehman found a sequence that broke the pattern entirely: 6EQUJ5. Read in order, it described a signal that rose, peaked, and fell across exactly the span of time the telescope needed to sweep past a single fixed point in the sky \u2014 the precise signature of something out there, not something here." },
    { kind: "quote", text: "It was thirty times louder than the background of deep space. And it arrived on the one frequency the universe reserves for hydrogen \u2014 the frequency any patient listener would choose, if they wanted to be heard." },
    { kind: "p", text: "That frequency is 1420 megahertz. Radio astronomers call the quiet band around it the \u201cwater hole,\u201d and they protect it by international agreement: no satellite, no transmitter, no aircraft is permitted to broadcast there. It is the natural channel of the most common element in existence \u2014 which is exactly why it has long been proposed as the channel a distant civilization might use to say hello." },

    { kind: "section", label: "What it wasn't" },
    { kind: "p", text: "In the years since, nearly every ordinary explanation has been raised and set down again. A passing aircraft would have moved. A satellite would have been catalogued, and broadcasting in that band would have been illegal besides. A signal bouncing off space debris would not have held so steady. In 2017, a researcher proposed that a pair of comets had been quietly emitting hydrogen as they passed; other astronomers checked the math and the comets, and found neither in the right place at the right time." },
    { kind: "p", text: "The most stubborn fact is the simplest one. The signal came from a patch of sky with no remarkable star, no known object, nothing that should have been broadcasting at all \u2014 and it came exactly once." },

    { kind: "section", label: "The silence after" },
    { kind: "p", text: "Ehman and others returned to those coordinates again and again. The Big Ear listened. Other telescopes listened. In the decades since, the spot has been checked more than a hundred times, with instruments far more sensitive than the one that first heard it. Every time, the sky has answered the same way." },
    { kind: "p", text: "In 1998, Big Ear was dismantled to make room for the golf course to expand. The man who circled the signal kept the printout. He spent the rest of his life careful never to claim too much \u2014 only that, for seventy-two seconds in the summer of 1977, his telescope heard something it was built to hope for, and then never heard it again." },
  ],

  sources: [
    "Ehman, J. R. \u2014 \u201cThe Big Ear Wow! Signal: What We Know and Don't Know\u201d (North American AstroPhysical Observatory).",
    "Gray, R. H. \u2014 The Elusive Wow: Searching for Extraterrestrial Intelligence (2012).",
    "Ohio State University Radio Observatory archives, 1977 survey printouts.",
  ],
  disclaimer: "Every Still at Nine story is built from documented sources. We tell you what was recorded, what was tested, and where the record runs out \u2014 and we leave the open questions open.",
};

if (typeof window !== "undefined") window.EMAIL = EMAIL;
