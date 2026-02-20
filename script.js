// Game State
let gameState = {
    familyCode: null,
    players: [],
    currentDay: 1,
    totalPoints: 0,
    logs: [],
    weeklyQuest: 1,
    darkMode: false,
    familyGoal: 1100,
    goalAchieved: false,
    treats: [],
    morningCheckIns: {},
    eveningCheckIns: {},
    reflections: []
};

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBmJ1qKZqfJZqfJZqfJZqfJZqfJZqfJZqfJZq", // Replace with your Firebase config
    authDomain: "ramadan-quest.firebaseapp.com",
    databaseURL: "https://ramadan-quest-default-rtdb.firebaseio.com",
    projectId: "ramadan-quest",
    storageBucket: "ramadan-quest.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Local player ID
let playerId = localStorage.getItem('playerId') || 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
localStorage.setItem('playerId', playerId);

// Connection status
let isConnected = false;

// Constants
const DICE_PROMPTS = [
    "Send a voice note to a family member you haven't spoken to today",
    "Make dua for a family member who is far away right now",
    "Share one thing you miss about being together during Ramadan",
    "Send a photo of your iftar to the family group chat",
    "Record yourself reciting a short surah and share it",
    "Make dua for all the Muslims around the world fasting alone"
];

const WEEKLY_QUESTS = [
    "Week 1: Establish 5 family Ramadan traditions",
    "Week 2: Contact 3 relatives you haven't spoken to",
    "Week 3: Prepare for the last 10 nights together",
    "Week 4: Plan a virtual Eid celebration"
];

const CHARACTER_NAMES = {
    guardian: 'The Guardian',
    seeker: 'The Seeker',
    nourisher: 'The Nourisher',
    connector: 'The Connector',
    healer: 'The Healer',
    illuminator: 'The Illuminator'
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadGame();
    updateFamilyDisplay();
    buildMoonTracker();
    updateDisplay();
    updateQuestDisplay();
    updateLogDisplay();
    updateGoalDisplay();
    updateCheckInDisplay();

    // Event Listeners
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
    document.getElementById('addTreatBtn').addEventListener('click', addTreat);
    document.getElementById('claimRewardBtn').addEventListener('click', claimReward);
    document.getElementById('morningCheckInBtn').addEventListener('click', morningCheckIn);
    document.getElementById('eveningCheckInBtn').addEventListener('click', eveningCheckIn);
    document.getElementById('saveReflectionBtn').addEventListener('click', saveReflection);
});

// Firebase Connection
function connectToFamily(familyCode) {
    if (!familyCode) return;
    
    const statusRef = database.ref('.info/connected');
    statusRef.on('value', (snap) => {
        if (snap.val()) {
            isConnected = true;
            document.getElementById('connectionStatus').textContent = '🟢 Connected';
            document.getElementById('connectionStatus').classList.add('connected');
            
            // Update online status
            const onlineRef = database.ref(`families/${familyCode}/online/${playerId}`);
            onlineRef.onDisconnect().remove();
            onlineRef.set({
                lastSeen: Date.now(),
                playerName: gameState.players[gameState.players.length - 1]?.name || 'Anonymous'
            });
            
            // Listen for online count
            database.ref(`families/${familyCode}/online`).on('value', (snapshot) => {
                const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
                document.getElementById('onlineCount').textContent = count;
            });
            
            // Listen for family data
            listenToFamilyData(familyCode);
        } else {
            isConnected = false;
            document.getElementById('connectionStatus').textContent = '🔴 Disconnected';
            document.getElementById('connectionStatus').classList.remove('connected');
        }
    });
}

function listenToFamilyData(familyCode) {
    // Listen to players
    database.ref(`families/${familyCode}/players`).on('value', (snapshot) => {
        if (snapshot.exists()) {
            const players = Object.values(snapshot.val());
            gameState.players = players;
            updateDisplay();
            updateCheckInDisplay();
        }
    });
    
    // Listen to total points
    database.ref(`families/${familyCode}/totalPoints`).on('value', (snapshot) => {
        gameState.totalPoints = snapshot.val() || 0;
        updateDisplay();
        updateGoalDisplay();
    });
    
    // Listen to treats
    database.ref(`families/${familyCode}/treats`).on('value', (snapshot) => {
        gameState.treats = snapshot.val() ? Object.values(snapshot.val()) : [];
        updateGoalDisplay();
    });
    
    // Listen to check-ins
    database.ref(`families/${familyCode}/morningCheckIns/day${gameState.currentDay}`).on('value', (snapshot) => {
        gameState.morningCheckIns[`day${gameState.currentDay}`] = snapshot.val() || [];
        updateCheckInDisplay();
    });
    
    database.ref(`families/${familyCode}/eveningCheckIns/day${gameState.currentDay}`).on('value', (snapshot) => {
        gameState.eveningCheckIns[`day${gameState.currentDay}`] = snapshot.val() || [];
        updateCheckInDisplay();
    });
    
    // Listen to reflections
    database.ref(`families/${familyCode}/reflections`).limitToLast(20).on('value', (snapshot) => {
        gameState.reflections = snapshot.val() ? Object.values(snapshot.val()).reverse() : [];
        updateCheckInDisplay();
    });
    
    // Listen to logs
    database.ref(`families/${familyCode}/logs`).limitToLast(25).on('value', (snapshot) => {
        gameState.logs = snapshot.val() ? Object.values(snapshot.val()).reverse() : [];
        updateLogDisplay();
    });
    
    // Listen to weekly quest
    database.ref(`families/${familyCode}/weeklyQuest`).on('value', (snapshot) => {
        gameState.weeklyQuest = snapshot.val() || 1;
        updateQuestDisplay();
    });
    
    // Listen to goal achieved
    database.ref(`families/${familyCode}/goalAchieved`).on('value', (snapshot) => {
        gameState.goalAchieved = snapshot.val() || false;
        updateGoalDisplay();
    });
    
    // Listen to live activity
    database.ref(`families/${familyCode}/live`).limitToLast(10).on('value', (snapshot) => {
        if (snapshot.exists()) {
            const activities = Object.values(snapshot.val()).reverse();
            updateLiveFeed(activities);
        }
    });
}

function updateLiveFeed(activities) {
    const feed = document.getElementById('liveFeed');
    feed.innerHTML = '';
    activities.forEach(activity => {
        const entry = document.createElement('div');
        entry.className = 'live-entry';
        entry.innerHTML = `✨ ${activity}`;
        feed.appendChild(entry);
    });
}

function addLiveActivity(message) {
    if (!gameState.familyCode) return;
    
    const liveRef = database.ref(`families/${gameState.familyCode}/live`).push();
    liveRef.set({
        message: message,
        timestamp: Date.now(),
        playerName: gameState.players[gameState.players.length - 1]?.name || 'System'
    });
    
    // Keep only last 50 activities
    database.ref(`families/${gameState.familyCode}/live`).limitToLast(50).once('value', (snapshot) => {
        const activities = snapshot.val();
        if (activities) {
            const keys = Object.keys(activities);
            if (keys.length > 50) {
                const oldestKey = keys[0];
                database.ref(`families/${gameState.familyCode}/live/${oldestKey}`).remove();
            }
        }
    });
}

// Save/Load (local backup)
function saveGame() {
    localStorage.setItem('ramadanQuest', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('ramadanQuest');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = {...gameState, ...parsed};
        } catch(e) {}
    }
}

// Theme
function toggleTheme() {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    
    if (body.classList.contains('light-mode')) {
        body.classList.replace('light-mode', 'dark-mode');
        toggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        body.classList.replace('dark-mode', 'light-mode');
        toggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    saveGame();
}

// Family Functions
function createFamily() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    gameState.familyCode = code;
    resetGameState();
    
    // Initialize Firebase for this family
    database.ref(`families/${code}`).set({
        createdAt: Date.now(),
        createdBy: playerId,
        totalPoints: 0,
        weeklyQuest: 1,
        goalAchieved: false
    });
    
    connectToFamily(code);
    updateAllDisplays();
    addLog(`New family created! Code: ${code}`);
    addLiveActivity(`🏠 Family ${code} was created!`);
    showCelebration('Family Created!', `Your code: ${code}`);
    saveGame();
}

function joinFamily() {
    const code = document.getElementById('familyCodeInput').value.trim().toUpperCase();
    if (code.length < 3) {
        showCelebration('Error', 'Please enter a valid code', false);
        return;
    }
    
    gameState.familyCode = code;
    resetGameState();
    
    connectToFamily(code);
    updateAllDisplays();
    addLog(`Joined family: ${code}`);
    addLiveActivity(`🚪 ${gameState.players[gameState.players.length - 1]?.name || 'Someone'} joined the family!`);
    showCelebration('Welcome!', `You joined family: ${code}`);
    saveGame();
    
    document.getElementById('familyCodeInput').value = '';
}

function resetGameState() {
    gameState.players = [];
    gameState.totalPoints = 0;
    gameState.logs = [];
    gameState.weeklyQuest = 1;
    gameState.goalAchieved = false;
    gameState.treats = [];
    gameState.morningCheckIns = {};
    gameState.eveningCheckIns = {};
    gameState.reflections = [];
}

function updateAllDisplays() {
    updateFamilyDisplay();
    buildMoonTracker();
    updateDisplay();
    updateQuestDisplay();
    updateGoalDisplay();
    updateCheckInDisplay();
    updateLogDisplay();
}

function updateFamilyDisplay() {
    const display = document.getElementById('familyCodeDisplay');
    display.textContent = gameState.familyCode ? `✨ ${gameState.familyCode} ✨` : 'NOT JOINED';
}

// Moon Tracker
function buildMoonTracker() {
    const tracker = document.getElementById('moonTracker');
    tracker.innerHTML = '';
    
    for (let i = 1; i <= 30; i++) {
        const moon = document.createElement('div');
        moon.className = 'moon-day';
        moon.textContent = i;
        
        if (i === gameState.currentDay) moon.classList.add('current');
        else if (i < gameState.currentDay) moon.classList.add('completed');
        
        moon.onclick = () => {
            gameState.currentDay = i;
            buildMoonTracker();
            updateDisplay();
            updateCheckInDisplay();
            
            // Update check-in listeners for new day
            if (gameState.familyCode) {
                database.ref(`families/${gameState.familyCode}/morningCheckIns/day${i}`).on('value', (snapshot) => {
                    gameState.morningCheckIns[`day${i}`] = snapshot.val() || [];
                    updateCheckInDisplay();
                });
                database.ref(`families/${gameState.familyCode}/eveningCheckIns/day${i}`).on('value', (snapshot) => {
                    gameState.eveningCheckIns[`day${i}`] = snapshot.val() || [];
                    updateCheckInDisplay();
                });
            }
            
            addLog(`Day changed to ${i}`);
            addLiveActivity(`📅 Day changed to ${i}`);
            saveGame();
        };
        
        tracker.appendChild(moon);
    }
}

// Player Functions
function joinGame() {
    if (!gameState.familyCode) {
        showCelebration('Error', 'Please join a family first', false);
        return;
    }
    
    const name = document.getElementById('playerName').value.trim();
    const character = document.getElementById('characterSelect').value;
    
    if (!name || !character) {
        showCelebration('Error', 'Please enter name and select character', false);
        return;
    }
    
    const player = {
        id: playerId,
        name: name,
        character: character,
        points: 0,
        totalContribution: 0,
        joinedAt: Date.now()
    };
    
    // Save to Firebase
    database.ref(`families/${gameState.familyCode}/players/${playerId}`).set(player);
    
    // Update online status with name
    database.ref(`families/${gameState.familyCode}/online/${playerId}`).update({
        playerName: name
    });
    
    gameState.players.push(player);
    saveGame();
    updateDisplay();
    updateCheckInDisplay();
    addLog(`${name} joined as ${CHARACTER_NAMES[character]}`);
    addLiveActivity(`✨ ${name} joined as ${CHARACTER_NAMES[character]}!`);
    showCelebration('Welcome!', `${name} joined the quest!`);
    
    document.getElementById('playerName').value = '';
}

// Daily Submission
function submitDaily() {
    if (!gameState.familyCode || gameState.players.length === 0) {
        showCelebration('Error', 'Join a family and add players first', false);
        return;
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    const fastPoints = parseInt(document.getElementById('fastSelect').value) || 0;
    const quranPoints = parseInt(document.getElementById('quranSelect').value) || 0;
    const prayerPoints = parseInt(document.getElementById('prayerSelect').value) || 0;
    const missionPoints = parseInt(document.getElementById('missionSelect').value) || 0;
    
    const total = fastPoints + quranPoints + prayerPoints + missionPoints;
    
    if (total === 0) {
        showCelebration('No Points', 'Every small step counts!', false);
        return;
    }
    
    player.points += total;
    player.totalContribution += total;
    gameState.totalPoints += total;
    
    // Update in Firebase
    database.ref(`families/${gameState.familyCode}/players/${playerId}`).update({
        points: player.points,
        totalContribution: player.totalContribution
    });
    
    database.ref(`families/${gameState.familyCode}/totalPoints`).set(gameState.totalPoints);
    
    // Add to daily contribution
    const today = `day${gameState.currentDay}`;
    database.ref(`families/${gameState.familyCode}/dailyContributions/${today}/${playerId}`).set({
        points: total,
        name: player.name
    });
    
    saveGame();
    updateDisplay();
    updateGoalDisplay();
    addLog(`${player.name} earned ${total} points`);
    addLiveActivity(`📊 ${player.name} earned +${total} points!`);
    showCelebration('Points Added!', `+${total} points!`, true, total);
    
    // Reset selects
    document.getElementById('fastSelect').selectedIndex = 0;
    document.getElementById('quranSelect').selectedIndex = 0;
    document.getElementById('prayerSelect').selectedIndex = 0;
    document.getElementById('missionSelect').selectedIndex = 0;
}

// Secret Deed
function spotSecretDeed() {
    if (gameState.players.length < 2) {
        showCelebration('Need 2 Players', 'Secret deeds need at least 2 players', false);
        return;
    }
    
    const spotter = gameState.players.find(p => p.id === playerId);
    if (!spotter) return;
    
    const otherPlayers = gameState.players.filter(p => p.id !== playerId);
    const spotted = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
    
    spotter.points += 2;
    spotted.points += 3;
    gameState.totalPoints += 5;
    
    // Update in Firebase
    database.ref(`families/${gameState.familyCode}/players/${playerId}`).update({
        points: spotter.points,
        totalContribution: spotter.totalContribution + 2
    });
    
    database.ref(`families/${gameState.familyCode}/players/${spotted.id}`).update({
        points: spotted.points,
        totalContribution: spotted.totalContribution + 3
    });
    
    database.ref(`families/${gameState.familyCode}/totalPoints`).set(gameState.totalPoints);
    
    saveGame();
    updateDisplay();
    updateGoalDisplay();
    addLog(`${spotter.name} spotted ${spotted.name}'s secret deed! +5 points`);
    addLiveActivity(`👀 ${spotter.name} spotted ${spotted.name}'s kindness! +5`);
    showCelebration('Secret Deed!', `+5 family points!`, true, 5);
}

// Dua Dice
function rollDice() {
    const roll = Math.floor(Math.random() * 6);
    const prompt = DICE_PROMPTS[roll];
    
    document.getElementById('diceResult').innerHTML = `
        <div>
            <div style="font-size: 3rem; margin-bottom: 10px;">🎲 ${roll + 1}</div>
            <div style="font-size: 1.1rem;">${prompt}</div>
        </div>
    `;
    
    addLog(`Dua Dice rolled: "${prompt}"`);
    addLiveActivity(`🎲 Dua Dice rolled: ${prompt.substring(0, 50)}...`);
    
    if (gameState.players.length > 0) {
        gameState.players.forEach(p => {
            p.points += 1;
            p.totalContribution += 1;
            
            // Update each player in Firebase
            database.ref(`families/${gameState.familyCode}/players/${p.id}`).update({
                points: p.points,
                totalContribution: p.totalContribution
            });
        });
        
        gameState.totalPoints += gameState.players.length;
        database.ref(`families/${gameState.familyCode}/totalPoints`).set(gameState.totalPoints);
        
        saveGame();
        updateDisplay();
        updateGoalDisplay();
    }
}

// Weekly Quest
function completeQuest() {
    if (gameState.weeklyQuest > 4) {
        showCelebration('All Done!', 'You completed all quests!', true, 0);
        return;
    }
    
    if (gameState.players.length === 0) {
        showCelebration('No Players', 'Join with a character first', false);
        return;
    }
    
    const bonus = gameState.weeklyQuest * 5;
    
    gameState.players.forEach(p => {
        p.points += bonus;
        p.totalContribution += bonus;
        
        // Update each player in Firebase
        database.ref(`families/${gameState.familyCode}/players/${p.id}`).update({
            points: p.points,
            totalContribution: p.totalContribution
        });
    });
    
    gameState.totalPoints += bonus * gameState.players.length;
    gameState.weeklyQuest = Math.min(gameState.weeklyQuest + 1, 4);
    
    // Update in Firebase
    database.ref(`families/${gameState.familyCode}/totalPoints`).set(gameState.totalPoints);
    database.ref(`families/${gameState.familyCode}/weeklyQuest`).set(gameState.weeklyQuest);
    
    addLog(`Weekly Quest ${gameState.weeklyQuest - 1} completed! +${bonus} each!`);
    addLiveActivity(`🏆 Weekly Quest completed! +${bonus} points each!`);
    showCelebration('Quest Complete!', `+${bonus} points each!`, true, bonus * gameState.players.length);
    
    saveGame();
    updateDisplay();
    updateQuestDisplay();
    updateGoalDisplay();
}

// Goal Functions
function updateGoalDisplay() {
    document.getElementById('goalProgress').textContent = `${gameState.totalPoints} / 1100`;
    const percent = Math.min(Math.floor((gameState.totalPoints / 1100) * 100), 100);
    document.getElementById('goalProgressFill').style.width = percent + '%';
    document.getElementById('goalPercentage').textContent = percent + '%';
    
    if (!gameState.goalAchieved && gameState.totalPoints >= 1100) {
        gameState.goalAchieved = true;
        document.getElementById('goalCelebration').style.display = 'block';
        
        // Update in Firebase
        database.ref(`families/${gameState.familyCode}/goalAchieved`).set(true);
        
        addLog('🎉 FAMILY GOAL ACHIEVED! 1100 POINTS! 🎉');
        addLiveActivity('🎉🎉🎉 FAMILY GOAL ACHIEVED! 1100 POINTS! 🎉🎉🎉');
        showCelebration('GOAL COMPLETE!', 'Time to celebrate!', true, 0);
        createConfetti(100);
    }
    
    updateTreatsDisplay();
}

function updateTreatsDisplay() {
    const list = document.getElementById('treatList');
    document.getElementById('treatCount').textContent = gameState.treats.length;
    
    list.innerHTML = '';
    if (gameState.treats.length === 0) {
        list.innerHTML = '<div style="padding: 15px; text-align: center;">✨ Add your favorite treats! ✨</div>';
    } else {
        gameState.treats.forEach(treat => {
            const item = document.createElement('div');
            item.className = 'treat-item';
            item.innerHTML = `🎁 ${treat.name} <span style="color: #d4af37;">by ${treat.addedBy}</span>`;
            list.appendChild(item);
        });
    }
}

function addTreat() {
    const input = document.getElementById('treatInput');
    const name = input.value.trim();
    
    if (!name) {
        showCelebration('Error', 'Please enter a treat', false);
        return;
    }
    
    const treat = {
        name: name,
        addedBy: gameState.players.find(p => p.id === playerId)?.name || 'Family Member',
        timestamp: Date.now()
    };
    
    // Save to Firebase
    const treatRef = database.ref(`families/${gameState.familyCode}/treats`).push();
    treatRef.set(treat);
    
    gameState.treats.push(treat);
    updateTreatsDisplay();
    addLog(`Treat added: ${name}`);
    addLiveActivity(`🎁 ${treat.addedBy} added a treat: ${name}`);
    showCelebration('Treat Added!', name, true, 0);
    input.value = '';
    saveGame();
}

function claimReward() {
    if (!gameState.goalAchieved) {
        showCelebration('Not Yet!', 'Reach 1100 points first!', false);
        return;
    }
    
    if (gameState.treats.length === 0) {
        showCelebration('No Treats', 'Add some treats first!', false);
        return;
    }
    
    const index = Math.floor(Math.random() * gameState.treats.length);
    const treat = gameState.treats[index];
    
    // Remove from Firebase
    database.ref(`families/${gameState.familyCode}/treats`).once('value', (snapshot) => {
        const treats = snapshot.val();
        if (treats) {
            const keys = Object.keys(treats);
            if (keys[index]) {
                database.ref(`families/${gameState.familyCode}/treats/${keys[index]}`).remove();
            }
        }
    });
    
    gameState.treats.splice(index, 1);
    
    const claimer = gameState.players.find(p => p.id === playerId);
    if (claimer) {
        claimer.points += 10;
        claimer.totalContribution += 10;
        gameState.totalPoints += 10;
        
        // Update in Firebase
        database.ref(`families/${gameState.familyCode}/players/${playerId}`).update({
            points: claimer.points,
            totalContribution: claimer.totalContribution
        });
        database.ref(`families/${gameState.familyCode}/totalPoints`).set(gameState.totalPoints);
    }
    
    updateTreatsDisplay();
    updateDisplay();
    updateGoalDisplay();
    addLog(`Treat claimed: ${treat.name}!`);
    addLiveActivity(`🎉 ${claimer?.name || 'Someone'} claimed the treat: ${treat.name}!`);
    showCelebration('TREAT CLAIMED!', `🎁 ${treat.name} 🎁`, true, 10);
    saveGame();
}

// Check-In Functions
function morningCheckIn() {
    if (!gameState.familyCode || gameState.players.length === 0) return;
    
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    const today = `day${gameState.currentDay}`;
    
    // Check if already checked in
    database.ref(`families/${gameState.familyCode}/morningCheckIns/${today}`).once('value', (snapshot) => {
        const checkIns = snapshot.val() || [];
        if (checkIns.includes(player.name)) {
            showCelebration('Already Checked In!', 'You already checked in today', false);
            return;
        }
        
        // Add check-in
        checkIns.push(player.name);
        database.ref(`families/${gameState.familyCode}/morningCheckIns/${today}`).set(checkIns);
        
        addLog(`${player.name} checked in for Fajr`);
        addLiveActivity(`☀️ ${player.name} checked in for Fajr`);
        showCelebration('Morning Check-In', 'Ramadan Mubarak! ☀️', false);
    });
}

function eveningCheckIn() {
    if (!gameState.familyCode || gameState.players.length === 0) return;
    
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    const today = `day${gameState.currentDay}`;
    
    // Check if already checked in
    database.ref(`families/${gameState.familyCode}/eveningCheckIns/${today}`).once('value', (snapshot) => {
        const checkIns = snapshot.val() || [];
        if (checkIns.includes(player.name)) {
            showCelebration('Already Checked In!', 'You already checked in today', false);
            return;
        }
        
        // Add check-in
        checkIns.push(player.name);
        database.ref(`families/${gameState.familyCode}/eveningCheckIns/${today}`).set(checkIns);
        
        addLog(`${player.name} checked in for Maghrib`);
        addLiveActivity(`🌙 ${player.name} checked in for Maghrib`);
        showCelebration('Evening Check-In', 'Iftar Mubarak! 🌙', false);
    });
}

function saveReflection() {
    const input = document.getElementById('reflectionInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const reflection = {
        player: gameState.players.find(p => p.id === playerId)?.name || 'Family Member',
        day: gameState.currentDay,
        text: text,
        timestamp: Date.now()
    };
    
    // Save to Firebase
    database.ref(`families/${gameState.familyCode}/reflections`).push(reflection);
    
    addLog('New reflection shared');
    addLiveActivity(`💭 ${reflection.player} shared a reflection`);
    showCelebration('Reflection Saved', 'JazakAllah khair! 💚', false);
    input.value = '';
}

function updateCheckInDisplay() {
    const today = `day${gameState.currentDay}`;
    
    const morning = gameState.morningCheckIns[today] || [];
    const evening = gameState.eveningCheckIns[today] || [];
    
    document.getElementById('morningCheckInCount').textContent = `${morning.length} / ${gameState.players.length}`;
    document.getElementById('eveningCheckInCount').textContent = `${evening.length} / ${gameState.players.length}`;
    
    const morningList = document.getElementById('morningCheckInList');
    morningList.innerHTML = '';
    if (morning.length === 0) {
        morningList.innerHTML = '<div>No check-ins yet</div>';
    } else {
        morning.forEach(name => {
            const el = document.createElement('span');
            el.style.cssText = 'display: inline-block; padding: 5px 10px; margin: 3px; background: rgba(212,175,55,0.1); border-radius: 20px;';
            el.textContent = `☀️ ${name}`;
            morningList.appendChild(el);
        });
    }
    
    const eveningList = document.getElementById('eveningCheckInList');
    eveningList.innerHTML = '';
    if (evening.length === 0) {
        eveningList.innerHTML = '<div>No check-ins yet</div>';
    } else {
        evening.forEach(name => {
            const el = document.createElement('span');
            el.style.cssText = 'display: inline-block; padding: 5px 10px; margin: 3px; background: rgba(212,175,55,0.1); border-radius: 20px;';
            el.textContent = `🌙 ${name}`;
            eveningList.appendChild(el);
        });
    }
    
    const reflectionsList = document.getElementById('reflectionsList');
    reflectionsList.innerHTML = '';
    if (gameState.reflections.length === 0) {
        reflectionsList.innerHTML = '<div>No reflections yet</div>';
    } else {
        gameState.reflections.slice(0, 10).forEach(ref => {
            const el = document.createElement('div');
            el.style.cssText = 'padding: 10px; margin: 5px 0; background: rgba(127,168,106,0.1); border-radius: 10px;';
            el.innerHTML = `<strong>${ref.player}</strong> (Day ${ref.day}): "${ref.text}"`;
            reflectionsList.appendChild(el);
        });
    }
}

// Display Updates
function updateDisplay() {
    document.getElementById('currentDay').textContent = `Day ${gameState.currentDay} of Ramadan`;
    document.getElementById('totalPoints').textContent = gameState.totalPoints;
    
    const list = document.getElementById('playerList');
    list.innerHTML = '';
    
    if (gameState.players.length === 0) {
        list.innerHTML = '<div class="player"><div>✨ Awaiting Heroes ✨</div><div class="player-points">0</div></div>';
        return;
    }
    
    gameState.players.sort((a, b) => b.points - a.points).forEach(p => {
        const div = document.createElement('div');
        div.className = 'player';
        div.innerHTML = `
            <div>
                <strong>${p.name} ${p.id === playerId ? '(You)' : ''}</strong><br>
                <small>${CHARACTER_NAMES[p.character]}</small>
            </div>
            <div class="player-points">${p.points}</div>
        `;
        list.appendChild(div);
    });
}

function updateQuestDisplay() {
    const idx = Math.min(gameState.weeklyQuest - 1, 3);
    document.getElementById('currentQuest').textContent = WEEKLY_QUESTS[idx];
}

// Log Functions
function addLog(message) {
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    const logEntry = `[${time}] ${message}`;
    
    // Save to Firebase
    if (gameState.familyCode) {
        database.ref(`families/${gameState.familyCode}/logs`).push({
            message: logEntry,
            timestamp: Date.now()
        });
    }
    
    gameState.logs.unshift(logEntry);
    if (gameState.logs.length > 25) gameState.logs.pop();
    updateLogDisplay();
    saveGame();
}

function updateLogDisplay() {
    const log = document.getElementById('familyLog');
    log.innerHTML = '';
    
    if (gameState.logs.length === 0) {
        log.innerHTML = '<div class="log-entry">Welcome to Ramadan Legacy Quest!</div>';
        return;
    }
    
    gameState.logs.forEach(l => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `⭐ ${l}`;
        log.appendChild(entry);
    });
}

// Celebration
function showCelebration(title, message, withConfetti = true, points = 0) {
    document.getElementById('modalTitle').textContent = `✨ ${title} ✨`;
    document.getElementById('modalMessage').innerHTML = points ? 
        `${message}<br><span style="font-size: 2rem; color: #d4af37;">+${points} points!</span>` : 
        message;
    
    document.getElementById('celebrationModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
    
    if (withConfetti) createConfetti();
    setTimeout(closeModal, 2500);
}

function closeModal() {
    document.getElementById('celebrationModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

// Confetti
function createConfetti(count = 40) {
    for (let i = 0; i < count; i++) {
        const conf = document.createElement('div');
        conf.style.cssText = `
            position: fixed;
            width: ${Math.random() * 12 + 8}px;
            height: ${Math.random() * 12 + 8}px;
            background: hsl(${Math.random() * 60 + 40}, 80%, 60%);
            left: ${Math.random() * 100}%;
            top: -20px;
            pointer-events: none;
            z-index: 10001;
            animation: fall ${Math.random() * 2 + 2}s linear forwards;
        `;
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 4000);
    }
}

// Utility Functions
function shareGame() {
    const text = `Join our Ramadan family quest! Family code: ${gameState.familyCode || 'Create one!'}`;
    
    if (navigator.share) {
        navigator.share({ title: 'Ramadan Legacy Quest', text, url: window.location.href });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showCelebration('Link Copied!', 'Share with your family!', true);
    }
}

function resetDay() {
    if (gameState.currentDay < 30) {
        gameState.currentDay++;
        buildMoonTracker();
        updateDisplay();
        updateCheckInDisplay();
        addLog(`Day ${gameState.currentDay} begins`);
        addLiveActivity(`🌙 Day ${gameState.currentDay} begins`);
        showCelebration('New Day', `Welcome to Day ${gameState.currentDay}`, true);
        saveGame();
    } else {
        showCelebration('Complete!', 'Ramadan Mubarak! 🎉', true);
    }
}

function exportData() {
    const data = JSON.stringify(gameState, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ramadan-quest-${gameState.familyCode || 'family'}.json`;
    a.click();
    addLog('Game progress exported');
    showCelebration('Saved!', 'Progress saved', true);
}

function toggleHelp() {
    showCelebration('How to Play', 
        '1️⃣ Join/Create family\n2️⃣ Choose character\n3️⃣ Log daily worship\n4️⃣ Roll Dua Dice\n5️⃣ Complete quests\n\n🎯 Goal: 1100 points!\n\n👥 Family members now see each other in real-time!',
        false);
}

function toggleRoles() {
    const content = document.getElementById('rolesContent');
    const icon = document.querySelector('.toggle-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▲';
    } else {
        content.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Add keyframe animation for confetti
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
    }
`;
document.head.appendChild(style);
