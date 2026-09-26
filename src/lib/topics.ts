export interface DebateTopic {
  id: string;
  title: string;
  category?: string;
  defaultProContext?: string;
  defaultConContext?: string;
}

export const CURATED_TOPICS: DebateTopic[] = [
  {
    id: "ai-good-vs-harm",
    title: "AI will do more good than harm for humanity",
  },
  {
    id: "remote-vs-office",
    title: "Remote work beats office work for both companies and workers",
  },
  {
    id: "social-media-ban",
    title: "Social media should be legally banned for anyone under 16",
  },
  {
    id: "nuclear-energy",
    title: "Nuclear power is indispensable for reaching global net-zero emissions",
  },
  {
    id: "universal-basic-income",
    title: "Universal Basic Income is inevitable in the age of automation",
  },
  {
    id: "college-degree-value",
    title: "A traditional four-year college degree is no longer worth the financial cost",
  },
  {
    id: "cashless-society",
    title: "Physical cash should be phased out entirely in favor of digital currency",
  },
  {
    id: "space-exploration-priority",
    title: "Human space colonization is a dangerous distraction from Earth's problems",
  },
  {
    id: "crypto-financial-system",
    title: "Decentralized crypto is fundamentally superior to state-backed fiat banking",
  },
  {
    id: "longevity-ethics",
    title: "Extending the human lifespan beyond 120 years would be a societal disaster",
  },
];
