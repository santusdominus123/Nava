export interface BibleVerse {
  reference: string;
  text: string;
}

export interface BibleBook {
  id: number;
  name: string;
}

export interface ChapterVerse {
  pk: number;
  verse: number;
  text: string;
  chapter: number;
  book_name: string;
}

const POPULAR_VERSES: BibleVerse[] = [
  { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
  { reference: 'Philippians 4:13', text: 'I can do all this through him who gives me strength.' },
  { reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.' },
  { reference: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
  { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
  { reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.' },
  { reference: 'Psalm 23:1', text: 'The Lord is my shepherd, I lack nothing.' },
  { reference: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.' },
  { reference: 'Joshua 1:9', text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.' },
  { reference: '2 Timothy 1:7', text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.' },
  { reference: 'Psalm 46:1', text: 'God is our refuge and strength, an ever-present help in trouble.' },
  { reference: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.' },
  { reference: 'Romans 12:2', text: 'Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God\'s will is\u2014his good, pleasing and perfect will.' },
  { reference: 'Hebrews 11:1', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.' },
  { reference: '1 Corinthians 13:4-7', text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres.' },
  { reference: 'Galatians 5:22-23', text: 'But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control. Against such things there is no law.' },
  { reference: 'Ephesians 2:8-9', text: 'For it is by grace you have been saved, through faith\u2014and this is not from yourselves, it is the gift of God\u2014not by works, so that no one can boast.' },
  { reference: 'James 1:2-3', text: 'Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.' },
  { reference: '1 Peter 5:7', text: 'Cast all your anxiety on him because he cares for you.' },
  { reference: 'Psalm 119:105', text: 'Your word is a lamp for my feet, a light on my path.' },
  { reference: 'Proverbs 16:3', text: 'Commit to the Lord whatever you do, and he will establish your plans.' },
  { reference: 'Isaiah 40:31', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.' },
  { reference: 'Lamentations 3:22-23', text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.' },
  { reference: 'Micah 6:8', text: 'He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.' },
  { reference: 'Matthew 6:33', text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.' },
  { reference: 'John 14:6', text: 'Jesus answered, "I am the way and the truth and the life. No one comes to the Father except through me."' },
  { reference: 'Romans 5:8', text: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.' },
  { reference: '2 Corinthians 5:17', text: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!' },
  { reference: 'Colossians 3:23', text: 'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.' },
  { reference: 'Revelation 21:4', text: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.' },
];

export async function searchBibleVerses(
  query: string,
  translation: string = 'NIV',
): Promise<BibleVerse[]> {
  try {
    const url = `https://bolls.life/search/${translation}/?search=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    return data.map((result: { book_name: string; chapter: number; verse: number; text: string }) => ({
      reference: `${result.book_name} ${result.chapter}:${result.verse}`,
      text: result.text,
    }));
  } catch (error) {
    console.error('Error searching Bible verses:', error);
    return [];
  }
}

export async function getChapter(
  bookId: number,
  chapter: number,
  translation: string = 'NIV',
): Promise<ChapterVerse[]> {
  try {
    const url = `https://bolls.life/get-chapter/${translation}/${bookId}/${chapter}/`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return [];
  }
}

export function getVerseOfTheDay(): BibleVerse {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return POPULAR_VERSES[dayOfYear % POPULAR_VERSES.length];
}

export function getBibleBooks(): BibleBook[] {
  return [
    { id: 1, name: 'Genesis' },
    { id: 2, name: 'Exodus' },
    { id: 3, name: 'Leviticus' },
    { id: 4, name: 'Numbers' },
    { id: 5, name: 'Deuteronomy' },
    { id: 6, name: 'Joshua' },
    { id: 7, name: 'Judges' },
    { id: 8, name: 'Ruth' },
    { id: 9, name: '1 Samuel' },
    { id: 10, name: '2 Samuel' },
    { id: 11, name: '1 Kings' },
    { id: 12, name: '2 Kings' },
    { id: 13, name: '1 Chronicles' },
    { id: 14, name: '2 Chronicles' },
    { id: 15, name: 'Ezra' },
    { id: 16, name: 'Nehemiah' },
    { id: 17, name: 'Esther' },
    { id: 18, name: 'Job' },
    { id: 19, name: 'Psalms' },
    { id: 20, name: 'Proverbs' },
    { id: 21, name: 'Ecclesiastes' },
    { id: 22, name: 'Song of Solomon' },
    { id: 23, name: 'Isaiah' },
    { id: 24, name: 'Jeremiah' },
    { id: 25, name: 'Lamentations' },
    { id: 26, name: 'Ezekiel' },
    { id: 27, name: 'Daniel' },
    { id: 28, name: 'Hosea' },
    { id: 29, name: 'Joel' },
    { id: 30, name: 'Amos' },
    { id: 31, name: 'Obadiah' },
    { id: 32, name: 'Jonah' },
    { id: 33, name: 'Micah' },
    { id: 34, name: 'Nahum' },
    { id: 35, name: 'Habakkuk' },
    { id: 36, name: 'Zephaniah' },
    { id: 37, name: 'Haggai' },
    { id: 38, name: 'Zechariah' },
    { id: 39, name: 'Malachi' },
    { id: 40, name: 'Matthew' },
    { id: 41, name: 'Mark' },
    { id: 42, name: 'Luke' },
    { id: 43, name: 'John' },
    { id: 44, name: 'Acts' },
    { id: 45, name: 'Romans' },
    { id: 46, name: '1 Corinthians' },
    { id: 47, name: '2 Corinthians' },
    { id: 48, name: 'Galatians' },
    { id: 49, name: 'Ephesians' },
    { id: 50, name: 'Philippians' },
    { id: 51, name: 'Colossians' },
    { id: 52, name: '1 Thessalonians' },
    { id: 53, name: '2 Thessalonians' },
    { id: 54, name: '1 Timothy' },
    { id: 55, name: '2 Timothy' },
    { id: 56, name: 'Titus' },
    { id: 57, name: 'Philemon' },
    { id: 58, name: 'Hebrews' },
    { id: 59, name: 'James' },
    { id: 60, name: '1 Peter' },
    { id: 61, name: '2 Peter' },
    { id: 62, name: '1 John' },
    { id: 63, name: '2 John' },
    { id: 64, name: '3 John' },
    { id: 65, name: 'Jude' },
    { id: 66, name: 'Revelation' },
  ];
}
