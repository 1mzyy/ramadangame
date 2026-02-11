// ============================================
// RAMADAN LEGACY QUEST - SCRIPT.JS
// Family Game for Ramadan - All Devices
// WITH 1100 POINT GOAL, REMOTE DUA DICE & DAILY CHECK-INS
// ============================================

// ---------- GAME STATE ----------
let game_State = {
    familyCode: null,
    players: [],
    currentDay: 1,
    totalPoints: 0,
    logs: [],
    weeklyQuest: 1,
    darkMode: false,
    
    // 1100 Point Goal System
    familyGoal: 1100,
    goalProgress: 0,
    goalAchieved: false,
    treats: [],
    dailyContribution: {},
    
    // NEW: Daily Check-Ins (No Points)
    morningCheckIns: {}, // Track who checked in morning
    eveningCheckIns: {}, // Track who checked in evening
    reflections: [] // Store daily reflections
};

// ---------- CONSTANTS ----------
// UPDATED: Dua Dice prompts for families who don't live together
const DICE_PROMPTS = [
    "📱 Send a voice note or text to a family member you haven't spoken to today",
    "🤲 Make dua for a family member who is far away right now",
    "💭 Share one thing you miss about being together during Ramadan",
    "📸 Send a photo of your iftar/suhoor to the family group chat",
    "🎙️ Record yourself reciting a short surah and share it with the family",
    "🌍 Make dua for all the Muslims around the world fasting alone"
];

const WEEKLY_QUESTS = [
    "🌟 Week 1: Establish 5 family Ramadan traditions (even at a distance!)",
    "🤝 Week 2: Contact 3 relatives or old friends you haven't spoken to",
    "🕌 Week 3: Prepare for the last 10 nights - share your plans with each other",
    "🎉 Week 4: Plan a virtual Eid celebration together"
];

const CHARACTER_NAMES = {
    guardian: 'The Guardian',
    seeker: 'The Seeker',
    nourisher: 'The Nourisher',
    connector: 'The Connector',
    healer: 'The Healer',
    illuminator: 'The Illuminator'
};

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', function() {
    console.log("🌟 Ramadan Legacy Quest - Remote Family Edition!");
    
    // Load saved data from localStorage
    loadGame();
    
    // Set initial family code display
    updateFamilyDisplay();
    
    // Build moon tracker
    buildMoonTracker();
    
    // Update all displays
    updateDisplay();
    updateQuestDisplay();
    updateLogDisplay();
    
    // Update goal display
    updateGoalDisplay();
    
    // NEW: Update check-in displays
    updateCheckInDisplay();
    
    // Set theme based on saved state
    if (gameState.darkMode) {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }

    // ---------- EVENT LISTENERS ----------
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('joinFamilyBtn').addEventListener('click', joinFamily);
    document.getElementById('createFamilyBtn').addEventListener('click', createFamily);
    document.getElementById('joinGameBtn').addEventListener('click', joinGame);
    document.getElementById('submitDailyBtn').addEventListener('click', submitDaily);
    document.getElementById('spotDeedBtn').addEventListener('click', spotSecretDeed);
    document.getElementById('rollDiceBtn').addEventListener('click', rollDice);
    document.getElementById('completeQuestBtn').addEventListener('click', completeQuest);
    document.getElementById('shareGameBtn').addEventListener('click', shareGame);
    document.getElementById('resetDayBtn').addEventListener('click', resetDay);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('helpBtn').addEventListener('click', toggleHelp);
    
    // Treat System Listeners
    document.getElementById('addTreatBtn').addEventListener('click', addTreat);
    document.getElementById('claimRewardBtn').addEventListener('click', claimReward);
    
    // NEW: Check-In Listeners
    document.getElementById('morningCheckInBtn').addEventListener('click', morningCheckIn);
    document.getElementById('eveningCheckInBtn').addEventListener('click', eveningCheckIn);
    document.getElementById('saveReflectionBtn').addEventListener('click', saveReflection);
    
    // Keyboard shortcut: Enter to join game
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && document.getElementById('playerName') === document.activeElement) {
            joinGame();
        }
    });
});

// ---------- LOCAL STORAGE FUNCTIONS ----------
function saveGame() {
    localStorage.setItem('ramadanLegacyQuest', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('ramadanLegacyQuest');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = {...gameState, ...parsed};
            
            // Initialize new properties if they don't exist
            if (!gameState.familyGoal) gameState.familyGoal = 1100;
            if (!gameState.goalProgress) gameState.goalProgress = 0;
            if (!gameState.goalAchieved) gameState.goalAchieved = false;
            if (!gameState.treats) gameState.treats = [];
            if (!gameState.dailyContribution) gameState.dailyContribution = {};
            
            // NEW: Initialize check-in properties
            if (!gameState.morningCheckIns) gameState.morningCheckIns = {};
            if (!gameState.eveningCheckIns) gameState.eveningCheckIns = {};
            if (!gameState.reflections) gameState.reflections = [];
            
        } catch(e) {
            console.log("Couldn't load saved game, starting fresh");
        }
    }
}

// ---------- THEME TOGGLE ----------
function toggleTheme() {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    
    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        toggle.innerHTML = '<i class="fas fa-sun"></i>';
        gameState.darkMode = true;
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        toggle.innerHTML = '<i class="fas fa-moon"></i>';
        gameState.darkMode = false;
    }
    saveGame();
}

// ---------- FAMILY CODE FUNCTIONS ----------
function createFamily() {
    // Generate random 6-character family code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    gameState.familyCode = code;
    gameState.players = [];
    gameState.totalPoints = 0;
    gameState.logs = [];
    gameState.goalProgress = 0;
    gameState.goalAchieved = false;
    gameState.treats = [];
    gameState.dailyContribution = {};
    
    // Reset check-ins for new family
    gameState.morningCheckIns = {};
    gameState.eveningCheckIns = {};
    gameState.reflections = [];
    
    updateFamilyDisplay();
    updateGoalDisplay();
    updateCheckInDisplay();
    addLog(`🏠 New family created! Code: ${code}`);
    showCelebration('Family Created!', `Your family code is: ${code}`, true, 0);
    saveGame();
}

function joinFamily() {
    const input = document.getElementById('familyCodeInput');
    const code = input.value.trim().toUpperCase();
    
    if (code.length < 3) {
        showCelebration('Oops!', 'Please enter a valid family code', false, 0);
        return;
    }
    
    gameState.familyCode = code;
    gameState.players = [];
    gameState.totalPoints = 0;
    gameState.goalProgress = 0;
    gameState.goalAchieved = false;
    gameState.treats = [];
    gameState.dailyContribution = {};
    
    // Reset check-ins for new family
    gameState.morningCheckIns = {};
    gameState.eveningCheckIns = {};
    gameState.reflections = [];
    
    updateFamilyDisplay();
    updateGoalDisplay();
    updateCheckInDisplay();
    addLog(`🚪 Joined family: ${code}`);
    showCelebration('Welcome!', `You joined family: ${code}`, true, 0);
    
    input.value = '';
    saveGame();
}

function updateFamilyDisplay() {
    const display = document.getElementById('familyCodeDisplay');
    if (gameState.familyCode) {
        display.innerHTML = `✨ ${gameState.familyCode} ✨`;
    } else {
        display.innerHTML = '🔴 NOT JOINED';
    }
}

// ---------- GOAL PROGRESS FUNCTIONS ----------
function updateGoalDisplay() {
    const goalProgressElement = document.getElementById('goalProgress');
    const goalProgressFill = document.getElementById('goalProgressFill');
    const goalPercentage = document.getElementById('goalPercentage');
    const goalCelebration = document.getElementById('goalCelebration');
    const treatList = document.getElementById('treatList');
    const treatCount = document.getElementById('treatCount');
    
    // Calculate progress percentage
    const progress = Math.min(gameState.totalPoints, gameState.familyGoal);
    const percentage = Math.floor((progress / gameState.familyGoal) * 100);
    
    // Update progress bar
    if (goalProgressElement) {
        goalProgressElement.innerHTML = `${gameState.totalPoints} / ${gameState.familyGoal}`;
    }
    
    if (goalProgressFill) {
        goalProgressFill.style.width = `${percentage}%`;
        goalProgressFill.setAttribute('aria-valuenow', percentage);
    }
    
    if (goalPercentage) {
        goalPercentage.innerHTML = `${percentage}%`;
    }
    
    // Check if goal achieved
    if (!gameState.goalAchieved && gameState.totalPoints >= gameState.familyGoal) {
        gameState.goalAchieved = true;
        if (goalCelebration) {
            goalCelebration.style.display = 'block';
        }
        addLog(`🎉🎉🎉 FAMILY GOAL ACHIEVED! 1100 POINTS! 🎉🎉🎉`);
        showCelebration('GOAL COMPLETE!', 'Your family reached 1100 points! Time to celebrate!', true, 0);
        createConfetti(100);
    } else if (goalCelebration) {
        goalCelebration.style.display = gameState.goalAchieved ? 'block' : 'none';
    }
    
    // Update treat list
    if (treatList) {
        treatList.innerHTML = '';
        if (gameState.treats.length === 0) {
            treatList.innerHTML = '<div style="padding: 15px; text-align: center; color: #8a7c6d;">✨ No treats added yet. Add your family\'s favorite treats! ✨</div>';
        } else {
            gameState.treats.forEach((treat, index) => {
                const treatItem = document.createElement('div');
                treatItem.className = 'treat-item';
                treatItem.innerHTML = `
                    <span>🎁 ${treat.name}</span>
                    <span style="color: #d4af37;">Added by: ${treat.addedBy}</span>
                `;
                treatList.appendChild(treatItem);
            });
        }
    }
    
    // Update treat count
    if (treatCount) {
        treatCount.innerHTML = gameState.treats.length;
    }
}

// ---------- TREAT FUNCTIONS ----------
function addTreat() {
    if (!gameState.familyCode) {
        showCelebration('Join Family', 'Please join a family first', false, 0);
        return;
    }
    
    const treatInput = document.getElementById('treatInput');
    const treatName = treatInput.value.trim();
    
    if (!treatName) {
        showCelebration('Add a Treat', 'Please enter what treat you want!', false, 0);
        return;
    }
    
    let addedBy = 'Family Member';
    if (gameState.players.length > 0) {
        addedBy = gameState.players[gameState.players.length - 1].name;
    }
    
    gameState.treats.push({
        name: treatName,
        addedBy: addedBy,
        timestamp: new Date().toISOString()
    });
    
    updateGoalDisplay();
    addLog(`🎁 ${addedBy} added a treat: ${treatName}`);
    showCelebration('Treat Added!', `✨ ${treatName} ✨`, true, 0);
    
    treatInput.value = '';
    saveGame();
}

function claimReward() {
    if (!gameState.goalAchieved) {
        showCelebration('Goal Not Reached', 'Keep going! Reach 1100 points first!', false, 0);
        return;
    }
    
    if (gameState.treats.length === 0) {
        showCelebration('No Treats Yet', 'Add some treats to claim!', false, 0);
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * gameState.treats.length);
    const claimedTreat = gameState.treats[randomIndex];
    
    gameState.treats.splice(randomIndex, 1);
    
    let claimedBy = 'Family Member';
    if (gameState.players.length > 0) {
        claimedBy = gameState.players[gameState.players.length - 1].name;
    }
    
    updateGoalDisplay();
    addLog(`🎉 ${claimedBy} claimed the treat: ${claimedTreat.name}! 🎉`);
    showCelebration('TREAT CLAIMED!', `🎁 ${claimedTreat.name} 🎁`, true, 50);
    
    if (gameState.players.length > 0) {
        const claimer = gameState.players[gameState.players.length - 1];
        claimer.points += 10;
        gameState.totalPoints += 10;
        updateDisplay();
    }
    
    saveGame();
}

// ---------- DAILY CHECK-IN FUNCTIONS (NO POINTS) ----------
function morningCheckIn() {
    if (!gameState.familyCode) {
        showCelebration('Join Family', 'Please join a family first', false, 0);
        return;
    }
    
    if (gameState.players.length === 0) {
        showCelebration('No Players', 'Please join the game first!', false, 0);
        return;
    }
    
    const player = gameState.players[gameState.players.length - 1];
    const today = `day${gameState.currentDay}`;
    
    // Initialize morning check-ins for today if not exists
    if (!gameState.morningCheckIns[today]) {
        gameState.morningCheckIns[today] = [];
    }
    
    // Check if already checked in
    if (gameState.morningCheckIns[today].includes(player.name)) {
        showCelebration('Already Checked In!', 'You already did your morning check-in today ☀️', false, 0);
        return;
    }
    
    // Add check-in
    gameState.morningCheckIns[today].push(player.name);
    
    updateCheckInDisplay();
    addLog(`☀️ ${player.name} checked in for Fajr - Ramadan Mubarak!`);
    showCelebration('Morning Check-In', 'Alhamdulillah for another day of Ramadan! ☀️', false, 0);
    saveGame();
}

function eveningCheckIn() {
    if (!gameState.familyCode) {
        showCelebration('Join Family', 'Please join a family first', false, 0);
        return;
    }
    
    if (gameState.players.length === 0) {
        showCelebration('No Players', 'Please join the game first!', false, 0);
        return;
    }
    
    const player = gameState.players[gameState.players.length - 1];
    const today = `day${gameState.currentDay}`;
    
    // Initialize evening check-ins for today if not exists
    if (!gameState.eveningCheckIns[today]) {
        gameState.eveningCheckIns[today] = [];
    }
    
    // Check if already checked in
    if (gameState.eveningCheckIns[today].includes(player.name)) {
        showCelebration('Already Checked In!', 'You already did your evening check-in today 🌙', false, 0);
        return;
    }
    
    // Add check-in
    gameState.eveningCheckIns[today].push(player.name);
    
    updateCheckInDisplay();
    addLog(`🌙 ${player.name} checked in for Maghrib - Iftar Mubarak!`);
    showCelebration('Evening Check-In', 'May your fast be accepted! 🌙', false, 0);
    saveGame();
}

function saveReflection() {
    if (!gameState.familyCode) {
        showCelebration('Join Family', 'Please join a family first', false, 0);
        return;
    }
    
    const reflectionInput = document.getElementById('reflectionInput');
    const reflection = reflectionInput.value.trim();
    
    if (!reflection) {
        showCelebration('Empty Reflection', 'Please write something about your day', false, 0);
        return;
    }
    
    let playerName = 'Family Member';
    if (gameState.players.length > 0) {
        playerName = gameState.players[gameState.players.length - 1].name;
    }
    
    gameState.reflections.unshift({
        player: playerName,
        day: gameState.currentDay,
        reflection: reflection,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 20 reflections
    if (gameState.reflections.length > 20) {
        gameState.reflections.pop();
    }
    
    updateCheckInDisplay();
    addLog(`💭 ${playerName} shared a reflection: "${reflection.substring(0, 50)}${reflection.length > 50 ? '...' : ''}"`);
    showCelebration('Reflection Saved', 'JazakAllah khair for sharing! 💚', false, 0);
    
    reflectionInput.value = '';
    saveGame();
}

function updateCheckInDisplay() {
    const today = `day${gameState.currentDay}`;
    
    // Update morning check-in count
    const morningCount = gameState.morningCheckIns[today]?.length || 0;
    const morningCheckInCount = document.getElementById('morningCheckInCount');
    if (morningCheckInCount) {
        morningCheckInCount.innerHTML = `${morningCount} / ${gameState.players.length}`;
    }
    
    // Update morning check-in list
    const morningCheckInList = document.getElementById('morningCheckInList');
    if (morningCheckInList) {
        morningCheckInList.innerHTML = '';
        if (morningCount === 0) {
            morningCheckInList.innerHTML = '<div style="padding: 10px; text-align: center; color: #8a7c6d;">🌙 No morning check-ins yet</div>';
        } else {
            gameState.morningCheckIns[today].forEach(name => {
                const item = document.createElement('div');
                item.style.cssText = 'padding: 8px 12px; margin: 5px 0; background: rgba(212,175,55,0.1); border-radius: 20px; display: inline-block; margin-right: 8px;';
                item.innerHTML = `☀️ ${name}`;
                morningCheckInList.appendChild(item);
            });
        }
    }
    
    // Update evening check-in count
    const eveningCount = gameState.eveningCheckIns[today]?.length || 0;
    const eveningCheckInCount = document.getElementById('eveningCheckInCount');
    if (eveningCheckInCount) {
        eveningCheckInCount.innerHTML = `${eveningCount} / ${gameState.players.length}`;
    }
    
    // Update evening check-in list
    const eveningCheckInList = document.getElementById('eveningCheckInList');
    if (eveningCheckInList) {
        eveningCheckInList.innerHTML = '';
        if (eveningCount === 0) {
            eveningCheckInList.innerHTML = '<div style="padding: 10px; text-align: center; color: #8a7c6d;">🌙 No evening check-ins yet</div>';
        } else {
            gameState.eveningCheckIns[today].forEach(name => {
                const item = document.createElement('div');
                item.style.cssText = 'padding: 8px 12px; margin: 5px 0; background: rgba(212,175,55,0.1); border-radius: 20px; display: inline-block; margin-right: 8px;';
                item.innerHTML = `🌙 ${name}`;
                eveningCheckInList.appendChild(item);
            });
        }
    }
    
    // Update reflections display
    const reflectionsList = document.getElementById('reflectionsList');
    if (reflectionsList) {
        reflectionsList.innerHTML = '';
        if (gameState.reflections.length === 0) {
            reflectionsList.innerHTML = '<div style="padding: 20px; text-align: center; color: #8a7c6d;">💭 No reflections yet. Share your Ramadan thoughts!</div>';
        } else {
            gameState.reflections.slice(0, 10).forEach(ref => {
                const reflectionCard = document.createElement('div');
                reflectionCard.style.cssText = 'padding: 15px; margin: 10px 0; background: rgba(126,159,111,0.1); border-radius: 20px; border-left: 4px solid #d4af37;';
                reflectionCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: bold; color: #7d9a6c;">${ref.player}</span>
                        <span style="color: #d4af37; font-size: 0.9rem;">Day ${ref.day}</span>
                    </div>
                    <p style="font-style: italic;">"${ref.reflection}"</p>
                `;
                reflectionsList.appendChild(reflectionCard);
            });
        }
    }
}

// ---------- MOON TRACKER ----------
function buildMoonTracker() {
    const tracker = document.getElementById('moonTracker');
    tracker.innerHTML = '';
    
    for (let i = 1; i <= 30; i++) {
        const moon = document.createElement('div');
        moon.className = 'moon-day';
        moon.textContent = i;
        
        if (i === gameState.currentDay) {
            moon.classList.add('current');
        } else if (i < gameState.currentDay) {
            moon.classList.add('completed');
        }
        
        moon.addEventListener('click', function() {
            gameState.currentDay = i;
            buildMoonTracker();
            updateDisplay();
            updateCheckInDisplay(); // Update check-ins for new day
            addLog(`📅 Day changed to ${i}`);
            saveGame();
        });
        
        tracker.appendChild(moon);
    }
}

// ---------- PLAYER FUNCTIONS ----------
function joinGame() {
    if (!gameState.familyCode) {
        showCelebration('Family Required!', 'Please create or join a family first', false, 0);
        return;
    }
    
    const name = document.getElementById('playerName').value.trim();
    const character = document.getElementById('characterSelect').value;
    
    if (!name) {
        showCelebration('Enter Name', 'Please enter your name', false, 0);
        return;
    }
    
    if (!character) {
        showCelebration('Choose Role', 'Please select a character', false, 0);
        return;
    }
    
    if (gameState.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showCelebration('Welcome Back!', `${name} is already playing`, true, 0);
        return;
    }
    
    const player = {
        id: Date.now(),
        name: name,
        character: character,
        points: 0,
        todayPoints: 0,
        joinedDay: gameState.currentDay,
        totalContribution: 0
    };
    
    gameState.players.push(player);
    saveGame();
    
    updateDisplay();
    updateCheckInDisplay(); // Update check-in display with new player count
    addLog(`✨ ${name} joined as ${CHARACTER_NAMES[character]}`);
    showCelebration('Welcome!', `${name} joined the quest!`, true, 0);
    
    document.getElementById('playerName').value = '';
    document.getElementById('characterSelect').selectedIndex = 0;
}

// ---------- DAILY SUBMISSION ----------
function submitDaily() {
    if (!gameState.familyCode) {
        showCelebration('Join Family', 'Please join a family first', false, 0);
        return;
    }
    
    if (gameState.players.length === 0) {
        showCelebration('No Players', 'Join the game first!', false, 0);
        return;
    }

    const player = gameState.players[gameState.players.length - 1];
    
    const fastPoints = parseInt(document.getElementById('fastSelect').value);
    const quranPoints = parseInt(document.getElementById('quranSelect').value);
    const prayerPoints = parseInt(document.getElementById('prayerSelect').value);
    const missionPoints = parseInt(document.getElementById('missionSelect').value);
    
    const total = fastPoints + quranPoints + prayerPoints + missionPoints;
    
    if (total === 0) {
        showCelebration('No Points Yet', 'Every small step counts!', false, 0);
        return;
    }
    
    player.points += total;
    player.todayPoints = total;
    player.totalContribution = (player.totalContribution || 0) + total;
    
    gameState.totalPoints += total;
    
    const today = `day${gameState.currentDay}`;
    if (!gameState.dailyContribution[today]) {
        gameState.dailyContribution[today] = 0;
    }
    gameState.dailyContribution[today] += total;
    
    saveGame();
    updateDisplay();
    updateGoalDisplay();
    
    const remaining = gameState.familyGoal - gameState.totalPoints;
    if (remaining > 0 && remaining <= 100) {
        addLog(`🎯 Only ${remaining} points until family goal!`);
    }
    
    addLog(`📊 ${player.name} earned ${total} points`);
    showCelebration('Points Added!', `+${total} points for ${player.name}`, true, total);
    
    document.getElementById('fastSelect').selectedIndex = 0;
    document.getElementById('quranSelect').selectedIndex = 0;
    document.getElementById('prayerSelect').selectedIndex = 0;
    document.getElementById('missionSelect').selectedIndex = 0;
}

// ---------- SECRET DEED ----------
function spotSecretDeed() {
    if (gameState.players.length < 2) {
        showCelebration('Need 2 Players', 'Secret deeds need at least 2 players', false, 0);
        return;
    }
    
    const spotter = gameState.players[gameState.players.length - 1];
    const otherPlayers = gameState.players.filter(p => p.id !== spotter.id);
    const spotted = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
    
    spotter.points += 2;
    spotted.points += 3;
    gameState.totalPoints += 5;
    
    spotter.totalContribution = (spotter.totalContribution || 0) + 2;
    spotted.totalContribution = (spotted.totalContribution || 0) + 3;
    
    saveGame();
    updateDisplay();
    updateGoalDisplay();
    addLog(`👀 ${spotter.name} spotted ${spotted.name}'s secret deed! +5 family points`);
    showCelebration('Secret Deed!', `${spotter.name} spotted ${spotted.name}'s kindness! +5`, true, 5);
}

// ---------- DUA DICE (UPDATED FOR REMOTE FAMILIES) ----------
function rollDice() {
    const roll = Math.floor(Math.random() * 6);
    const prompt = DICE_PROMPTS[roll];
    
    document.getElementById('diceResult').innerHTML = `
        <div style="text-align: center;">
            <span style="font-size: 3rem; display: block; margin-bottom: 10px;">🎲 ${roll+1}</span>
            <span style="font-size: 1.3rem;">${prompt}</span>
            <div style="margin-top: 15px; font-size: 0.9rem; color: #d4af37;">
                <i class="fas fa-heart"></i> Connect with your family today!
            </div>
        </div>
    `;
    
    addLog(`🎲 Dua Dice rolled: "${prompt}"`);
    
    if (gameState.players.length > 0) {
        gameState.players.forEach(p => {
            p.points += 1;
            p.totalContribution = (p.totalContribution || 0) + 1;
        });
        gameState.totalPoints += gameState.players.length;
        saveGame();
        updateDisplay();
        updateGoalDisplay();
    }
}

// ---------- WEEKLY QUEST ----------
function completeQuest() {
    if (gameState.weeklyQuest > 4) {
        showCelebration('All Quests Done!', 'You completed all weekly quests!', true, 0);
        return;
    }
    
    if (gameState.players.length === 0) {
        showCelebration('No Players', 'Join with a character first', false, 0);
        return;
    }
    
    const bonus = gameState.weeklyQuest * 5;
    
    gameState.players.forEach(p => {
        p.points += bonus;
        p.totalContribution = (p.totalContribution || 0) + bonus;
    });
    
    gameState.totalPoints += (bonus * gameState.players.length);
    
    addLog(`🏆 Weekly Quest ${gameState.weeklyQuest} completed! +${bonus} each!`);
    showCelebration('Quest Complete!', `Week ${gameState.weeklyQuest} done! +${bonus} points each!`, true, bonus * gameState.players.length);
    
    gameState.weeklyQuest++;
    if (gameState.weeklyQuest > 4) gameState.weeklyQuest = 4;
    
    saveGame();
    updateDisplay();
    updateQuestDisplay();
    updateGoalDisplay();
}

// ---------- UPDATE DISPLAYS ----------
function updateDisplay() {
    document.getElementById('currentDay').innerHTML = `Day ${gameState.currentDay} of Ramadan`;
    document.getElementById('totalPoints').innerHTML = gameState.totalPoints;
    
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';
    
    if (gameState.players.length === 0) {
        playerList.innerHTML = `
            <div class="player">
                <div><strong>✨ Awaiting Heroes ✨</strong><br><small>Join to begin</small></div>
                <div class="player-points">0</div>
            </div>
        `;
        return;
    }
    
    gameState.players.sort((a, b) => b.points - a.points);
    
    gameState.players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player';
        div.innerHTML = `
            <div>
                <strong>${player.name}</strong><br>
                <small style="color: #7d9a6c;">${CHARACTER_NAMES[player.character]}</small>
                <br><small style="color: #d4af37;">Total contributed: ${player.totalContribution || 0} pts</small>
            </div>
            <div class="player-points">${player.points}</div>
        `;
        playerList.appendChild(div);
    });
}

function updateQuestDisplay() {
    const idx = Math.min(gameState.weeklyQuest - 1, 3);
    document.getElementById('currentQuest').innerHTML = `✨ ${WEEKLY_QUESTS[idx]} ✨`;
}

// ---------- LOG SYSTEM ----------
function addLog(message) {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    gameState.logs.unshift(`[${timestamp}] ${message}`);
    
    if (gameState.logs.length > 25) gameState.logs.pop();
    
    updateLogDisplay();
    saveGame();
}

function updateLogDisplay() {
    const logDiv = document.getElementById('familyLog');
    logDiv.innerHTML = '';
    
    if (gameState.logs.length === 0) {
        logDiv.innerHTML = '<div class="log-entry"><i class="fas fa-star" style="color: #d4af37;"></i> Welcome to Ramadan Legacy Quest!</div>';
        return;
    }
    
    gameState.logs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `<i class="fas fa-circle" style="font-size: 0.6rem; color: #d4af37;"></i> ${log}`;
        logDiv.appendChild(entry);
    });
}

// ---------- CELEBRATION MODAL ----------
function showCelebration(title, message, withConfetti = true, points = 0) {
    document.getElementById('modalTitle').innerHTML = `✨ ${title} ✨`;
    document.getElementById('modalMessage').innerHTML = points > 0 
        ? `${message}<br><span style="font-size: 2rem; color: #d4af37;">+${points} points!</span>` 
        : message;
    
    document.getElementById('celebrationModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
    
    if (withConfetti) createConfetti(40);
    
    setTimeout(closeModal, 3000);
}

function closeModal() {
    document.getElementById('celebrationModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

// ---------- CONFETTI ----------
function createConfetti(count = 40) {
    for (let i = 0; i < count; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti-piece';
        conf.style.left = Math.random() * 100 + '%';
        conf.style.animation = `fall ${Math.random() * 2 + 2}s linear forwards`;
        conf.style.background = `hsl(${Math.random() * 60 + 40}, 80%, 60%)`;
        conf.style.width = Math.random() * 12 + 8 + 'px';
        conf.style.height = conf.style.width;
        
        document.body.appendChild(conf);
        
        setTimeout(() => conf.remove(), 4000);
    }
}

// ---------- UTILITY FUNCTIONS ----------
function shareGame() {
    if (navigator.share) {
        navigator.share({
            title: 'Ramadan Legacy Quest',
            text: `Join our family quest! Family code: ${gameState.familyCode || 'Create one!'} - We're aiming for 1100 points together!`,
            url: window.location.href,
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href);
        showCelebration('Link Copied!', 'Share with your family!', true, 0);
    }
}

function resetDay() {
    if (gameState.currentDay < 30) {
        gameState.currentDay++;
        buildMoonTracker();
        updateDisplay();
        updateCheckInDisplay(); // Reset check-ins for new day
        addLog(`🌙 Day ${gameState.currentDay} begins`);
        showCelebration('New Day', `Welcome to Day ${gameState.currentDay}`, true, 0);
        saveGame();
    } else {
        showCelebration('Ramadan Complete!', 'You\'ve completed 30 days! 🎉', true, 0);
    }
}

function exportData() {
    const dataStr = JSON.stringify(gameState, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ramadan-quest-${gameState.familyCode || 'family'}-day-${gameState.currentDay}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    addLog('💾 Game progress exported');
    showCelebration('Saved!', 'Your progress has been saved', true, 0);
}

function toggleHelp() {
    showCelebration(
        'How to Play', 
        '1️⃣ Create/Join a family\n2️⃣ Choose character\n3️⃣ Log daily worship (earn points!)\n4️⃣ Roll Dua Dice - connect remotely!\n5️⃣ Complete quests!\n\n☀️🌙 Daily Check-Ins (No points) - Build consistency!\n💭 Share reflections with family\n\n🎯 FAMILY GOAL: 1100 POINTS!\nAdd treats and claim rewards when goal is reached!',
        false, 
        0
    );
}

// ============================================
// RAMADAN LEGACY QUEST - SCRIPT.JS
// COMPLETE EDITION WITH:
// - Login System (Email/Phone + Password)
// - Multi-Family Support
// - Family Switching Protection
// - Data Persistence Per User
// - 1100 Point Goal
// - Remote Dua Dice
// - Daily Check-Ins
// ============================================

// ---------- GAME STATE ----------
let gameState = {
    // User Account
    currentUser: null,
    users: {}, // Store multiple users
    
    // Current Family
    familyCode: null,
    families: {}, // Store multiple families per user
    
    // Game Data
    players: [],
    currentDay: 1,
    totalPoints: 0,
    logs: [],
    weeklyQuest: 1,
    darkMode: false,
    
    // 1100 Point Goal System
    familyGoal: 1100,
    goalProgress: 0,
    goalAchieved: false,
    treats: [],
    dailyContribution: {},
    
    // Daily Check-Ins
    morningCheckIns: {},
    eveningCheckIns: {},
    reflections: []
};

// ---------- CONSTANTS ----------
const DICEPROMPTS = [
    "📱 Send a voice note or text to a family member you haven't spoken to today",
    "🤲 Make dua for a family member who is far away right now",
    "💭 Share one thing you miss about being together during Ramadan",
    "📸 Send a photo of your iftar/suhoor to the family group chat",
    "🎙️ Record yourself reciting a short surah and share it with the family",
    "🌍 Make dua for all the Muslims around the world fasting alone"
];

const WEEKLYQUESTS = [
    "🌟 Week 1: Establish 5 family Ramadan traditions (even at a distance!)",
    "🤝 Week 2: Contact 3 relatives or old friends you haven't spoken to",
    "🕌 Week 3: Prepare for the last 10 nights - share your plans with each other",
    "🎉 Week 4: Plan a virtual Eid celebration together"
];

const CHARACTERNAMES = {
    guardian: 'The Guardian',
    seeker: 'The Seeker',
    nourisher: 'The Nourisher',
    connector: 'The Connector',
    healer: 'The Healer',
    illuminator: 'The Illuminator'
};

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', function() {
    console.log("🌟 Ramadan Legacy Quest - Private Family Edition!");
    
    // Load all users from localStorage
    loadAllUsers();
    
    // Check if user is already logged in
    checkAutoLogin();
    
    // Setup login/signup tabs
    document.getElementById('showLoginBtn').addEventListener('click', showLoginForm);
    document.getElementById('showSignupBtn').addEventListener('click', showSignupForm);
    
    // Setup login/signup buttons
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('signupBtn').addEventListener('click', signup);
    
    // Setup confirmation modal buttons
    document.getElementById('confirmNoBtn').addEventListener('click', closeConfirmation);
    
    // Setup logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

// ---------- LOAD ALL USERS FROM STORAGE ----------
function loadAllUsers() {
    const savedUsers = localStorage.getItem('ramadanQuestUsers');
    if (savedUsers) {
        try {
            gameState.users = JSON.parse(savedUsers);
        } catch(e) {
            gameState.users = {};
        }
    } else {
        gameState.users = {};
    }
}

// ---------- SAVE ALL USERS TO STORAGE ----------
function saveAllUsers() {
    localStorage.setItem('ramadanQuestUsers', JSON.stringify(gameState.users));
}

// ---------- CHECK AUTO LOGIN ----------
function checkAutoLogin() {
    const savedUserEmail = localStorage.getItem('ramadanQuestLastUser');
    if (savedUserEmail && gameState.users[savedUserEmail]) {
        // Auto login
        gameState.currentUser = gameState.users[savedUserEmail];
        gameState.currentUser.identifier = savedUserEmail;
        
        // Load user's data
        loadUserData();
        
        // Hide login screen, show game
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        // Initialize game
        initializeGame();
    }
}

// ---------- SHOW LOGIN FORM ----------
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('showLoginBtn').classList.add('active');
    document.getElementById('showSignupBtn').classList.remove('active');
}

// ---------- SHOW SIGNUP FORM ----------
function showSignupForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('showSignupBtn').classList.add('active');
    document.getElementById('showLoginBtn').classList.remove('active');
}

// ---------- LOGIN FUNCTION ----------
function login() {
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!identifier || !password) {
        showCelebration('Missing Information', 'Please enter both email/phone and password', false, 0);
        return;
    }
    
    // Check if user exists
    if (!gameState.users[identifier]) {
        showCelebration('Account Not Found', 'No account found with this email/phone. Please sign up!', false, 0);
        return;
    }
    
    // Check password
    if (gameState.users[identifier].password !== password) {
        showCelebration('Incorrect Password', 'Please try again', false, 0);
        return;
    }
    
    // Login successful
    gameState.currentUser = gameState.users[identifier];
    gameState.currentUser.identifier = identifier;
    
    // Save last logged in user
    localStorage.setItem('ramadanQuestLastUser', identifier);
    
    // Load user's data
    loadUserData();
    
    // Hide login screen, show game
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    // Initialize game
    initializeGame();
    
    showCelebration('Welcome Back!', `Assalamu Alaikum, ${gameState.currentUser.name}!`, true, 0);
}

// ---------- SIGNUP FUNCTION ----------
function signup() {
    const name = document.getElementById('signupName').value.trim();
    const identifier = document.getElementById('signupIdentifier').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const confirmPassword = document.getElementById('signupConfirmPassword').value.trim();
    
    if (!name || !identifier || !password) {
        showCelebration('Missing Information', 'Please fill in all fields', false, 0);
        return;
    }
    
    if (password !== confirmPassword) {
        showCelebration('Password Mismatch', 'Passwords do not match', false, 0);
        return;
    }
    
    if (password.length < 4) {
        showCelebration('Password Too Short', 'Please use at least 4 characters', false, 0);
        return;
    }
    
    // Check if user already exists
    if (gameState.users[identifier]) {
        showCelebration('Account Exists', 'An account with this email/phone already exists. Please sign in.', false, 0);
        return;
    }
    
    // Create new user
    const newUser = {
        name: name,
        password: password,
        families: {}, // Store multiple families
        createdAt: new Date().toISOString()
    };
    
    // Save user
    gameState.users[identifier] = newUser;
    saveAllUsers();
    
    // Auto login
    gameState.currentUser = newUser;
    gameState.currentUser.identifier = identifier;
    localStorage.setItem('ramadanQuestLastUser', identifier);
    
    // Initialize empty game state for new user
    gameState.families = {};
    gameState.familyCode = null;
    gameState.players = [];
    gameState.totalPoints = 0;
    gameState.logs = [];
    
    // Save user data
    saveUserData();
    
    // Hide login screen, show game
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    // Initialize game
    initializeGame();
    
    showCelebration('Account Created!', `Welcome, ${name}! Create or join a family to begin!`, true, 0);
    
    // Clear signup form
    document.getElementById('signupName').value = '';
    document.getElementById('signupIdentifier').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupConfirmPassword').value = '';
}

// ---------- LOGOUT FUNCTION ----------
function logout() {
    // Save current user data
    saveUserData();
    
    // Clear current user
    gameState.currentUser = null;
    localStorage.removeItem('ramadanQuestLastUser');
    
    // Show login screen
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    
    // Clear forms
    document.getElementById('loginIdentifier').value = '';
    document.getElementById('loginPassword').value = '';
    
    showLoginForm();
}

// ---------- LOAD USER DATA ----------
function loadUserData() {
    const identifier = gameState.currentUser.identifier;
    
    if (gameState.users[identifier].gameData) {
        // Load user's saved game data
        const userData = gameState.users[identifier].gameData;
        
        // Restore game state
        gameState.families = userData.families || {};
        gameState.familyCode = userData.familyCode || null;
        gameState.players = userData.players || [];
        gameState.currentDay = userData.currentDay || 1;
        gameState.totalPoints = userData.totalPoints || 0;
        gameState.logs = userData.logs || [];
        gameState.weeklyQuest = userData.weeklyQuest || 1;
        gameState.darkMode = userData.darkMode || false;
        gameState.goalAchieved = userData.goalAchieved || false;
        gameState.treats = userData.treats || [];
        gameState.dailyContribution = userData.dailyContribution || {};
        gameState.morningCheckIns = userData.morningCheckIns || {};
        gameState.eveningCheckIns = userData.eveningCheckIns || {};
        gameState.reflections = userData.reflections || [];
        
        // If currently in a family, load that family's data
        if (gameState.familyCode && gameState.families[gameState.familyCode]) {
            const familyData = gameState.families[gameState.familyCode];
            gameState.players = familyData.players || [];
            gameState.totalPoints = familyData.totalPoints || 0;
            gameState.logs = familyData.logs || [];
            gameState.weeklyQuest = familyData.weeklyQuest || 1;
            gameState.goalAchieved = familyData.goalAchieved || false;
            gameState.treats = familyData.treats || [];
            gameState.dailyContribution = familyData.dailyContribution || {};
            gameState.morningCheckIns = familyData.morningCheckIns || {};
            gameState.eveningCheckIns = familyData.eveningCheckIns || {};
            gameState.reflections = familyData.reflections || [];
        }
    }
    
    // Update user display
    document.getElementById('currentUserName').innerHTML = gameState.currentUser.name;
    document.getElementById('currentUserIdentifier').innerHTML = gameState.currentUser.identifier;
}

// ---------- SAVE USER DATA ----------
function saveUserData() {
    const identifier = gameState.currentUser.identifier;
    
    // Save current family data
    if (gameState.familyCode) {
        if (!gameState.families) gameState.families = {};
        
        gameState.families[gameState.familyCode] = {
            players: gameState.players,
            totalPoints: gameState.totalPoints,
            logs: gameState.logs,
            weeklyQuest: gameState.weeklyQuest,
            goalAchieved: gameState.goalAchieved,
            treats: gameState.treats,
            dailyContribution: gameState.dailyContribution,
            morningCheckIns: gameState.morningCheckIns,
            eveningCheckIns: gameState.eveningCheckIns,
            reflections: gameState.reflections,
            lastUpdated: new Date().toISOString()
        };
    }
    
    // Save all game data to user
    gameState.users[identifier].gameData = {
        families: gameState.families,
        familyCode: gameState.familyCode,
        players: gameState.players,
        currentDay: gameState.currentDay,
        totalPoints: gameState.totalPoints,
        logs: gameState.logs,
        weeklyQuest: gameState.weeklyQuest,
        darkMode: gameState.darkMode,
        goalAchieved: gameState.goalAchieved,
        treats: gameState.treats,
        dailyContribution: gameState.dailyContribution,
        morningCheckIns: gameState.morningCheckIns,
        eveningCheckIns: gameState.eveningCheckIns,
        reflections: gameState.reflections
    };
    
    saveAllUsers();
}

// ---------- RESET PAGE FOR NEW FAMILY (COMPLETE RESET) ----------
function resetPageForNewFamily() {
    // Reset all game data
    gameState.familyCode = null;
    gameState.players = [];
    gameState.totalPoints = 0;
    gameState.logs = [];
    gameState.weeklyQuest = 1;
    gameState.goalAchieved = false;
    gameState.treats = [];
    gameState.dailyContribution = {};
    gameState.morningCheckIns = {};
    gameState.eveningCheckIns = {};
    gameState.reflections = [];
    
    // Reset displays
    updateFamilyDisplay();
    buildMoonTracker();
    updateDisplay();
    updateQuestDisplay();
    updateGoalDisplay();
    updateCheckInDisplay();
    updateLogDisplay();
    
    // Reset dice result
    document.getElementById('diceResult').innerHTML = '✨ Click ROLL for a family prompt ✨';
    
    addLog('🔄 Started new family. Create or join a family to begin!');
}

// ---------- SHOW CONFIRMATION MODAL ----------
function showConfirmation(title, message, onConfirm) {
    document.getElementById('confirmTitle').innerHTML = title;
    document.getElementById('confirmMessage').innerHTML = message;
    document.getElementById('confirmationModal').style.display = 'block';
    document.getElementById('confirmOverlay').style.display = 'block';
    
    // Remove previous listener
    document.getElementById('confirmYesBtn').removeEventListener('click', onConfirm);
    
    // Add new listener
    document.getElementById('confirmYesBtn').addEventListener('click', function() {
        onConfirm();
        closeConfirmation();
    });
}

function closeConfirmation() {
    document.getElementById('confirmationModal').style.display = 'none';
    document.getElementById('confirmOverlay').style.display = 'none';
}

// ---------- INITIALIZE GAME (After Login) ----------
function initializeGame() {
    // Set theme based on saved state
    if (gameState.darkMode) {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }

    // ---------- EVENT LISTENERS ----------
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('joinFamilyBtn').addEventListener('click', joinFamily);
    document.getElementById('createFamilyBtn').addEventListener('click', createFamily);
    document.getElementById('joinGameBtn').addEventListener('click', joinGame);
    document.getElementById('submitDailyBtn').addEventListener('click', submitDaily);
    document.getElementById('spotDeedBtn').addEventListener('click', spotSecretDeed);
    document.getElementById('rollDiceBtn').addEventListener('click', rollDice);
    document.getElementById('completeQuestBtn').addEventListener('click', completeQuest);
    document.getElementById('shareGameBtn').addEventListener('click', shareGame);
    document.getElementById('resetDayBtn').addEventListener('click', resetDay);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('helpBtn').addEventListener('click', toggleHelp);
    
    // Treat System Listeners
    document.getElementById('addTreatBtn').addEventListener('click', addTreat);
    document.getElementById('claimRewardBtn').addEventListener('click', claimReward);
    
    // Check-In Listeners
    document.getElementById('morningCheckInBtn').addEventListener('click', morningCheckIn);
    document.getElementById('eveningCheckInBtn').addEventListener('click', eveningCheckIn);
    document.getElementById('saveReflectionBtn').addEventListener('click', saveReflection);
    
    // Keyboard shortcut: Enter to join game
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && document.getElementById('playerName') === document.activeElement) {
            joinGame();
        }
    });
    
    // Update displays
    updateFamilyDisplay();
    buildMoonTracker();
    updateDisplay();
    updateQuestDisplay();
    updateGoalDisplay();
    updateCheckInDisplay();
    updateLogDisplay();
}

// ---------- CREATE FAMILY WITH CONFIRMATION ----------
function createFamily() {
    if (!gameState.currentUser) {
        showCelebration('Please Login', 'You need to be logged in to create a family', false, 0);
        return;
    }
    
    // If already in a family, ask for confirmation
    if (gameState.familyCode) {
        showConfirmation(
            '⚠️ Start New Family?',
            `You are currently in family: ${gameState.familyCode}. Starting a new family will reset this page completely. Your current family data is saved and you can rejoin anytime.`,
            function() {
                performCreateFamily();
            }
        );
    } else {
        performCreateFamily();
    }
}

function performCreateFamily() {
    // Generate random 6-character family code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Reset page completely
    resetPageForNewFamily();
    
    // Set new family code
    gameState.familyCode = code;
    
    updateFamilyDisplay();
    addLog(`🏠 New family created! Code: ${code}`);
    showCelebration('Family Created!', `Your family code is: ${code}`, true, 0);
    saveUserData();
}

// ---------- JOIN FAMILY WITH PROTECTION ----------
function joinFamily() {
    if (!gameState.currentUser) {
        showCelebration('Please Login', 'You need to be logged in to join a family', false, 0);
        return;
    }
    
    const input = document.getElementById('familyCodeInput');
    const code = input.value.trim().toUpperCase();
    
    if (code.length < 3) {
        showCelebration('Oops!', 'Please enter a valid family code', false, 0);
        return;
    }
    
    // If already in a family, ask for confirmation
    if (gameState.familyCode) {
        showConfirmation(
            '⚠️ Switch Families?',
            `You are currently in family: ${gameState.familyCode}. Switching to ${code} will reset this page completely. Your current family data is saved and you can rejoin anytime.`,
            function() {
                performJoinFamily(code);
            }
        );
    } else {
        performJoinFamily(code);
    }
}

function performJoinFamily(code) {
    // Reset page completely
    resetPageForNewFamily();
    
    // Set new family code
    gameState.familyCode = code;
    
    // Check if this family exists in user's saved families
    if (gameState.families && gameState.families[code]) {
        // Load existing family data
        const familyData = gameState.families[code];
        gameState.players = familyData.players || [];
        gameState.totalPoints = familyData.totalPoints || 0;
        gameState.logs = familyData.logs || [];
        gameState.weeklyQuest = familyData.weeklyQuest || 1;
        gameState.goalAchieved = familyData.goalAchieved || false;
        gameState.treats = familyData.treats || [];
        gameState.dailyContribution = familyData.dailyContribution || {};
        gameState.morningCheckIns = familyData.morningCheckIns || {};
        gameState.eveningCheckIns = familyData.eveningCheckIns || {};
        gameState.reflections = familyData.reflections || [];
        
        // Update displays
        buildMoonTracker();
        updateDisplay();
        updateQuestDisplay();
        updateGoalDisplay();
        updateCheckInDisplay();
        updateLogDisplay();
        
        addLog(`🚪 Rejoined family: ${code} - Welcome back!`);
        showCelebration('Welcome Back!', `You rejoined family: ${code}`, true, 0);
    } else {
        // New family
        addLog(`🚪 Joined new family: ${code}`);
        showCelebration('Welcome!', `You joined family: ${code}`, true, 0);
    }
    
    updateFamilyDisplay();
    input.value = '';
    saveUserData();
}


// ===== TOGGLE ROLES SECTION =====
function toggleRoles() {
    const content = document.getElementById('rolesContent');
    const icon = document.querySelector('.toggle-icon');
    
    if (!content || !icon) return;
    
    if (content.style.display === 'none' || getComputedStyle(content).display === 'none') {
        content.style.display = 'block';
        icon.innerHTML = '▲';
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        icon.innerHTML = '▼';
        icon.style.transform = 'rotate(0deg)';
    }
}

// ---------- REST OF THE FUNCTIONS (SAME AS BEFORE) ----------
// ... (All previous game functions: toggleTheme, updateFamilyDisplay, 
//      updateGoalDisplay, addTreat, claimReward, morningCheckIn, 
//      eveningCheckIn, saveReflection, updateCheckInDisplay,
//      buildMoonTracker, joinGame, submitDaily, spotSecretDeed,
//      rollDice, completeQuest, updateDisplay, updateQuestDisplay,
//      addLog, updateLogDisplay, showCelebration, closeModal,
//      createConfetti, shareGame, resetDay, exportData, toggleHelp)

// [CONTINUED WITH ALL PREVIOUS GAME FUNCTIONS...]
