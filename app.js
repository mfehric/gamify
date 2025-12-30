// ==========================================
// GAMIFY - Main Application Logic
// ==========================================

class GamifyApp {
    constructor() {
        this.state = this.loadState();
        this.init();
    }

    // Default state structure
    getDefaultState() {
        return {
            player: {
                name: 'Player',
                level: 1,
                xp: 0,
                hp: 100,
                maxHp: 100,
                totalXP: 0,
                streak: 0,
                lastActiveDate: null,
                createdAt: new Date().toISOString()
            },
            tasks: this.initializeTasks(),
            completedToday: [],
            achievements: [],
            history: [],
            settings: {
                soundEnabled: true,
                notificationsEnabled: true
            }
        };
    }

    // Initialize tasks from QUESTS data
    initializeTasks() {
        const tasks = {};
        QUESTS.forEach(quest => {
            tasks[quest.id] = {
                ...quest,
                subtaskStatus: {}
            };
            quest.subtasks.forEach(st => {
                tasks[quest.id].subtaskStatus[st.id] = false;
            });
        });
        return tasks;
    }

    // Load state from localStorage
    loadState() {
        const saved = localStorage.getItem('gamify_state');
        if (saved) {
            const parsed = JSON.parse(saved);

            // Ensure HP exists for old saves
            if (typeof parsed.player.hp === 'undefined') {
                parsed.player.hp = 100;
                parsed.player.maxHp = 100;
            }

            // Check if it's a new day - reset daily tasks
            const today = this.getDateString();
            if (parsed.player.lastActiveDate !== today && parsed.player.lastActiveDate) {
                // PENALTY CHECK FOR PREVIOUS DAY
                // If critical tasks (like Salah) were not done, apply damage
                this.checkMissedDailyPenalties(parsed);

                parsed.completedToday = [];
                // Reset subtask status for today
                Object.keys(parsed.tasks).forEach(taskId => {
                    Object.keys(parsed.tasks[taskId].subtaskStatus).forEach(stId => {
                        parsed.tasks[taskId].subtaskStatus[stId] = false;
                    });
                });
                // Update streak
                const yesterday = this.getDateString(new Date(Date.now() - 86400000));
                if (parsed.player.lastActiveDate === yesterday) {
                    // Continue streak
                } else if (parsed.player.lastActiveDate) {
                    // Streak broken
                    parsed.player.streak = 0;
                }
            }
            return parsed;
        }
        return this.getDefaultState();
    }

    // Save state to localStorage
    saveState() {
        localStorage.setItem('gamify_state', JSON.stringify(this.state));
    }

    // Get date string (YYYY-MM-DD)
    getDateString(date = new Date()) {
        return date.toISOString().split('T')[0];
    }

    // Initialize the app
    init() {
        this.renderHeader();
        this.renderStats();
        this.renderQuests();
        this.renderBadHabits(); // Render Bad Habits
        this.renderSidebar();
        this.updateStreakIfNeeded();
        this.showDailyQuote();
        this.checkTimeBasedGreeting();
    }

    // Calculate current level from XP
    calculateLevel(xp) {
        let currentLevel = LEVELS[0];
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (xp >= LEVELS[i].xpRequired) {
                currentLevel = LEVELS[i];
                break;
            }
        }
        return currentLevel;
    }

    // Get XP needed for next level
    getXPForNextLevel() {
        const currentLevelIndex = LEVELS.findIndex(l => l.level === this.state.player.level);
        if (currentLevelIndex < LEVELS.length - 1) {
            return LEVELS[currentLevelIndex + 1].xpRequired;
        }
        return LEVELS[LEVELS.length - 1].xpRequired;
    }

    // Get current level XP threshold
    getCurrentLevelXP() {
        const level = LEVELS.find(l => l.level === this.state.player.level);
        return level ? level.xpRequired : 0;
    }

    // Get streak multiplier
    getStreakMultiplier() {
        const streak = this.state.player.streak;
        let multiplier = 1.0;
        Object.entries(STREAK_MULTIPLIERS).forEach(([days, mult]) => {
            if (streak >= parseInt(days)) {
                multiplier = mult;
            }
        });
        return multiplier;
    }

    // Render header with level and XP bar
    renderHeader() {
        const levelData = this.calculateLevel(this.state.player.totalXP);
        const currentLevelXP = this.getCurrentLevelXP();
        const nextLevelXP = this.getXPForNextLevel();
        const progressXP = this.state.player.totalXP - currentLevelXP;
        const neededXP = nextLevelXP - currentLevelXP;
        const progress = Math.min((progressXP / neededXP) * 100, 100);

        document.getElementById('level-icon').textContent = levelData.icon;
        document.getElementById('level-number').textContent = `Level ${levelData.level}`;
        document.getElementById('level-title').textContent = levelData.title;
        document.getElementById('xp-current').textContent = this.state.player.totalXP;
        document.getElementById('xp-next').textContent = nextLevelXP;
        document.getElementById('xp-fill').style.width = `${progress}%`;
    }

    // Render stats row
    renderStats() {
        const today = this.getDateString();
        const completedToday = this.state.completedToday.length;
        const totalTasks = Object.values(this.state.tasks).reduce((acc, task) => acc + task.subtasks.length, 0);

        document.getElementById('streak-value').textContent = this.state.player.streak;
        document.getElementById('today-completed').textContent = completedToday;
        document.getElementById('today-total').textContent = totalTasks;
        document.getElementById('multiplier-value').textContent = `${this.getStreakMultiplier()}x`;
        document.getElementById('total-xp-value').textContent = this.state.player.totalXP;

        // Update HP
        document.getElementById('hp-current').textContent = Math.round(this.state.player.hp);
        document.getElementById('hp-max').textContent = this.state.player.maxHp || 100;
        document.getElementById('hp-fill').style.width = `${(this.state.player.hp / (this.state.player.maxHp || 100)) * 100}%`;
    }

    // Render quest cards
    renderQuests() {
        const questList = document.getElementById('quest-list');
        questList.innerHTML = '';

        QUESTS.forEach(quest => {
            const taskState = this.state.tasks[quest.id];
            const completedCount = Object.values(taskState.subtaskStatus).filter(Boolean).length;
            const totalSubtasks = quest.subtasks.length;
            const isComplete = completedCount === totalSubtasks;

            const card = document.createElement('div');
            card.className = `quest-card ${isComplete ? 'completed' : ''}`;
            card.style.setProperty('--quest-color', quest.color);

            const totalXP = quest.subtasks.reduce((acc, st) => acc + st.xp, 0);
            const earnedXP = quest.subtasks.reduce((acc, st) =>
                acc + (taskState.subtaskStatus[st.id] ? st.xp : 0), 0);

            card.innerHTML = `
                <div class="quest-header">
                    <div class="quest-info">
                        <div class="quest-icon">${quest.icon}</div>
                        <div class="quest-details">
                            <h3>${quest.name}</h3>
                            <p>${quest.description}</p>
                        </div>
                    </div>
                    <div class="quest-xp">+${totalXP} XP</div>
                </div>
                <div class="subtasks" id="subtasks-${quest.id}">
                    ${quest.subtasks.map(st => `
                        <div class="subtask ${taskState.subtaskStatus[st.id] ? 'completed' : ''}" 
                             data-quest="${quest.id}" 
                             data-subtask="${st.id}"
                             onclick="app.toggleSubtask('${quest.id}', '${st.id}')">
                            <div class="subtask-checkbox"></div>
                            <span>${st.name}</span>
                            <span class="subtask-xp" style="color: var(--xp-gold); font-size: 0.75rem;">+${st.xp}</span>
                        </div>
                    `).join('')}
                </div>
                ${!isComplete && quest.twoMinuteRule ? `
                    <div class="two-min-hint">
                        <span>⏱️</span>
                        <span>2-min start: ${quest.twoMinuteRule}</span>
                    </div>
                ` : ''}
                ${quest.habitStack ? `
                    <div class="two-min-hint" style="background: rgba(168, 85, 247, 0.1); color: var(--accent-secondary);">
                        <span>🔗</span>
                        <span>Habit Stack: ${quest.habitStack}</span>
                    </div>
                ` : ''}
            `;

            questList.appendChild(card);
        });
    }

    // Toggle subtask completion
    toggleSubtask(questId, subtaskId) {
        const task = this.state.tasks[questId];
        const wasCompleted = task.subtaskStatus[subtaskId];
        task.subtaskStatus[subtaskId] = !wasCompleted;

        const quest = QUESTS.find(q => q.id === questId);
        const subtask = quest.subtasks.find(st => st.id === subtaskId);

        if (!wasCompleted) {
            // Task completed - award XP
            const multiplier = this.getStreakMultiplier();
            const xpEarned = Math.round(subtask.xp * multiplier);
            this.state.player.xp += xpEarned;
            this.state.player.totalXP += xpEarned;
            this.state.completedToday.push(`${questId}-${subtaskId}`);

            // Check for level up
            const newLevel = this.calculateLevel(this.state.player.totalXP);
            if (newLevel.level > this.state.player.level) {
                this.state.player.level = newLevel.level;
                this.showLevelUpModal(newLevel);
            }

            // Show XP toast
            this.showToast('xp', `+${xpEarned} XP`, multiplier > 1 ? `${multiplier}x streak bonus!` : subtask.name);

            // Confetti for task completion
            this.spawnConfetti();

            // Update last active date
            this.state.player.lastActiveDate = this.getDateString();

            // Check achievements
            this.checkAchievements();

            // Show identity message occasionally
            if (Math.random() > 0.7) {
                setTimeout(() => {
                    this.showToast('achievement', '🪞 Identity', quest.identity);
                }, 1500);
            }
        } else {
            // Task uncompleted - remove XP
            const xpToRemove = subtask.xp;
            this.state.player.xp = Math.max(0, this.state.player.xp - xpToRemove);
            this.state.player.totalXP = Math.max(0, this.state.player.totalXP - xpToRemove);
            const idx = this.state.completedToday.indexOf(`${questId}-${subtaskId}`);
            if (idx > -1) this.state.completedToday.splice(idx, 1);
        }

        this.saveState();
        this.renderHeader();
        this.renderStats();
        this.renderQuests();
        this.updateIdentityCard();
    }

    // Check and unlock achievements
    checkAchievements() {
        const player = this.state.player;
        const completedCount = this.state.completedToday.length;

        ACHIEVEMENTS.forEach(ach => {
            if (this.state.achievements.includes(ach.id)) return;

            let unlocked = false;

            switch (ach.id) {
                case 'first-blood':
                    unlocked = player.totalXP > 0;
                    break;
                case 'streak-3':
                    unlocked = player.streak >= 3;
                    break;
                case 'streak-7':
                    unlocked = player.streak >= 7;
                    break;
                case 'streak-30':
                    unlocked = player.streak >= 30;
                    break;
                case 'level-5':
                    unlocked = player.level >= 5;
                    break;
                case 'level-10':
                    unlocked = player.level >= 10;
                    break;
                case 'xp-1000':
                    unlocked = player.totalXP >= 1000;
                    break;
                case 'early-bird':
                    unlocked = new Date().getHours() < 7;
                    break;
                case 'night-owl':
                    unlocked = new Date().getHours() >= 23;
                    break;
                case 'productive-day':
                    const totalSubtasks = Object.values(this.state.tasks).reduce((acc, task) =>
                        acc + task.subtasks.length, 0);
                    unlocked = completedCount >= totalSubtasks;
                    break;
                case 'consistency':
                    unlocked = player.streak >= 14;
                    break;
            }

            if (unlocked) {
                this.state.achievements.push(ach.id);
                this.showToast('achievement', ach.name, ach.description);
                this.spawnConfetti();
                this.saveState();
                this.renderAchievements();
            }
        });
    }

    // Render sidebar
    renderSidebar() {
        this.updateIdentityCard();
        this.renderAchievements();
        this.renderCompoundProgress();
    }

    // Update identity card based on completed tasks
    updateIdentityCard() {
        const identityEl = document.getElementById('identity-statement');
        const completedQuests = QUESTS.filter(quest => {
            const taskState = this.state.tasks[quest.id];
            return Object.values(taskState.subtaskStatus).some(Boolean);
        });

        if (completedQuests.length > 0) {
            const randomQuest = completedQuests[Math.floor(Math.random() * completedQuests.length)];
            identityEl.innerHTML = `<em>${randomQuest.identity}</em>`;
        } else {
            identityEl.innerHTML = 'Završi task i postani osoba koju želiš biti!';
        }
    }

    // Render achievements grid
    renderAchievements() {
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';

        ACHIEVEMENTS.forEach(ach => {
            const isUnlocked = this.state.achievements.includes(ach.id);
            const div = document.createElement('div');
            div.className = `achievement ${isUnlocked ? 'unlocked' : 'locked'}`;
            div.innerHTML = `
                <span>${ach.icon}</span>
                <div class="achievement-tooltip">${ach.name}<br><small>${ach.description}</small></div>
            `;
            grid.appendChild(div);
        });
    }

    // Render compound progress (1% daily improvement)
    renderCompoundProgress() {
        const streak = this.state.player.streak;
        const compound = Math.pow(1.01, streak).toFixed(2);
        document.getElementById('compound-value').textContent = `${compound}x`;
        document.getElementById('compound-days').textContent = `${streak} dana konzistentnosti`;
    }

    // Update streak
    updateStreakIfNeeded() {
        const today = this.getDateString();
        const yesterday = this.getDateString(new Date(Date.now() - 86400000));

        if (this.state.completedToday.length > 0) {
            if (this.state.player.lastActiveDate !== today) {
                if (this.state.player.lastActiveDate === yesterday) {
                    this.state.player.streak++;
                } else if (this.state.player.lastActiveDate !== today) {
                    this.state.player.streak = 1;
                }
                this.state.player.lastActiveDate = today;
                this.saveState();
            }
        }
    }

    // Show daily motivational quote
    showDailyQuote() {
        const quoteEl = document.getElementById('quote-text');
        const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
        quoteEl.textContent = `"${randomQuote}"`;
    }

    // Time-based greeting
    checkTimeBasedGreeting() {
        const hour = new Date().getHours();
        let greeting = '';

        if (hour >= 4 && hour < 12) {
            greeting = 'Dobro jutro! 🌅 Vrijeme za Fajr i produktivan dan.';
        } else if (hour >= 12 && hour < 17) {
            greeting = 'Dobar dan! ☀️ Nastavi graditi navike.';
        } else if (hour >= 17 && hour < 21) {
            greeting = 'Dobra večer! 🌆 Završi dnevne zadatke.';
        } else {
            greeting = 'Kasno je! 🌙 Ne zaboravi Isha namaz.';
        }

        // Show greeting toast
        setTimeout(() => {
            this.showToast('info', '👋', greeting);
        }, 1000);
    }

    // Show toast notification
    showToast(type, title, message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            'xp': '✨',
            'achievement': '🏆',
            'level-up': '🎉',
            'info': '💡'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || '📣'}</div>
            <div class="toast-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
        `;

        container.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'toast-in 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Show level up modal
    showLevelUpModal(levelData) {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('modal-icon').textContent = levelData.icon;
        document.getElementById('modal-title').textContent = 'LEVEL UP!';
        document.getElementById('modal-text').textContent =
            `Čestitamo! Dosegao si Level ${levelData.level}: ${levelData.title}`;

        overlay.classList.add('active');
        this.spawnConfetti();
    }

    // Close modal
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }

    // Spawn confetti celebration
    spawnConfetti() {
        const colors = ['#7c3aed', '#a855f7', '#fbbf24', '#10b981', '#06b6d4', '#ec4899'];

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 5000);
            }, i * 30);
        }
    }

    // ==========================================
    // BAD HABITS & HP SYSTEM
    // ==========================================

    // Check missed penalties from previous day
    checkMissedDailyPenalties(parsedState) {
        // Critical quests that MUST be done
        const criticalQuests = ['salah', 'trader-math'];
        let penaltyApplied = false;

        criticalQuests.forEach(questId => {
            const quest = parsedState.tasks[questId];
            if (quest && !parsedState.completedToday.includes(questId)) {
                // Apply penalty directly to the state object
                parsedState.player.hp = Math.max(0, parsedState.player.hp - 10);
                penaltyApplied = true;
            }
        });

        if (penaltyApplied) {
            // Can't show toast here as app is not fully init, but we save the state
            console.log('Daily penalty applied');
        }
    }

    // Render Bad Habits
    renderBadHabits() {
        const container = document.getElementById('bad-habits-list');
        if (!container) return; // Guard clause if element doesn't exist

        container.innerHTML = '';

        BAD_HABITS.forEach(habit => {
            const card = document.createElement('div');
            card.className = 'quest-card anti-quest';
            card.innerHTML = `
                <div class="quest-item">
                    <div class="quest-icon anti-icon">${habit.icon}</div>
                    <div class="quest-content">
                        <h3 class="quest-title">${habit.name}</h3>
                        <div class="quest-desc">${habit.description}</div>
                        <div class="penalty-text">
                            ⚠️ Penalty: ${habit.xpPenalty} XP / ${habit.hpPenalty} HP
                        </div>
                    </div>
                </div>
                <button class="btn-slip-up" onclick="app.handleBadHabit('${habit.id}')">
                    <span>💀</span> I Slipped Up
                </button>
            `;
            container.appendChild(card);
        });
    }

    // Handle Bad Habit "Slip Up"
    handleBadHabit(habitId) {
        const habit = BAD_HABITS.find(h => h.id === habitId);
        if (!habit) return;

        // Apply penalties
        this.addXP(habit.xpPenalty); // Negative XP
        this.updateHP(habit.hpPenalty);

        // Visual feedback
        this.triggerScreenShake();
        this.showToast('level-up', '❌ Bad Habit!', `Lost ${Math.abs(habit.xpPenalty)} XP and ${Math.abs(habit.hpPenalty)} HP`);

        // Play sound if enabled
        if (this.state.settings.soundEnabled) {
            // Could add specific fail sound here
        }
    }

    // Update HP
    updateHP(amount) {
        this.state.player.hp = Math.min(this.state.player.maxHp, Math.max(0, this.state.player.hp + amount));

        // Check for death
        if (this.state.player.hp <= 0) {
            this.handleDeath();
        }

        this.saveState();
        this.renderStats();
    }

    // Handle Player Death (0 HP)
    handleDeath() {
        this.state.player.level = Math.max(1, this.state.player.level - 1);
        this.state.player.hp = 100; // Reset HP
        this.state.player.xp = 0; // Reset current XP

        this.showToast('level-down', '☠️ WASTED', 'You died! Level lost. HP restored.');
        this.triggerScreenShake();
    }

    // Visual effect for damage
    triggerScreenShake() {
        document.body.classList.add('screen-shake');
        const overlay = document.createElement('div');
        overlay.className = 'damage-overlay active';
        document.body.appendChild(overlay);

        setTimeout(() => {
            document.body.classList.remove('screen-shake');
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        }, 500);
    }

    // Reset today's progress (for testing)
    resetToday() {
        this.state.completedToday = [];
        Object.keys(this.state.tasks).forEach(taskId => {
            Object.keys(this.state.tasks[taskId].subtaskStatus).forEach(stId => {
                this.state.tasks[taskId].subtaskStatus[stId] = false;
            });
        });
        this.saveState();
        this.init();
    }

    // ==========================================
    // SMART DAILY SCHEDULE
    // ==========================================

    generateDailySchedule() {
        const activeQuests = QUESTS.filter(quest => {
            const taskState = this.state.tasks[quest.id];
            // Only include quests that are NOT fully completed
            const completedCount = Object.values(taskState.subtaskStatus).filter(Boolean).length;
            return completedCount < quest.subtasks.length;
        });

        if (activeQuests.length === 0) {
            this.showToast('info', 'Sve završeno!', 'Nemaš taskova za planiranje danas.');
            return;
        }

        // Start time logic: Next :00 or :30
        let currentTime = new Date();
        let startMinutes = currentTime.getMinutes();
        let addMinutes = startMinutes >= 30 ? (60 - startMinutes) : (30 - startMinutes);
        currentTime.setMinutes(currentTime.getMinutes() + addMinutes); // Round up
        currentTime.setSeconds(0);

        const schedule = [];

        activeQuests.forEach((quest, index) => {
            // Calculate end time
            const startTimeStr = this.formatTime(currentTime);
            const duration = quest.duration || 30; // Default 30 min if missing

            // Add task to schedule
            schedule.push({
                type: 'task',
                time: startTimeStr,
                name: quest.name,
                icon: quest.icon,
                duration: duration,
                color: quest.color
            });

            // Advance time
            currentTime.setMinutes(currentTime.getMinutes() + duration);

            // Add break if needed (and not last item)
            if (index < activeQuests.length - 1 && duration >= 45) {
                const breakStart = this.formatTime(currentTime);
                const breakDuration = 10; // 10 min break

                schedule.push({
                    type: 'break',
                    time: breakStart,
                    name: 'Odmor za mozak',
                    icon: '☕',
                    duration: breakDuration,
                    color: '#10b981'
                });

                currentTime.setMinutes(currentTime.getMinutes() + breakDuration);
            }
        });

        this.renderDailySchedule(schedule);
    }

    renderDailySchedule(schedule) {
        const modal = document.getElementById('schedule-modal');
        const container = document.getElementById('schedule-timeline');

        container.innerHTML = schedule.map(item => `
            <div class="timeline-item ${item.type}">
                <div class="time-slot">${item.time}</div>
                <div class="timeline-marker" style="border-color: ${item.color}"></div>
                <div class="timeline-content" style="border-left: 3px solid ${item.color}">
                    <div class="timeline-title">
                        <span>${item.icon}</span> ${item.name}
                    </div>
                    <div class="timeline-desc">
                        Trajanje: ${item.duration} min
                    </div>
                </div>
            </div>
        `).join('');

        modal.classList.add('active');
    }

    closeScheduleModal() {
        document.getElementById('schedule-modal').classList.remove('active');
    }

    formatTime(date) {
        return date.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
    }

    // ==========================================
    // GAME LOOP & UTILS
    // ==========================================

    // Full reset (for testing)
    fullReset() {
        localStorage.removeItem('gamify_state');
        this.state = this.getDefaultState();
        this.saveState();
        this.init();
    }

    // ==========================================
    // CUSTOM QUEST CREATION
    // ==========================================

    // Open Add Quest Modal
    openAddQuestModal() {
        document.getElementById('add-quest-modal').classList.add('active');
        document.getElementById('quest-name').value = '';
        document.getElementById('quest-description').value = '';
        document.getElementById('subtask-inputs').innerHTML = `
            <div class="subtask-input-row">
                <input type="text" class="subtask-input" placeholder="npr. Predavanje iz Matematike">
                <button type="button" class="btn-icon remove-subtask" onclick="app.removeSubtaskInput(this)">✕</button>
            </div>
        `;
        document.getElementById('preview-content').innerHTML = 'Unesi naziv questa da vidiš preview...';

        // Add event listener for live preview
        const nameInput = document.getElementById('quest-name');
        nameInput.addEventListener('input', () => this.updateQuestPreview());
    }

    // Close Add Quest Modal
    closeAddQuestModal() {
        document.getElementById('add-quest-modal').classList.remove('active');
    }

    // Add subtask input field
    addSubtaskInput() {
        const container = document.getElementById('subtask-inputs');
        const newRow = document.createElement('div');
        newRow.className = 'subtask-input-row';
        newRow.innerHTML = `
            <input type="text" class="subtask-input" placeholder="npr. Zadaća, Vježbe...">
            <button type="button" class="btn-icon remove-subtask" onclick="app.removeSubtaskInput(this)">✕</button>
        `;
        container.appendChild(newRow);
    }

    // Remove subtask input field
    removeSubtaskInput(button) {
        const row = button.parentElement;
        const container = document.getElementById('subtask-inputs');
        if (container.children.length > 1) {
            row.remove();
        }
    }

    // Smart Quest Generator - generates properties based on keywords
    generateQuestProperties(name) {
        const nameLower = name.toLowerCase();

        // Keyword mappings for different categories
        const categories = {
            education: {
                keywords: ['faks', 'fakultet', 'učenje', 'studij', 'ispit', 'kolokvij', 'predavanje', 'škola', 'kurs', 'course', 'tutorial', 'learn', 'study'],
                icons: ['📚', '🎓', '📖', '✏️', '🧠'],
                colors: ['#8b5cf6', '#a855f7', '#7c3aed'],
                identities: [
                    'Ti si disciplinirani student',
                    'Ti si osoba koja stalno uči i napreduje',
                    'Ti si budući stručnjak u svom polju'
                ],
                twoMinRules: [
                    'Otvori skriptu i pročitaj jednu stranicu',
                    'Otvori materijale i pregledaj naslove',
                    'Sjedi za stol i otvori bilježnicu'
                ],
                duration: 60
            },
            fitness: {
                keywords: ['teretana', 'gym', 'vježba', 'trening', 'sport', 'trčanje', 'run', 'workout', 'fitness', 'zdravlje'],
                icons: ['💪', '🏋️', '🏃', '🧘', '🚴'],
                colors: ['#ef4444', '#f97316', '#dc2626'],
                identities: [
                    'Ti si osoba koja brine o svom tijelu',
                    'Ti si disciplinirani sportaš',
                    'Ti si zdrav i aktivan čovjek'
                ],
                twoMinRules: [
                    'Obuci sportsku odjeću',
                    'Napravi 5 čučnjeva',
                    'Izađi van i prošetaj 2 minute'
                ],
                duration: 90
            },
            career: {
                keywords: ['posao', 'karijera', 'career', 'job', 'work', 'projekt', 'zadatak', 'meeting', 'internship', 'prijava'],
                icons: ['💼', '👔', '📊', '💻', '📈'],
                colors: ['#3b82f6', '#0ea5e9', '#2563eb'],
                identities: [
                    'Ti si pouzdan profesionalac',
                    'Ti si ambiciozan i produktivan',
                    'Ti si osoba koja gradi svoju karijeru'
                ],
                twoMinRules: [
                    'Otvori laptop i provjeri email',
                    'Napravi listu prioriteta za danas',
                    'Pošalji jednu poruku ili email'
                ],
                duration: 60
            },
            spiritual: {
                keywords: ['namaz', 'salah', 'dova', 'quran', 'kuran', 'ibadet', 'meditacija', 'molitva', 'duhovno'],
                icons: ['🕌', '🤲', '📿', '🌙', '⭐'],
                colors: ['#10b981', '#059669', '#047857'],
                identities: [
                    'Ti si osoba koja brine o svojoj duhovnosti',
                    'Ti si dosljedan u svojim ibadetima',
                    'Ti si čovjek jake vjere'
                ],
                twoMinRules: [
                    'Uzmi abdest',
                    'Prouči jednu dovu',
                    'Sjedni i razmisli o zahvalnosti'
                ],
                duration: 15
            },
            reading: {
                keywords: ['čitanje', 'knjiga', 'read', 'book', 'literatura', 'roman', 'lektira'],
                icons: ['📚', '📖', '📕', '📗', '📘'],
                colors: ['#f59e0b', '#d97706', '#b45309'],
                identities: [
                    'Ti si osoba koja čita svaki dan',
                    'Ti si intelektualac u nastajanju',
                    'Ti si čovjek široke kulture'
                ],
                twoMinRules: [
                    'Uzmi knjigu i pročitaj jednu stranicu',
                    'Otvori e-reader',
                    'Sjedni u udoban kutak s knjigom'
                ],
                duration: 30
            },
            creative: {
                keywords: ['pisanje', 'crtanje', 'dizajn', 'kreativ', 'art', 'muzika', 'glazba', 'fotografija'],
                icons: ['🎨', '✍️', '🎵', '📷', '🎭'],
                colors: ['#ec4899', '#db2777', '#be185d'],
                identities: [
                    'Ti si kreativna duša',
                    'Ti si umjetnik koji stvara svaki dan',
                    'Ti si osoba puna kreativne energije'
                ],
                twoMinRules: [
                    'Uzmi olovku i nacrtaj jednu liniju',
                    'Otvori program i napravi novi dokument',
                    'Pusti omiljenu inspirativnu pjesmu'
                ],
                duration: 60
            },
            social: {
                keywords: ['porodica', 'obitelj', 'prijatelj', 'druženje', 'family', 'friend', 'social', 'poziv'],
                icons: ['👨‍👩‍👧', '🤝', '💬', '☎️', '❤️'],
                colors: ['#06b6d4', '#0891b2', '#0e7490'],
                identities: [
                    'Ti si osoba koja cijeni odnose',
                    'Ti si dobar prijatelj i član porodice',
                    'Ti si čovjek koji njeguje veze s drugima'
                ],
                twoMinRules: [
                    'Pošalji poruku jednoj bliskoj osobi',
                    'Nazovi nekog tko ti je drag',
                    'Planiraj jedno druženje'
                ],
                duration: 60
            },
            coding: {
                keywords: ['kod', 'code', 'coding', 'programming', 'programiranje', 'develop', 'software', 'web', 'app'],
                icons: ['💻', '⌨️', '🖥️', '👨‍💻', '🔧'],
                colors: ['#22c55e', '#16a34a', '#15803d'],
                identities: [
                    'Ti si developer u nastajanju',
                    'Ti si osoba koja gradi budućnost kroz kod',
                    'Ti si tech enthusiast'
                ],
                twoMinRules: [
                    'Otvori editor i napiši jednu liniju koda',
                    'Otvori dokumentaciju i pročitaj intro',
                    'Pokreni terminal i provjeri git status'
                ],
                duration: 90
            }
        };

        // Find matching category
        let matchedCategory = null;
        for (const [catName, catData] of Object.entries(categories)) {
            if (catData.keywords.some(kw => nameLower.includes(kw))) {
                matchedCategory = catData;
                break;
            }
        }

        // Default/fallback category
        if (!matchedCategory) {
            matchedCategory = {
                icons: ['📋', '✅', '📌', '🎯', '⭐'],
                colors: ['#7c3aed', '#8b5cf6', '#a855f7'],
                identities: [
                    `Ti si osoba koja radi na: ${name}`,
                    'Ti si disciplinirana osoba',
                    'Ti si čovjek koji drži svoje obećanje sebi'
                ],
                twoMinRules: [
                    'Otvori potrebne alate i počni',
                    'Napravi prvi mali korak',
                    'Sjedni i fokusiraj se 2 minute'
                ],
                duration: 30
            };
        }

        // Generate random selections
        const icon = matchedCategory.icons[Math.floor(Math.random() * matchedCategory.icons.length)];
        const color = matchedCategory.colors[Math.floor(Math.random() * matchedCategory.colors.length)];
        const identity = matchedCategory.identities[Math.floor(Math.random() * matchedCategory.identities.length)];
        const twoMinRule = matchedCategory.twoMinRules[Math.floor(Math.random() * matchedCategory.twoMinRules.length)];

        return { icon, color, identity, twoMinRule, duration: matchedCategory.duration };
    }

    // Update live preview
    updateQuestPreview() {
        const name = document.getElementById('quest-name').value.trim();
        const previewContent = document.getElementById('preview-content');

        if (!name) {
            previewContent.innerHTML = 'Unesi naziv questa da vidiš preview...';
            return;
        }

        const props = this.generateQuestProperties(name);

        previewContent.innerHTML = `
            <div class="preview-item">
                <span class="preview-icon">${props.icon}</span>
                <span class="preview-label">Ikona:</span>
                <span class="preview-value">${props.icon}</span>
            </div>
            <div class="preview-item">
                <span class="preview-icon">🎨</span>
                <span class="preview-label">Boja:</span>
                <span class="preview-value" style="color: ${props.color}">■ ${props.color}</span>
            </div>
            <div class="preview-item">
                <span class="preview-icon">🪞</span>
                <span class="preview-label">Identitet:</span>
                <span class="preview-value">"${props.identity}"</span>
            </div>
            <div class="preview-item">
                <span class="preview-icon">⏱️</span>
                <span class="preview-label">2-min start:</span>
                <span class="preview-value">"${props.twoMinRule}"</span>
            </div>
        `;
    }

    // Create new quest
    createQuest(event) {
        event.preventDefault();

        const name = document.getElementById('quest-name').value.trim();
        const description = document.getElementById('quest-description').value.trim() || `Dnevni zadaci za: ${name}`;

        // Get subtasks
        const subtaskInputs = document.querySelectorAll('.subtask-input');
        const subtasks = [];
        subtaskInputs.forEach((input, index) => {
            const value = input.value.trim();
            if (value) {
                subtasks.push({
                    id: `custom-${Date.now()}-${index}`,
                    name: value,
                    xp: 25 + Math.floor(Math.random() * 20) // Random XP between 25-45
                });
            }
        });

        // If no subtasks provided, create a default one
        if (subtasks.length === 0) {
            subtasks.push({
                id: `custom-${Date.now()}-0`,
                name: `Završi ${name}`,
                xp: 35
            });
        }

        // Generate smart properties
        const props = this.generateQuestProperties(name);

        // Create new quest object
        const newQuest = {
            id: `custom-${Date.now()}`,
            name: name,
            icon: props.icon,
            category: 'custom',
            description: description,
            identity: props.identity,
            subtasks: subtasks,
            twoMinuteRule: props.twoMinRule,
            color: props.color,
            isCustom: true,
            duration: props.duration
        };

        // Add to QUESTS array
        QUESTS.push(newQuest);

        // Add to state
        this.state.tasks[newQuest.id] = {
            ...newQuest,
            subtaskStatus: {}
        };
        subtasks.forEach(st => {
            this.state.tasks[newQuest.id].subtaskStatus[st.id] = false;
        });

        // Save custom quests to localStorage separately
        this.saveCustomQuests();
        this.saveState();

        // Re-render quests
        this.renderQuests();
        this.renderStats();

        // Close modal and show success
        this.closeAddQuestModal();
        this.showToast('achievement', '🆕 Novi Quest!', `"${name}" je dodan!`);
        this.spawnConfetti();
    }

    // Save custom quests to localStorage
    saveCustomQuests() {
        const customQuests = QUESTS.filter(q => q.isCustom);
        localStorage.setItem('gamify_custom_quests', JSON.stringify(customQuests));
    }

    // Load custom quests from localStorage
    loadCustomQuests() {
        const saved = localStorage.getItem('gamify_custom_quests');
        if (saved) {
            const customQuests = JSON.parse(saved);
            customQuests.forEach(quest => {
                if (!QUESTS.find(q => q.id === quest.id)) {
                    QUESTS.push(quest);
                }
            });
        }
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GamifyApp();
    // Load custom quests first
    app.loadCustomQuests();
    // Re-initialize to include custom quests
    app.state.tasks = { ...app.initializeTasks(), ...app.state.tasks };
    app.saveState();
    app.renderQuests();
    app.renderStats();
});

// Expose closeModal globally
function closeModal() {
    app.closeModal();
}
