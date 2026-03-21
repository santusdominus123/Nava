import { Share } from 'react-native';

export async function shareVerseAsText(reference: string, text: string): Promise<void> {
  try {
    await Share.share({
      message: `📖 ${reference}\n\n"${text}"\n\n— Shared via Bible Guide AI`,
    });
  } catch (error) {
    console.error('Error sharing verse:', error);
  }
}

export async function shareVerseWithReflection(reference: string, text: string, reflection: string): Promise<void> {
  try {
    await Share.share({
      message: `📖 ${reference}\n\n"${text}"\n\n💭 ${reflection}\n\n— Shared via Bible Guide AI`,
    });
  } catch (error) {
    console.error('Error sharing verse:', error);
  }
}

export async function shareDevotional(reference: string, text: string, reflection: string, prayer: string): Promise<void> {
  try {
    await Share.share({
      message: `📖 Daily Devotional\n\n${reference}\n"${text}"\n\n💡 Reflection:\n${reflection}\n\n🙏 Prayer:\n${prayer}\n\n— Bible Guide AI`,
    });
  } catch (error) {
    console.error('Error sharing devotional:', error);
  }
}
