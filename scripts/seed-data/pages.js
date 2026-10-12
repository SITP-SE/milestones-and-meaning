export const pages = {
  'wedding-officiation': {
    content: {
      hero: {
        hideImageOnMobile: true,
        tone: 'cream',
        eyebrow: 'Wedding Officiation',
        headline: 'A ceremony that\nfeels unmistakably\nyours.',
        lines: ['Personalized wedding officiation with meaning, warmth, and every detail handled.'],
        price: '$595',
        deposit: '$250 deposit',
        cta: {
          label: 'Book a Consultation',
          href: '/#contact',
          icon: false,
          pill: true,
        },
        image: {
          src: '/images/service-marriage.png',
          alt: 'An open journal, wedding rings, and a pencil on linen',
        },
      },
      invite: {
        eyebrow: 'Officiating your day',
        headline: "Let's write your ceremony together",
        paragraphs: [
          "Your wedding day is a celebration of your love, your journey, and the life you're choosing to build together. Your ceremony should reflect all of that — not just the moment you exchange vows, but the little things that make your relationship uniquely yours.",
          "As your wedding officiant, I'll work with you to create a personalized ceremony that feels genuine, meaningful, and true to your story. We'll take the time to get to know you as a couple, learn what matters most to you, and weave your personalities, values, and shared experiences into a ceremony that feels natural and heartfelt. From choosing the right words and writing your vows to incorporating cultural traditions, meaningful readings, or a touch of humour, every detail can be shaped around what feels right for you.",
          "Whether you're dreaming of an intimate gathering with your closest loved ones, a relaxed outdoor celebration, or a larger wedding surrounded by family and friends, the goal is the same: to create a moment where you can slow down, be present with one another, and celebrate the commitment you're making.",
          "You don't need to have every detail figured out before we begin. I'll guide you through the process, answer your questions, and help make planning your ceremony feel less overwhelming and more enjoyable. Together, we'll create a celebration that honours your relationship, welcomes the people who matter most, and gives you a beautiful beginning to look back on for years to come.",
        ],
      },
      features: [
        {
          title: 'Personalized Ceremony',
          body: 'Written around your love story and values.',
        },
        {
          title: 'Planning Consultation',
          body: 'A deep-dive conversation to shape your ceremony.',
        },
        {
          title: 'Rehearsal Guidance',
          body: 'Clear direction so your day flows smoothly',
        },
        {
          title: 'Legal Paperwork',
          body: 'We prepare and file all required documents.',
        },
      ],
      prompt: {
        title: 'Explore the Complete Marriage Package',
        body: 'Relationship guidance, officiation, paperwork - one clear path from start to finish.',
        cta: {
          label: "See what's included",
          href: '/marriage-package',
        },
      },
    },
  },
  'grief-support': {
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
        cta: {
          label: 'Request a Callback',
          href: '#callback',
          icon: 'phone',
        },
        image: {
          src: '/images/grief-hero.png',
          alt: "One person's hand resting on another's beside a mug",
        },
      },

      prompt: {
        placement: 'start',
        title: 'Looking for funeral or memorial officiation?',
        body: 'Gabi can help your family create a personal, meaningful ceremony',
        cta: {
          label: 'View funeral services',
          href: '/services/funeral',
        },
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
          {
            text: 'Someone you love has died.',
          },
          {
            text: 'Everyday life feels harder than expected.',
          },
          {
            text: 'You are supporting a grieving child or family member.',
          },
          {
            text: 'Anniversaries or holidays bring everything back.',
          },
          {
            text: 'Your loss is not fully recognized by others.',
          },
          {
            text: 'You are wondering whether what you feel is grief.',
          },
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
  funeral: {
    content: {
      hero: {
        hideImageOnMobile: true,
        eyebrow: 'Funeral & Memorial Service',
        headline: 'When you need someone to help you say goodbye',
        lines: [
          'Compassionate guidance for grieving families.',
          'Immediate, personal, and pressure-free support.',
        ],
        cta: {
          label: 'Request a Callback',
          href: '#callback',
          icon: 'phone',
        },
        image: {
          src: '/images/funeral-hero.png',
          alt: "A lit pillar candle and baby's breath on linen",
        },
      },

      explain: {
        eyebrow: 'Honouring a life',
        headline: 'A farewell that reflects a life well lived',
        paragraphs: [
          'Saying goodbye to someone you love is never easy. A meaningful service can offer a moment to pause, come together, share memories, and honour the life of someone who will always matter. It creates space for grief, gratitude, laughter, and reflection — allowing family and friends to remember not only that a life has ended, but all the ways that life touched their own.',
          'Every person has a story worth remembering. Through a thoughtful, personalized ceremony, we bring that story to life by reflecting their values, relationships, cherished memories, and the little things that made them who they were. Whether you wish to honour a life through shared stories, meaningful readings, cultural traditions, or quiet moments of reflection, the service is shaped around what feels most true to them and those who loved them.',
          "You don't have to know where to begin or find all the right words on your own. We'll start with a gentle conversation, listen to what matters most to you, and guide you through the decisions ahead with patience and care. Together, we'll create a heartfelt farewell that honours their memory and offers those gathered a meaningful way to remember, reflect, and begin navigating the days ahead.",
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
        cta: {
          label: 'Explore grief support',
          href: '/services/grief-support',
        },
      },
    },
  },
};
