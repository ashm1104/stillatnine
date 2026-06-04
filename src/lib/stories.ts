// Story preview data — locked copy from lp-app.jsx (STORIES). Do not rewrite.

export interface Story {
  num: string;
  title: string;
  preview: string;
  cutoff: boolean;
}

export const STORIES: Story[] = [
  {
    num: "04",
    title: "The village that appeared on no map",
    preview:
      'In 1930, a British cartographer working on a survey of the upper Amazon basin marked a settlement that appeared in no colonial record. No census counted its people. No missionary had visited. His field notes contain a single annotation: "Settlement observed. Approx. 200 souls. No name given."\n\nHe never visited the site. Six years later, a follow-up expedition found the coordinates empty — just river and canopy. But the cartographer\'s original survey plate, examined under magnification decades later, revealed something his published map had not shown: a second settlement, three miles northeast, that he had carefully',
    cutoff: true,
  },
  {
    num: "11",
    title: "A signal with no source. Forty years.",
    preview:
      'On the night of August 15, 1977, astronomer Jerry Ehman was reviewing data from Ohio State University\'s Big Ear radio telescope when he spotted a sequence so striking he circled it and wrote "Wow!" in the margin. The signal lasted 72 seconds. It matched the expected frequency of an interstellar communication. It was thirty times louder than the background noise of deep space.\n\nAnd then it was gone.\n\nIn the forty years since, every attempt to detect it again has failed. The signal came from the direction of Sagittarius, from a region of sky with no remarkable stars. It was not a satellite, not an aircraft, not a terrestrial signal bouncing off debris.\n\nThe Big Ear telescope was demolished in 1998 to make way for a golf course. The source of the Wow! signal has never been identified.',
    cutoff: false,
  },
  {
    num: "18",
    title: "The manuscript no one could read",
    preview:
      "In 1912, a rare book dealer named Wilfrid Voynich purchased a medieval manuscript from a Jesuit college near Rome. The book was roughly 240 pages, illustrated with drawings of unidentified plants, astronomical diagrams, and what appeared to be bathing women connected by elaborate plumbing.\n\nEvery page was written in an unknown script that no linguist, cryptographer, or computer has ever",
    cutoff: true,
  },
];
