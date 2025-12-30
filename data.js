// ==========================================
// GAMIFY - Data Configuration
// ==========================================

const QUESTS = [
    {
        id: 'salah',
        name: 'Daily Salah',
        icon: '🕌',
        category: 'spiritual',
        description: '5 dnevnih namaza',
        identity: 'Ti si osoba koja klanja 5 puta dnevno',
        subtasks: [
            { id: 'fajr', name: 'Fajr', xp: 15 },
            { id: 'dhuhr', name: 'Dhuhr', xp: 10 },
            { id: 'asr', name: 'Asr', xp: 10 },
            { id: 'maghrib', name: 'Maghrib', xp: 10 },
            { id: 'isha', name: 'Isha', xp: 15 }
        ],
        twoMinuteRule: 'Ustani i uzmi abdest',
        color: '#10b981',
        duration: 75 // Total daily time approx
    },
    {
        id: 'tradermath',
        name: 'TraderMath Grind',
        icon: '📊',
        category: 'career',
        description: 'Quant interview prep',
        identity: 'Ti si budući quant trader',
        subtasks: [
            { id: 'tm-problems', name: 'Complete 3 problems', xp: 40 }
        ],
        twoMinuteRule: 'Otvori TraderMath i pročitaj 1 problem',
        habitStack: 'Nakon Fajr namaza',
        color: '#f59e0b',
        duration: 20 // 20 mins
    },
    {
        id: 'ml',
        name: 'ML Journey',
        icon: '🤖',
        category: 'learning',
        description: 'Machine Learning učenje',
        identity: 'Ti si ML engineer u nastajanju',
        subtasks: [
            { id: 'ml-study', name: 'Study session (30min)', xp: 35 }
        ],
        twoMinuteRule: 'Otvori kurs i pročitaj intro',
        color: '#8b5cf6',
        duration: 45 // 45 mins
    },
    {
        id: 'internship',
        name: 'Internship Hunt',
        icon: '💼',
        category: 'career',
        description: 'Prijave za internshipe',
        identity: 'Ti si proaktivan job seeker',
        subtasks: [
            { id: 'int-apply', name: 'Apply to 1 company', xp: 50 }
        ],
        twoMinuteRule: 'Otvori LinkedIn i pronađi 1 poziciju',
        color: '#06b6d4',
        duration: 30 // 30 mins
    },
    {
        id: 'master',
        name: 'Master Application',
        icon: '🎓',
        category: 'career',
        description: 'Prijave za master program',
        identity: 'Ti si budući master student',
        subtasks: [
            { id: 'master-work', name: 'Work on application', xp: 45 }
        ],
        twoMinuteRule: 'Otvori dokument i napiši 1 rečenicu',
        color: '#ec4899',
        duration: 45 // 45 mins
    },
    {
        id: 'job',
        name: 'Current Job',
        icon: '👨‍💻',
        category: 'work',
        description: 'Radni zadaci',
        identity: 'Ti si pouzdan i produktivan radnik',
        subtasks: [
            { id: 'job-tasks', name: 'Complete daily tasks', xp: 40 }
        ],
        twoMinuteRule: 'Otvori Slack/Email i provjeri inbox',
        color: '#3b82f6',
        duration: 240 // 4 hours
    }
];

const LEVELS = [
    { level: 1, title: 'Novice', xpRequired: 0, icon: '🌱' },
    { level: 2, title: 'Apprentice', xpRequired: 100, icon: '🌿' },
    { level: 3, title: 'Warrior', xpRequired: 250, icon: '⚔️' },
    { level: 4, title: 'Knight', xpRequired: 500, icon: '🛡️' },
    { level: 5, title: 'Champion', xpRequired: 800, icon: '🏆' },
    { level: 6, title: 'Master', xpRequired: 1200, icon: '👑' },
    { level: 7, title: 'Grandmaster', xpRequired: 1800, icon: '💎' },
    { level: 8, title: 'Legend', xpRequired: 2500, icon: '🌟' },
    { level: 9, title: 'Mythic', xpRequired: 3500, icon: '🔥' },
    { level: 10, title: 'Transcendent', xpRequired: 5000, icon: '✨' }
];

const ACHIEVEMENTS = [
    { id: 'first-blood', name: 'First Blood', description: 'Završi prvi task', icon: '🩸', condition: 'totalCompleted >= 1' },
    { id: 'early-bird', name: 'Early Bird', description: 'Završi task prije 7h', icon: '🐦', condition: 'earlyBird' },
    { id: 'streak-3', name: 'Streak Starter', description: '3 dana streak', icon: '🔥', condition: 'streak >= 3' },
    { id: 'streak-7', name: 'Week Warrior', description: '7 dana streak', icon: '⚡', condition: 'streak >= 7' },
    { id: 'streak-30', name: 'Monthly Master', description: '30 dana streak', icon: '🌙', condition: 'streak >= 30' },
    { id: 'level-5', name: 'Rising Star', description: 'Dosegni Level 5', icon: '⭐', condition: 'level >= 5' },
    { id: 'level-10', name: 'Transcendence', description: 'Dosegni Level 10', icon: '🌌', condition: 'level >= 10' },
    { id: 'salah-master', name: 'Devoted', description: 'Klanjaj svih 5 namaza 7 dana', icon: '🕌', condition: 'salahStreak >= 7' },
    { id: 'productive-day', name: 'Productive Day', description: 'Završi sve dnevne taskove', icon: '💪', condition: 'allDaily' },
    { id: 'night-owl', name: 'Night Owl', description: 'Završi task nakon 23h', icon: '🦉', condition: 'nightOwl' },
    { id: 'consistency', name: 'Atomic', description: '1% bolje 14 dana zaredom', icon: '⚛️', condition: 'streak >= 14' },
    { id: 'xp-1000', name: 'XP Hunter', description: 'Sakupi 1000 XP', icon: '💰', condition: 'totalXP >= 1000' }
];

const MOTIVATIONAL_QUOTES = [
    "Svaki put kad završiš task, glasaš za osobu koju želiš postati.",
    "Nisi ti osoba koja prokrastinira. Ti si osoba koja djeluje.",
    "1% bolje svaki dan = 37x bolje za godinu dana.",
    "Motivacija te pokrene. Navika te drži.",
    "Profesionalci se drže rasporeda. Amateri čekaju inspiraciju.",
    "Ne moraš biti sjajan da počneš, ali moraš početi da budeš sjajan.",
    "Tvoja budućnost ovisi o onome što radiš danas.",
    "Discipline is choosing between what you want now and what you want most.",
    "The pain of discipline weighs ounces. The pain of regret weighs tons.",
    "You don't rise to the level of your goals. You fall to the level of your systems."
];

const BAD_HABITS = [
    { id: 'social-media', name: 'Mindless Scrolling', icon: '📱', xpPenalty: -30, hpPenalty: -10, description: 'TikTok/Insta/Reels > 15min' },
    { id: 'procrastination', name: 'Procrastination', icon: 'zzz', xpPenalty: -20, hpPenalty: -5, description: 'Odgađanje posla' },
    { id: 'junk-food', name: 'Junk Food', icon: '🍔', xpPenalty: -40, hpPenalty: -15, description: 'Slatkiši ili brza hrana' },
    { id: 'missed-salah', name: 'Missed Salah', icon: '🕌', xpPenalty: -100, hpPenalty: -25, description: 'Propušten namaz namjerno' }
];

const STREAK_MULTIPLIERS = {
    0: 1.0,
    3: 1.25,
    7: 1.5,
    14: 1.75,
    30: 2.0,
    60: 2.5,
    90: 3.0
};
