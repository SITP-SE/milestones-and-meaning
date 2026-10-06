// Stand-in for the Pages table. Each row is { id, content }.
const pages = [
  {
    id: 'funeral',
    content: {
      hero: {
        hideImageOnMobile: true,
        eyebrow: 'Funeral & Memorial Service',
        headline: 'When you need someone to help you say goodbye',
        lines: [
          'Compassionate guidance for grieving families.',
          'Immediate, personal, and pressure-free support.',
        ],
        cta: { label: 'Request a Callback', href: '#callback', icon: 'phone' },
        image: {
          src: '/images/funeral-hero.png',
          alt: "A lit pillar candle and baby's breath on linen",
        },
      },
      explain: {
        eyebrow: 'Honouring a life',
        headline: 'What is a personalized memorial service?',
        paragraphs: [
          'A personalized memorial service creates space for family and friends to remember, reflect, and say goodbye in a way that feels true to the person who died. Rather than following a fixed script, the ceremony is shaped around their story, values, relationships, and the moments people will carry with them.',
          'You do not need to know how the ceremony should look or find all the right words on your own. We begin with a gentle conversation, listen to what mattered most, and guide you through each decision with care. Together, we create a meaningful service that honours their life and gives those gathered a place to share love, memory, and loss.',
        ],
      },
      steps: [
        {
          title: 'We talk',
          lines: ['A gentle phone conversation,', "when you're ready"],
        },
        {
          title: 'We learn about them',
          lines: ['We listen and honor what', 'made them unique'],
        },
        {
          title: 'We create the ceremony',
          lines: ['A meaningful ceremony', 'that reflects their life.'],
        },
      ],
      offering: {
        eyebrow: 'Personalized Memorial Service',
        price: '$400',
        body: 'We craft personalized memorials that celebrate their story, values, and the moments that mattered most - with care, creativity, and attention to every detail.',
        includes: [
          'Initial consultation',
          'Personalized ceremony planning',
          'Personalized script and officiating',
        ],
        image: {
          src: '/images/funeral-offering.png',
          alt: 'A lit candle and white flowers on linen',
        },
      },
      callbackForm: {
        eyebrow: 'We are here when you are ready',
        headline: 'Request a callback',
        body: "Leave your name and phone number, and we'll call you as soon as we can.",
      },
      prompt: {
        title: 'Looking for grief and bereavement support?',
        body: 'Private support is available wherever you are in your experience of loss.',
        cta: { label: 'Explore grief support', href: '/services/grief-support' },
      },
    },
  },
  {
    id: 'grief-support',
    content: {
      hero: {
        hideImageOnMobile: true,
        tone: 'cream',
        eyebrow: 'Grief and bereavement support',
        headline: "You don't have to go\nthrough this alone.",
        lines: [
          'Compassionate support for those navigating loss -',
          'with a listening ear, practical guidance, and space to heal',
          'at your own pace.',
        ],
        cta: { label: 'Request a Callback', href: '#callback', icon: 'phone' },
        image: {
          src: '/images/grief-hero.png',
          alt: "One person's hand resting on another's beside a mug",
        },
      },
      prompt: {
        placement: 'start',
        title: 'Looking for funeral or memorial officiation?',
        body: 'Gabi can help your family create a personal, meaningful ceremony',
        cta: { label: 'View funeral services', href: '/services/funeral' },
      },
      explain: {
        eyebrow: 'Understanding grief',
        headline: 'What is grief?',
        paragraphs: [
          'Grief is a natural response to losing someone or something that mattered deeply. It is the way our minds and bodies begin to make sense of a life that has suddenly changed. Grief can bring sadness and longing, but it can also feel like anger, guilt, confusion, relief, exhaustion, or a numbness that is difficult to name. These feelings may arrive in waves, appear when you least expect them, or change from one day to the next.',
          'There is no correct way to grieve and no timeline you are supposed to follow. Some days may feel manageable, while others make ordinary tasks, relationships, or decisions feel much harder. Support can give you a safe place to speak honestly, understand what you are experiencing, and find ways to move through daily life without leaving your loss behind. You do not need to have the right words or wait until things feel unbearable before reaching out. With time and care, it is possible to honour who or what you are missing while gradually finding steadier ground, connection, and meaning again.',
        ],
      },
      reasons: {
        eyebrow: 'Reasons people reach out',
        headline: 'Grief can look like many things',
        body: "You don't need to know exactly what you need before reaching out.",
        items: [
          { text: 'Someone you love has died.' },
          { text: 'Everyday life feels harder than expected.' },
          { text: 'You are supporting a grieving child or family member.' },
          { text: 'Anniversaries or holidays bring everything back.' },
          { text: 'Your loss is not fully recognized by others.' },
          { text: 'You are wondering whether what you feel is grief.' },
        ],
      },
      resources: {
        eyebrow: 'Additional resources',
        headline: 'Support for the moments between conversations',
        body: 'Explore gentle, practical resources about grief, loss, and the days that follow',
        items: [
          {
            label: 'Watch',
            title: 'Understanding Grief and Loss',
            body: 'A quiet conversation about what grief can feel like',
          },
          {
            label: 'Read',
            title: 'Books for grief and life transitions',
            body: "Thoughtful recommendations from Gabi's bookshelf",
          },
          {
            label: 'Visit the resource center',
            title: 'All grief and bereavement resources',
            body: 'Videos, reading, and guidance gathered in one place',
          },
        ],
      },
      callbackForm: {
        eyebrow: 'We are here when you are ready',
        headline: 'Request a callback',
        body: "Leave your name and phone number, and we'll call you as soon as we can.",
      },
    },
  },
];

export async function getPageIds() {
  return pages.map((page) => page.id);
}

export async function getPage(id) {
  return pages.find((page) => page.id === id) ?? null;
}
