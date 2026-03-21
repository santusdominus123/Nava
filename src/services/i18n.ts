export type Language = 'en' | 'id' | 'ar';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // General
    app_name: 'Bible Guide AI',
    welcome: 'Welcome',
    good_morning: 'Good Morning',
    good_afternoon: 'Good Afternoon',
    good_evening: 'Good Evening',

    // Auth
    sign_in: 'Sign In',
    sign_up: 'Sign Up',
    email: 'Email address',
    password: 'Password',
    forgot_password: 'Forgot Password?',
    reset_password: 'Reset Password',
    send_reset_link: 'Send Reset Link',
    no_account: "Don't have an account?",
    have_account: 'Already have an account?',

    // Home
    todays_verse: "Today's Verse",
    continue_journey: 'Continue Your Journey',
    for_you: 'For You',
    weekly_streak: 'Weekly Streak',

    // Devotional
    todays_devotional: "Today's Devotional",
    reflection: 'Reflection',
    prayer: 'Prayer',
    start_prayer: 'Start Prayer',
    save: 'Save',
    saved: 'Saved',
    share: 'Share',

    // Prayer
    guided_prayer: 'Guided Prayer',
    find_peace: 'Find your peace',
    amen: 'Amen.',
    prayer_complete: 'Your heart is heard. May peace guard your mind today.',
    done: 'Done',

    // Chat
    ask_question: 'Ask a question about the Bible...',
    ai_thinking: 'Thinking...',
    chat_limit_reached: 'Daily chat limit reached',
    upgrade_premium: 'Upgrade to Premium for unlimited chats',

    // Search
    search_verses: 'Search Bible Verses',
    search_placeholder: 'Search verses (e.g. love, faith, John)',
    no_results: 'No results found',
    try_different: 'Try a different search term',
    results: 'results',

    // Profile
    settings: 'Settings',
    dark_mode: 'Dark Mode',
    notifications: 'Notifications',
    daily_reminder: 'Daily Reminder',
    language: 'Language',
    sign_out: 'Sign Out',
    clear_chat: 'Clear Chat History',
    saved_verses: 'Saved Verses',

    // Premium
    premium: 'Premium',
    deepen_journey: 'Deepen Your Spiritual Journey',
    monthly: 'Monthly',
    yearly: 'Yearly',
    start_trial: 'Start 7-Day Free Trial',
    cancel_anytime: 'Cancel anytime. Auto-renews.',

    // Reading Plans
    reading_plans: 'Reading Plans',
    day_of: 'Day %d of %d',
    start_plan: 'Start Plan',
    continue_reading: 'Continue Reading',
    plan_completed: 'Plan Completed!',

    // Verse Notes
    add_note: 'Add Note',
    edit_note: 'Edit Note',
    my_notes: 'My Notes',
    highlight: 'Highlight',

    // Streak
    current_streak: 'Current Streak',
    days: 'days',
    best_streak: 'Best Streak',
  },
  id: {
    // General
    app_name: 'Bible Guide AI',
    welcome: 'Selamat Datang',
    good_morning: 'Selamat Pagi',
    good_afternoon: 'Selamat Siang',
    good_evening: 'Selamat Malam',

    // Auth
    sign_in: 'Masuk',
    sign_up: 'Daftar',
    email: 'Alamat email',
    password: 'Kata sandi',
    forgot_password: 'Lupa Kata Sandi?',
    reset_password: 'Reset Kata Sandi',
    send_reset_link: 'Kirim Link Reset',
    no_account: 'Belum punya akun?',
    have_account: 'Sudah punya akun?',

    // Home
    todays_verse: 'Ayat Hari Ini',
    continue_journey: 'Lanjutkan Perjalananmu',
    for_you: 'Untuk Kamu',
    weekly_streak: 'Streak Mingguan',

    // Devotional
    todays_devotional: 'Renungan Hari Ini',
    reflection: 'Renungan',
    prayer: 'Doa',
    start_prayer: 'Mulai Berdoa',
    save: 'Simpan',
    saved: 'Tersimpan',
    share: 'Bagikan',

    // Prayer
    guided_prayer: 'Panduan Doa',
    find_peace: 'Temukan kedamaianmu',
    amen: 'Amin.',
    prayer_complete: 'Hatimu didengar. Semoga damai menyertai pikiranmu hari ini.',
    done: 'Selesai',

    // Chat
    ask_question: 'Tanya tentang Alkitab...',
    ai_thinking: 'Berpikir...',
    chat_limit_reached: 'Batas chat harian tercapai',
    upgrade_premium: 'Upgrade ke Premium untuk chat tanpa batas',

    // Search
    search_verses: 'Cari Ayat Alkitab',
    search_placeholder: 'Cari ayat (misal: kasih, iman, Yohanes)',
    no_results: 'Tidak ada hasil',
    try_different: 'Coba kata kunci lain',
    results: 'hasil',

    // Profile
    settings: 'Pengaturan',
    dark_mode: 'Mode Gelap',
    notifications: 'Notifikasi',
    daily_reminder: 'Pengingat Harian',
    language: 'Bahasa',
    sign_out: 'Keluar',
    clear_chat: 'Hapus Riwayat Chat',
    saved_verses: 'Ayat Tersimpan',

    // Premium
    premium: 'Premium',
    deepen_journey: 'Perdalam Perjalanan Rohanimu',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
    start_trial: 'Mulai Uji Coba 7 Hari',
    cancel_anytime: 'Batalkan kapan saja. Perpanjang otomatis.',

    // Reading Plans
    reading_plans: 'Rencana Baca',
    day_of: 'Hari %d dari %d',
    start_plan: 'Mulai Rencana',
    continue_reading: 'Lanjutkan Membaca',
    plan_completed: 'Rencana Selesai!',

    // Verse Notes
    add_note: 'Tambah Catatan',
    edit_note: 'Edit Catatan',
    my_notes: 'Catatan Saya',
    highlight: 'Sorotan',

    // Streak
    current_streak: 'Streak Saat Ini',
    days: 'hari',
    best_streak: 'Streak Terbaik',
  },
  ar: {
    // General
    app_name: 'دليل الكتاب المقدس الذكي',
    welcome: 'مرحباً',
    good_morning: 'صباح الخير',
    good_afternoon: 'مساء الخير',
    good_evening: 'مساء الخير',

    // Auth
    sign_in: 'تسجيل الدخول',
    sign_up: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    forgot_password: 'هل نسيت كلمة المرور؟',
    reset_password: 'إعادة تعيين كلمة المرور',
    send_reset_link: 'إرسال رابط إعادة التعيين',
    no_account: 'ليس لديك حساب؟',
    have_account: 'لديك حساب بالفعل؟',

    // Home
    todays_verse: 'آية اليوم',
    continue_journey: 'تابع رحلتك',
    for_you: 'مخصص لك',
    weekly_streak: 'سلسلة الأسبوع',

    // Devotional
    todays_devotional: 'تأمل اليوم',
    reflection: 'تأمل',
    prayer: 'صلاة',
    start_prayer: 'ابدأ الصلاة',
    save: 'حفظ',
    saved: 'تم الحفظ',
    share: 'مشاركة',

    // Prayer
    guided_prayer: 'صلاة موجهة',
    find_peace: 'اعثر على سلامك',
    amen: 'آمين.',
    prayer_complete: 'قلبك مسموع. ليحرس السلام عقلك اليوم.',
    done: 'تم',

    // Chat
    ask_question: 'اطرح سؤالاً عن الكتاب المقدس...',
    ai_thinking: 'جارٍ التفكير...',
    chat_limit_reached: 'تم الوصول إلى الحد اليومي للمحادثات',
    upgrade_premium: 'قم بالترقية إلى بريميوم لمحادثات غير محدودة',

    // Search
    search_verses: 'البحث في آيات الكتاب المقدس',
    search_placeholder: 'ابحث عن آيات (مثال: محبة، إيمان، يوحنا)',
    no_results: 'لم يتم العثور على نتائج',
    try_different: 'جرّب كلمة بحث مختلفة',
    results: 'نتائج',

    // Profile
    settings: 'الإعدادات',
    dark_mode: 'الوضع الداكن',
    notifications: 'الإشعارات',
    daily_reminder: 'التذكير اليومي',
    language: 'اللغة',
    sign_out: 'تسجيل الخروج',
    clear_chat: 'مسح سجل المحادثات',
    saved_verses: 'الآيات المحفوظة',

    // Premium
    premium: 'بريميوم',
    deepen_journey: 'عمّق رحلتك الروحية',
    monthly: 'شهري',
    yearly: 'سنوي',
    start_trial: 'ابدأ تجربة مجانية لمدة ٧ أيام',
    cancel_anytime: 'إلغاء في أي وقت. يتجدد تلقائياً.',

    // Reading Plans
    reading_plans: 'خطط القراءة',
    day_of: 'اليوم %d من %d',
    start_plan: 'ابدأ الخطة',
    continue_reading: 'تابع القراءة',
    plan_completed: 'اكتملت الخطة!',

    // Verse Notes
    add_note: 'إضافة ملاحظة',
    edit_note: 'تعديل الملاحظة',
    my_notes: 'ملاحظاتي',
    highlight: 'تمييز',

    // Streak
    current_streak: 'السلسلة الحالية',
    days: 'أيام',
    best_streak: 'أفضل سلسلة',
  },
};

let currentLanguage: Language = 'en';

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function isRTL(): boolean {
  return currentLanguage === 'ar';
}

export function t(key: string, ...args: (string | number)[]): string {
  let value = translations[currentLanguage][key] ?? translations['en'][key] ?? key;

  let argIndex = 0;
  value = value.replace(/%[ds]/g, (match) => {
    if (argIndex < args.length) {
      return String(args[argIndex++]);
    }
    return match;
  });

  return value;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 11) {
    return t('good_morning');
  } else if (hour >= 12 && hour <= 16) {
    return t('good_afternoon');
  } else {
    return t('good_evening');
  }
}
