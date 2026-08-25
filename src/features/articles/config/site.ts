export const SITE = {
  name: "Javad Bathaei",
  title: "Javad Bathaei — Articles",
  description: "Practical notes on frontend architecture, product engineering, and building understandable software.",
  url: "https://javadbat.github.io",
  locale: "en_US",
} as const;

export const AUTHOR = {
  name: "Seyed Mohammad Javad Bathaei",
  shortName: "Javad Bathaei",
  description: "Creative frontend web developer writing about resilient interfaces and product engineering.",
  url: `${SITE.url}/`,
  avatar: "/images/articles/javad-bathaei-avatar.png",
  sameAs: ["https://www.linkedin.com/in/javad-bathaei/"],
} as const;
