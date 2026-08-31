export type Project = {
  slug: string
  title: string
  tagline: string
  blurb: string
  story: string[]
  stack: string[]
  award?: string
  page: number
  url?: string
}

export type Experience = {
  id: string
  role: string
  org: string
  period: string
  headline: string
  story: string[]
  url?: string
}

export const site = {
  name: 'Durva Sharma',
  volume: 'Volume 02',
  location: 'Bengaluru',
  email: 'durva.s170@gmail.com',
  linkedin: 'https://www.linkedin.com/in/durva-s/',
  github: 'https://github.com/sykeriin',
  coverHook: 'year two. still messing around.',
  coverLine:
    "cse at mahe. i build apps, agents, and half-broken pipelines until they behave. sometimes they do. sometimes i learn why they didn't.",
  currentlyBuilding: 'petally internship, voice os experiments, sleep (eventually)',
}

export const sfxTags = ['BAM', 'CLANG', 'THWIP', 'ZING', 'GASP', 'SNAP'] as const

export const nav = [
  { to: '/origin', label: 'Origin', chapter: '01' },
  { to: '/training', label: 'Training', chapter: '02' },
  { to: '/projects', label: 'Projects', chapter: '03' },
  { to: '/skill-tree', label: 'Skill Tree', chapter: 'EX' },
  { to: '/contact', label: 'TBC…', chapter: 'END' },
] as const

export const chapterMeta: Record<
  string,
  { title: string; subtitle: string; page: string; prev?: string; next?: string }
> = {
  '/origin': {
    title: 'Chapter 01',
    subtitle: 'Origin',
    page: 'p. 03',
    prev: '/',
    next: '/training',
  },
  '/training': {
    title: 'Chapter 02',
    subtitle: 'Training Arc',
    page: 'p. 11',
    prev: '/origin',
    next: '/projects',
  },
  '/projects': {
    title: 'Chapter 03',
    subtitle: 'Projects',
    page: 'p. 19',
    prev: '/training',
    next: '/skill-tree',
  },
  '/skill-tree': {
    title: 'Extra',
    subtitle: 'Skill Tree',
    page: 'p. 41',
    prev: '/projects',
    next: '/contact',
  },
  '/contact': {
    title: 'Last Page',
    subtitle: 'To Be Continued…',
    page: 'p. 48',
    prev: '/skill-tree',
    next: '/',
  },
}

export const origin = {
  panels: [
    {
      title: 'hi, i’m durva',
      body: "second year cse at mahe in bengaluru. i like making things people can actually use. an app someone opens. a model that finds junk on a runway. a hackathon demo that doesn't die mid-pitch.",
    },
    {
      title: 'what i’m into',
      body: "ai and software, mostly. sometimes a paper rabbit hole. sometimes i just ship so my brain shuts up. i change my mind a lot. that's allowed.",
    },
    {
      title: 'school',
      body: 'b.tech cse, mahe bengaluru. around may 2029. year two feels less like surviving orientation and more like “wait, i can build stuff now.”',
    },
    {
      title: 'outside class',
      body: "neuraai + innovation centre committees. random visual work for the pvc's office. volunteered at supercomputing india. founded a mun club in school because of course i did.",
    },
  ],
  pullQuote: 'i stay up because one more fix feels closer than sleep.',
}

export const experiences: Experience[] = [
  {
    id: 'petally',
    role: 'Software Development Intern',
    org: 'PetAlly',
    period: '2026 - Present',
    headline: 'helping pet people find other pet people (and useful stuff nearby).',
    url: 'https://mypetally.com/',
    story: [
      "interning at petally. community app for pet owners. recommendations, local services, that whole find-your-people thing.",
      "lots of screens and flows and making sure it doesn't feel empty. nice building something someone might open after work.",
    ],
  },
  {
    id: 'hawkeye',
    role: 'OpenCV Preprocessing Lead',
    org: 'HAWKEYE',
    period: '2025 - 2026',
    headline: 'finding debris on iaf runways. from a moving vehicle. stressful in a cool way.',
    story: [
      "worked with the indian air force on fod detection. yolov8 on a jetson orin nx. if the frames going in are trash, the model is just confidently wrong.",
      "old motion pipeline was broken. i led opencv preprocessing, ripped it out, rebuilt a static-frame path: bilateral filter, clahe, crop the useless top, skip frames so the jetson doesn't melt.",
      "that's my favorite kind of problem. something stuck in the real world, and you get to unstick it.",
    ],
  },
]

export const projects: Project[] = [
  {
    slug: 'alter',
    title: 'ALTER',
    tagline: 'voice-first ai mobile os experiment',
    blurb: 'what if your phone listened like an os instead of another chat box?',
    url: 'https://alter-azure-three.vercel.app/',
    story: [
      "flutter app. future-os doodle. voice first, material 3, riverpod, clean architecture so the ui can't bully the logic.",
      "on-device gemma 4, sherpa-onnx for offline speech, sqlcipher for the db, pin / biometrics. supabase optional. proactive agent mode that's a little spooky. i kinda like that.",
      "still rough. that's fine. it exists.",
    ],
    stack: ['Flutter', 'Riverpod', 'Gemma 4', 'sherpa-onnx', 'SQLCipher', 'Supabase'],
    page: 21,
  },
  {
    slug: 'chainguard',
    title: 'ChainGuard OTA',
    tagline: 'firmware updates that can’t lie about who signed them',
    blurb: 'hackathon win. cryptography. soft-drink weekend.',
    story: [
      "ota for software-defined vehicles. ed25519, sha-3, hyperledger fabric keeping the receipt.",
      "i worked on the crypto scheme and how it plugged into the ledger. four of us. barely any sleep. 1st at mahe mobility hackathon 2026.",
      "still the result i grin at when i'm spiraling over something else.",
    ],
    stack: ['Ed25519', 'SHA-3', 'Hyperledger Fabric', 'OTA', 'SDV'],
    award: '1ST',
    page: 25,
  },
  {
    slug: 'verdant',
    title: 'VERDANT',
    tagline: 'tracing clothes through supply chains',
    blurb: 'nlp + probability for a textile trail that isn’t just vibes.',
    story: [
      "unisys innovation program. backend for circular-economy traceability. spacy, langchain, some probabilistic inference when the data shrugs.",
      "postgres on render. demo held up. proving where a shirt came from is harder than the pitch deck.",
    ],
    stack: ['spaCy', 'LangChain', 'PostgreSQL', 'Render', 'NLP'],
    award: 'UNISYS',
    page: 29,
  },
  {
    slug: 'cloudsense',
    title: 'CloudSense',
    tagline: 'when your aws bill starts yelling',
    blurb: 'anomalies + forecasts so the surprise invoice hits less hard.',
    url: 'https://cloud-sense-v1.vercel.app/',
    story: [
      "pulled aws cost explorer data. hunted weird spikes with isolation forest. forecasted pain with prophet.",
      "react + fastapi. i owned the ml side. we actually deployed it. not just slides.",
    ],
    stack: ['Python', 'Prophet', 'Isolation Forest', 'React', 'FastAPI', 'AWS'],
    page: 33,
  },
  {
    slug: 'roadsense',
    title: 'RoadSense AI',
    tagline: 'road infra intel across indian cities, many languages',
    blurb: 'multi-agent aws pipeline. loud data. mushy conclusions? no thanks.',
    story: [
      "bedrock + lambda agents scraping / aggregating multilingual public signals about roads.",
      "i worked on the inference side. trying to keep the agents from turning everything into mush.",
    ],
    stack: ['AWS Bedrock', 'Lambda', 'Multi-agent', 'NLP'],
    page: 37,
  },
]

export const skills = {
  languages: ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'Dart', 'SQL'],
  aiml: [
    'LLMs',
    'Agentic AI',
    'PyTorch',
    'OpenCV',
    'YOLOv8',
    'scikit-learn',
    'Prophet',
    'spaCy',
    'LangChain',
    'Gemma 4',
    'sherpa-onnx',
  ],
  frameworks: [
    'Flutter',
    'React.js',
    'FastAPI',
    'Flask',
    'Playwright',
    'SQLAlchemy',
    'Riverpod',
  ],
  infra: [
    'AWS',
    'Docker',
    'PostgreSQL',
    'Redis',
    'Supabase',
    'SQLCipher',
    'Jetson Orin NX',
    'Git',
  ],
}

export const achievements = [
  { stamp: 'TOP 32', label: 'Zenith26. Top 32 / 1,000+ teams. 2026' },
  { stamp: '1ST', label: 'ChainGuard OTA. MAHE Mobility Hackathon 2026' },
  { stamp: '2ND', label: 'UI/UX Sprint. Tech Solstice 2026' },
  { stamp: 'TOP 10', label: 'IQOO Hackathon. 2026' },
  { stamp: 'TOP 10', label: 'Point Blank CTF' },
]

export const leadership = [
  'Working committee: NeuraAI & MAHE Innovation Centre (2025-Present)',
  "Visual assets for the Pro-Vice Chancellor's office, MAHE (2025-2026)",
  'Volunteer: SuperComputing India (Dec 2025)',
  'Founded the MUN club at Deens Academy (and somehow ran it)',
]

/**
 * The creative half of the volume. He said it directly: "not only am I a tech
 * person, I also model … I direct shoots, videos for people … I can do UI/UX."
 * The tech side and this side are two covers of the same book.
 */
export const creative = {
  hook: 'same person, other cover. i also get in front of cameras, and behind them.',
  chapters: {
    studio: {
      title: 'Studio',
      lede: 'the half of me that works in frames instead of functions.',
      panels: [
        {
          id: 'modelling',
          title: 'i model',
          body: "editorial and fashion stuff. i know what a photo needs from both sides of the lens, which turns out to be rare. yes it confuses the engineering crowd. no i'm not choosing.",
        },
        {
          id: 'shoots',
          title: 'i direct shoots',
          body: "photoshoots and videos — concept, mood boards, shot lists, wrangling people on the day, the edit after. if you need someone who can hold a creative vision AND a schedule, that's the job i like most.",
        },
      ],
    },
    direction: {
      title: 'Direction',
      lede: 'design is deciding what the thing is before anyone builds it.',
      panels: [
        {
          id: 'webdesign',
          title: 'i design websites',
          body: "ui/ux and art direction for the web. this site is the portfolio piece: i directed it like a shoot — art direction doc, palette rules, a shader instead of a lighting rig.",
        },
        {
          id: 'video',
          title: 'i direct videos',
          body: 'short-form, launch videos, weird ideas people are scared to storyboard. bring me the idea while it is still embarrassing.',
        },
      ],
    },
    session: {
      title: 'Session',
      lede: 'the guitar is the other 2am machine.',
      panels: [
        {
          id: 'guitar',
          title: 'i play guitar',
          body: "mostly at night, mostly for me. it's the one build that never ships and that's the point.",
        },
        {
          id: 'collab',
          title: 'make something with me',
          body: "photoshoots, videos, websites, weird hybrids of all three. i like collaborating with people who care about the craft. the envelope on the last page works for this side too.",
        },
      ],
    },
  },
} as const

export const funThings =
  'muay thai, guitar, runs, hikes. when my brain is soup i hit pads or a trail until it un-soups a little.'

export const contactBits = [
  { label: 'mail', href: `mailto:durva.s170@gmail.com`, text: 'durva.s170@gmail.com' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/durva-s/', text: 'linkedin.com/in/durva-s' },
  { label: 'github', href: 'https://github.com/sykeriin', text: 'github.com/sykeriin' },
]
