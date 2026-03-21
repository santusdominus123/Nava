import { Devotional } from '../types';

export const devotionals: Devotional[] = [
  {
    id: '1',
    date: '2026-03-10',
    verse: {
      reference: 'John 3:16',
      text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    },
    reflection:
      "God's love for humanity is unconditional and sacrificial. This verse reminds us that salvation is a gift freely offered to everyone who believes. No matter what you are going through today, remember that God loved you enough to give His very best for you.",
    prayer:
      'Lord, thank You for Your immeasurable love. Help me to truly grasp the depth of Your sacrifice and to live in the light of Your grace today. Amen.',
  },
  {
    id: '2',
    date: '2026-03-11',
    verse: {
      reference: 'Psalm 23:1-3',
      text: 'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',
    },
    reflection:
      "When life feels overwhelming, remember that God is your shepherd. He provides rest, peace, and renewal for your weary soul. You don't need to carry your burdens alone — let the Good Shepherd guide you to places of restoration.",
    prayer:
      'Heavenly Father, be my shepherd today. Lead me to places of peace and restore my soul. Help me trust that You will provide everything I need. Amen.',
  },
  {
    id: '3',
    date: '2026-03-12',
    verse: {
      reference: 'Philippians 4:13',
      text: 'I can do all this through him who gives me strength.',
    },
    reflection:
      "This verse isn't about superhuman abilities — it's about finding strength in Christ through every circumstance. Whether you face abundance or need, joy or suffering, Christ empowers you to endure and thrive. Your strength comes from Him, not from yourself.",
    prayer:
      'Lord Jesus, I draw my strength from You today. In every challenge and every victory, remind me that it is Your power working through me. Amen.',
  },
  {
    id: '4',
    date: '2026-03-13',
    verse: {
      reference: 'Romans 8:28',
      text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    },
    reflection:
      "Even when circumstances seem difficult or confusing, God is working behind the scenes. This promise assures us that nothing in our lives is wasted. Every experience, every trial, and every joy is being woven together by God's sovereign hand for our ultimate good.",
    prayer:
      'Father, help me trust that You are working all things for my good, even when I cannot see how. Give me faith to believe in Your perfect plan. Amen.',
  },
  {
    id: '5',
    date: '2026-03-14',
    verse: {
      reference: 'Proverbs 3:5-6',
      text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
    },
    reflection:
      "Our human understanding is limited, but God sees the full picture. When we surrender our plans and trust Him completely, He directs our steps with perfect wisdom. Today, choose to let go of your need to control and let God lead the way.",
    prayer:
      'Lord, I surrender my plans to You. Help me trust You with all my heart and not rely on my own limited understanding. Make my paths straight. Amen.',
  },
  {
    id: '6',
    date: '2026-03-15',
    verse: {
      reference: 'Isaiah 41:10',
      text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.',
    },
    reflection:
      "Fear is a natural human emotion, but God calls us to courage. His promise to be with us, strengthen us, and uphold us is an anchor for our souls. Whatever you face today, you do not face it alone — the Almighty God stands beside you.",
    prayer:
      'God, remove fear from my heart and replace it with Your peace. Thank You for Your promise to never leave me. I trust in Your strength today. Amen.',
  },
  {
    id: '7',
    date: '2026-03-16',
    verse: {
      reference: 'Jeremiah 29:11',
      text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."',
    },
    reflection:
      "God's plans for you are filled with hope and purpose. Even during seasons of waiting or uncertainty, His intentions toward you are good. Trust that the Author of your story is writing a beautiful narrative with your life.",
    prayer:
      'Lord, I believe that Your plans for me are good. Give me patience in seasons of waiting and hope for the future You have prepared. Amen.',
  },
];

export function getTodayDevotional(): Devotional {
  const today = new Date().toISOString().split('T')[0];
  const found = devotionals.find((d) => d.date === today);
  if (found) return found;
  const dayIndex = new Date().getDay() % devotionals.length;
  return devotionals[dayIndex];
}
