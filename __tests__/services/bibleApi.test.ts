import { getVerseOfTheDay, getBibleBooks } from '../../src/services/bibleApi';

describe('Bible API Service', () => {
  describe('getVerseOfTheDay', () => {
    it('should return a verse with reference and text', () => {
      const verse = getVerseOfTheDay();
      expect(verse).toBeDefined();
      expect(verse.reference).toBeTruthy();
      expect(verse.text).toBeTruthy();
    });

    it('should return the same verse for the same day', () => {
      const verse1 = getVerseOfTheDay();
      const verse2 = getVerseOfTheDay();
      expect(verse1.reference).toBe(verse2.reference);
      expect(verse1.text).toBe(verse2.text);
    });

    it('should return a verse with a valid reference format', () => {
      const verse = getVerseOfTheDay();
      // Reference should contain a book name and chapter:verse
      expect(verse.reference).toMatch(/\w+\s+\d+/);
    });
  });

  describe('getBibleBooks', () => {
    it('should return 66 books', () => {
      const books = getBibleBooks();
      expect(books).toHaveLength(66);
    });

    it('should start with Genesis and end with Revelation', () => {
      const books = getBibleBooks();
      expect(books[0].name).toBe('Genesis');
      expect(books[65].name).toBe('Revelation');
    });

    it('should have sequential IDs from 1 to 66', () => {
      const books = getBibleBooks();
      books.forEach((book, index) => {
        expect(book.id).toBe(index + 1);
      });
    });
  });
});
