// iOS Widget Configuration for Bible Guide AI
// This file provides the data layer for the native iOS WidgetKit widget.
// The actual widget UI is built in Swift (see ios-widget-guide.md).

const DAILY_VERSES = [
  { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' },
  { ref: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.' },
  { ref: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord, plans to prosper you.' },
  { ref: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him.' },
  { ref: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding.' },
  { ref: 'Isaiah 41:10', text: 'So do not fear, for I am with you; be not dismayed, for I am your God.' },
  { ref: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son.' },
  { ref: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.' },
  { ref: 'Psalm 46:1', text: 'God is our refuge and strength, an ever-present help in trouble.' },
  { ref: 'Joshua 1:9', text: 'Be strong and courageous. Do not be afraid; do not be discouraged.' },
  { ref: 'Romans 12:2', text: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind.' },
  { ref: 'Psalm 119:105', text: 'Your word is a lamp for my feet, a light on my path.' },
  { ref: '2 Timothy 1:7', text: 'For God has not given us a spirit of fear, but of power and of love and of a sound mind.' },
  { ref: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God.' },
  { ref: 'Hebrews 11:1', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.' },
  { ref: 'Psalm 37:4', text: 'Take delight in the Lord, and he will give you the desires of your heart.' },
  { ref: '1 Corinthians 13:4', text: 'Love is patient, love is kind. It does not envy, it does not boast.' },
  { ref: 'Galatians 5:22-23', text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.' },
  { ref: 'Lamentations 3:22-23', text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning.' },
  { ref: 'Ephesians 2:8-9', text: 'For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God.' },
  { ref: 'Psalm 139:14', text: 'I praise you because I am fearfully and wonderfully made; your works are wonderful.' },
  { ref: 'Matthew 6:33', text: 'But seek first his kingdom and his righteousness, and all these things will be given to you.' },
  { ref: 'Isaiah 40:31', text: 'Those who hope in the Lord will renew their strength. They will soar on wings like eagles.' },
  { ref: 'Deuteronomy 31:6', text: 'Be strong and courageous. Do not be afraid or terrified, for the Lord your God goes with you.' },
  { ref: 'Psalm 27:1', text: 'The Lord is my light and my salvation—whom shall I fear?' },
  { ref: 'Colossians 3:23', text: 'Whatever you do, work at it with all your heart, as working for the Lord.' },
  { ref: 'James 1:5', text: 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault.' },
  { ref: 'Psalm 34:18', text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.' },
  { ref: 'Romans 15:13', text: 'May the God of hope fill you with all joy and peace as you trust in him.' },
  { ref: '1 Peter 5:7', text: 'Cast all your anxiety on him because he cares for you.' },
  { ref: 'Micah 6:8', text: 'He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.' },
];

export function getWidgetData(): { reference: string; text: string; date: string } {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];

  return {
    reference: verse.ref,
    text: verse.text,
    date: formatWidgetDate(today),
  };
}

export function formatWidgetDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export const VerseWidgetConfig = {
  name: 'VerseOfTheDay',
  description: "Shows today's verse on your home screen",
  supportedFamilies: ['small', 'medium'] as const,
  data: { getWidgetData },
};
