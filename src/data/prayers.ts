import { PrayerCategory } from '../types';

export const prayerCategories: PrayerCategory[] = [
  {
    id: 'gratitude',
    name: 'Gratitude',
    icon: 'rose-outline',
    description: 'Thank God for His blessings',
    steps: [
      {
        title: 'Give Thanks',
        instruction:
          'Begin by thanking God for the gift of life today. Reflect on the blessings you have received — your health, your family, your daily provisions.',
        duration: 60,
      },
      {
        title: 'Count Your Blessings',
        instruction:
          'Think of three specific things that happened recently that you are grateful for. Name them before God and express your thankfulness.',
        duration: 60,
      },
      {
        title: 'Praise His Name',
        instruction:
          'Close this prayer by praising God for who He is — faithful, loving, generous, and good. Let your heart overflow with worship.',
        duration: 60,
      },
    ],
  },
  {
    id: 'healing',
    name: 'Healing',
    icon: 'leaf-outline',
    description: 'Pray for healing and restoration',
    steps: [
      {
        title: 'Acknowledge His Power',
        instruction:
          'Recognize that God is the Great Healer. He has the power to restore your body, mind, and spirit. Surrender your pain to Him.',
        duration: 60,
      },
      {
        title: 'Pray for Healing',
        instruction:
          'Bring your specific need for healing before God. Whether physical, emotional, or spiritual — lay it at His feet and ask for His touch.',
        duration: 90,
      },
      {
        title: 'Trust His Plan',
        instruction:
          'Trust that God hears your prayer. Whether healing comes immediately or through a process, believe that He is working for your good.',
        duration: 60,
      },
    ],
  },
  {
    id: 'guidance',
    name: 'Guidance',
    icon: 'compass-outline',
    description: "Seek God's direction for your life",
    steps: [
      {
        title: 'Quiet Your Mind',
        instruction:
          "Still your thoughts and focus on God's presence. Let go of distractions and create space to hear His voice.",
        duration: 60,
      },
      {
        title: 'Ask for Direction',
        instruction:
          'Present the decisions or challenges you are facing to God. Ask Him to reveal His will and to give you wisdom to discern the right path.',
        duration: 90,
      },
      {
        title: 'Commit Your Way',
        instruction:
          'Commit your plans to the Lord. Trust that He will guide your steps and open the right doors at the right time.',
        duration: 60,
      },
    ],
  },
  {
    id: 'strength',
    name: 'Strength',
    icon: 'shield-checkmark-outline',
    description: "Find strength in God's power",
    steps: [
      {
        title: 'Acknowledge Your Weakness',
        instruction:
          'Humbly come before God and acknowledge that your strength is limited. Admit the areas where you feel weak or overwhelmed.',
        duration: 60,
      },
      {
        title: 'Claim His Strength',
        instruction:
          "Declare that God's power is made perfect in weakness. Ask Him to fill you with supernatural strength to face your challenges.",
        duration: 90,
      },
      {
        title: 'Stand Firm',
        instruction:
          'Rise with renewed confidence. God has heard your prayer and His strength is now at work within you. Go forward in faith.',
        duration: 60,
      },
    ],
  },
  {
    id: 'forgiveness',
    name: 'Forgiveness',
    icon: 'water-outline',
    description: "Experience God's mercy and forgive others",
    steps: [
      {
        title: 'Confess',
        instruction:
          'Come before God with a humble heart. Confess any sins or shortcomings. He is faithful and just to forgive you and cleanse you.',
        duration: 60,
      },
      {
        title: 'Receive Forgiveness',
        instruction:
          "Accept God's forgiveness. Let go of guilt and shame. His grace is sufficient, and His mercy is new every morning.",
        duration: 60,
      },
      {
        title: 'Forgive Others',
        instruction:
          'Ask God to help you forgive those who have hurt you. Release bitterness and choose to extend the same grace God has given you.',
        duration: 90,
      },
    ],
  },
];
