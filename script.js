// Game State - This will now be primarily driven by Firebase
let gameState = {
    familyCode: null,
    players: {},
    currentDay: 1,
    totalPoints: 0,
    logs: [],
    weeklyQuest: 1,
    darkMode: false,
    familyGoal: 1100,
    goalAchieved: false,
    treats: {},
    morningCheckIns: {},
    eveningCheckIns: {},
    reflections: [],
    dailyContributions: {}
};

// Firebase Configuration - Replace with your own!
const firebaseConfig = {
    apiKey: "AIzaSyBmJ1qKZqfJZqfJZqfJZqfJZqfJZqfJZqfJZq", // You need to replace this
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
let playerId = localStorage.getItem('playerId');
if (!playerId) {
    playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('playerId', playerId);
}

// Current player data
let currentPlayer = null;

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
    loadLocalSettings();
    updateFamilyDisplay();
    buildMoonTracker();
    updateQuestDisplay();
    updateLogDisplay();

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

// Load only theme and local settings
function loadLocalSettings() {
    const saved = localStorage.getItem('ramadanQuestSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            gameState.darkMode = settings.darkMode || false;
            if (gameState.darkMode) {
                document.body.classList.remove('light-mode');
                document.body.classList.add('dark-mode');
                document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
            }
        } catch(e) {}
    }
}

// Save only theme settings locally
function saveLocalSettings() {
    localStorage.setItem('ramadanQuestSettings', JSON.stringify({
        darkMode: gameState.darkMode
    }));
}

// Firebase Connection
function connectToFamily(familyCode) {
    if (!familyCode) return;
    
    const statusRef = database.ref('.info/connected');
    statusRef.on('value', (snap) => {
        if (snap.val()) {
            isConnected = true;
            document.getElementById('connectionStatus').textContent = '🟢 Connected';
            document.getElementById('connectionStatus').classList.add('connected');
            
            // Update online status if player has joined
            if (currentPlayer) {
                const onlineRef = database.ref(`families/${familyCode}/online/${playerId}`);
                onlineRef.onDisconnect().remove();
                onlineRef.set({
                    lastSeen: Date.now(),
                    playerName: currentPlayer.name,
                    playerId: playerId
                });
            }
            
            // Listen for online count
            database.ref(`families/${familyCode}/online`).on('value', (snapshot) => {
                const online = snapshot.val() || {};
                const count = Object.keys(online).length;
                document.getElementById('onlineCount').textContent = count;
            });
            
            // Set up all listeners
            setupFamilyListeners(familyCode);
        } else {
            isConnected = false;
            document.getElementById('connectionStatus').textContent = '🔴 Disconnected';
            document.getElementById('connectionStatus').classList.remove('connected');
        }
    });
}

function setupFamilyListeners(familyCode) {
    // Listen to ALL players
    database.ref(`families/${familyCode}/players`).on('value', (snapshot) => {
        gameState.players = snapshot.val() || {};
        console.log('Players updated:', gameState.players); // Debug log
        updateDisplay();
        updateCheckInDisplay();
    });
    
    // Listen to total points
    database.ref(`families/${familyCode}/totalPoints`).on('value', (snapshot) => {
        gameState.totalPoints = snapshot.val() || 0;
        updateDisplay();
        updateGoalDisplay();
    });
    
    // Listen to treats
    database.ref(`families/${familyCode}/treats`).on('value', (snapshot) => {
        gameState.treats = snapshot.val() || {};
        updateGoalDisplay();
    });
    
    // Listen to morning check-ins for current day
    database.ref(`families/${familyCode}/morningCheckIns/day${gameState.currentDay}`).on('value', (snapshot) => {
        gameState.morningCheckIns[`day${gameState.currentDay}`] = snapshot.val() || [];
        updateCheckInDisplay();
    });
    
    // Listen to evening check-ins for current day
    database.ref(`families/${familyCode}/eveningCheckIns/day${gameState.currentDay}`).on('value', (snapshot) => {
        gameState.eveningCheckIns[`day${gameState.currentDay}`] = snapshot.val() || [];
        updateCheckInDisplay();
    });
    
    // Listen to reflections
    database.ref(`families/${familyCode}/reflections`).orderByChild('timestamp').limitToLast(20).on('value', (snapshot) => {
        const reflectionsObj = snapshot.val() || {};
        gameState.reflections = Object.values(reflectionsObj).reverse();
        updateCheckInDisplay();
    });
    
    // Listen to logs
    database.ref(`families/${familyCode}/logs`).orderByChild('timestamp').limitToLast(25).on('value', (snapshot) => {
        const logsObj = snapshot.val() || {};
        gameState.logs = Object.values(logsObj).reverse().map(l => l.message);
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
    
    // Listen to daily contributions
    database.ref(`families/${familyCode}/dailyContributions`).on('value', (snapshot) => {
        gameState.dailyContributions = snapshot.val() || {};
    });
    
    // Listen to live activity
    database.ref(`families/${familyCode}/live`).orderByChild('timestamp').limitToLast(10).on('value', (snapshot) => {
        const activities = snapshot.val() || {};
        updateLiveFeed(Object.values(activities).reverse());
    });
}

function updateLiveFeed(activities) {
    const feed = document.getElementById('liveFeed');
    feed.innerHTML = '';
    if (activities.length === 0) {
        feed.innerHTML = '<div class="live-entry">✨ Welcome to Ramadan Legacy Quest!</div>';
    } else {
        activities.forEach(activity => {
            const entry = document.createElement('div');
            entry.className = 'live-entry';
            entry.innerHTML = `✨ ${activity.message}`;
            feed.appendChild(entry);
        });
    }
}

function addLiveActivity(message) {
    if (!gameState.familyCode) return;
    
    const liveRef = database.ref(`families/${gameState.familyCode}/live`).push();
    liveRef.set({
        message: message,
        timestamp: Date.now(),
        playerName: currentPlayer?.name || 'System'
    });
}

// Theme
function toggleTheme() {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    
    if (body.classList.contains('light-mode')) {
        body.classList.replace('light-mode', 'dark-mode');
        toggle.innerHTML = '<i class="fas fa-sun"></i>';
        gameState.darkMode = true;
    } else {
        body.classList.replace('dark-mode', 'light-mode');
        toggle.innerHTML = '<i class="fas fa-moon"></i>';
        gameState.darkMode = false;
    }
    saveLocalSettings();
}

// Family Functions
function createFamily() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    gameState.familyCode = code;
    currentPlayer = null;
    
    // Initialize Firebase for this family
    database.ref(`families/${code}`).set({
        createdAt: Date.now(),
        createdBy: playerId,
        totalPoints: 0,
        weeklyQuest: 1,
        goalAchieved: false
    }).then(() => {
        connectToFamily(code);
        updateFamilyDisplay();
        addLog(`New family created! Code: ${code}`);
        addLiveActivity(`🏠 Family ${code} was created!`);
        showCelebration('Family Created!', `Your code: ${code}`);
    });
}

function joinFamily() {
    const code = document.getElementById('familyCodeInput').value.trim().toUpperCase();
    if (code.length < 3) {
        showCelebration('Error', 'Please enter a valid code', false);
        return;
    }
    
    // Check if family exists
    database.ref(`families/${code}`).once('value', (snapshot) => {
        if (snapshot.exists()) {
            gameState.familyCode = code;
            currentPlayer = null;
            connectToFamily(code);
            updateFamilyDisplay();
            addLog(`Joined family: ${code}`);
            addLiveActivity(`🚪 Someone joined the family!`);
            showCelebration('Welcome!', `You joined family: ${code}`);
            document.getElementById('familyCodeInput').value = '';
        } else {
            showCelebration('Error', 'Family code not found', false);
        }
    });
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
        
        if (i === gameState.currentDay) {
            moon.classList.add('current');
        } else if (i < gameState.currentDay) {
            moon.classList.add('completed');
        }
        
        moon.onclick = () => {
            gameState.currentDay = i;
            buildMoonTracker();
            
            // Update listeners for new day
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
    
    currentPlayer = {
        id: playerId,
        name: name,
        character: character,
        points: 0,
        totalContribution: 0,
        joinedAt: Date.now()
    };
    
    // Save to Firebase - this will trigger the listener and update all clients
    database.ref(`families/${gameState.familyCode}/players/${playerId}`).set(currentPlayer).then(() => {
        // Update online status
        database.ref(`families/${gameState.familyCode}/online/${playerId}`).set({
            lastSeen: Date.now(),
            playerName: name,
            playerId: playerId
        });
        
        addLog(`${name} joined as ${CHARACTER_NAMES[character]}`);
        addLiveActivity(`✨ ${name} joined as ${CHARACTER_NAMES[character]}!`);
        showCelebration('Welcome!', `${name} joined the quest!`);
        
        document.getElementById('playerName').value = '';
        document.getElementById('characterSelect').selectedIndex = 0;
    });
}

// Daily Submission
function submitDaily() {
    if (!gameState.familyCode || !currentPlayer) {
        showCelebration('Error', 'Join a family and add yourself first', false);
        return;
    }
    
    const fastPoints = parseInt(document.getElementById('fastSelect').value) || 0;
    const quranPoints = parseInt(document.getElementById('quranSelect').value) || 0;
    const prayerPoints = parseInt(document.getElementById('prayerSelect').value) || 0;
    const missionPoints = parseInt(document.getElementById('missionSelect').value) || 0;
    
    const total = fastPoints + quranPoints + prayerPoints + missionPoints;
    
    if (total === 0) {
        showCelebration('No Points', 'Every small step counts!', false);
        return;
    }
    
    // Update current player points
    currentPlayer.points += total;
    currentPlayer.totalContribution += total;
    
    // Update in Firebase - this will trigger the listener and update all clients
    database.ref(`families/${gameState.familyCode}/players/${playerId}`).update({
        points: currentPlayer.points,
        totalContribution: currentPlayer.totalContribution
    }).then(() => {
        // Update total family points
        const newTotal = (gameState.totalPoints || 0) + total;
        database.ref(`families/${gameState.familyCode}/totalPoints`).set(newTotal);
        
        // Add to daily contribution
        const today = `day${gameState.currentDay}`;
        database.ref(`families/${gameState.familyCode}/dailyContributions/${today}/${playerId}`).set({
            points: total,
            name: currentPlayer.name,
            timestamp: Date.now()
        });
        
        addLog(`${currentPlayer.name} earned ${total} points`);
        addLiveActivity(`📊 ${currentPlayer.name} earned +${total} points!`);
        showCelebration('Points Added!', `+${total} points!`, true, total);
        
        // Reset selects
        document.getElementById('fastSelect').selectedIndex = 0;
        document.getElementById('quranSelect').selectedIndex = 0;
        document.getElementById('prayerSelect').selectedIndex = 0;
        document.getElementById('missionSelect').selectedIndex = 0;
    });
}

// Secret Deed
function spotSecretDeed() {
    if (!gameState.familyCode || !currentPlayer) {
        showCelebration('Error', 'Join a family first', false);
        return;
    }
    
    const players = Object.values(gameState.players);
    if (players.length < 2) {
        showCelebration('Need 2 Players', 'Secret deeds need at least 2 players', false);
        return;
    }
    
    const otherPlayers = players.filter(p => p.id !== playerId);
    const spotted = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
    
    // Update spotter
    currentPlayer.points += 2;
    currentPlayer.totalContribution += 2;
    
    // Update spotted
    spotted.points += 3;
    spotted.totalContribution += 3;
    
    // Update in Firebase
    const updates = {};
    updates[`families/${gameState.familyCode}/players/${playerId}`] = {
        ...currentPlayer,
        points: currentPlayer.points,
        totalContribution: currentPlayer.totalContribution
    };
    updates[`families/${gameState.familyCode}/players/${spotted.id}`] = spotted;
    updates[`families/${gameState.familyCode}/totalPoints`] = (gameState.totalPoints || 0) + 5;
    
    database.ref().update(updates).then(() => {
        addLog(`${currentPlayer.name} spotted ${spotted.name}'s secret deed! +5 points`);
        addLiveActivity(`👀 ${currentPlayer.name} spotted ${spotted.name}'s kindness! +5`);
        showCelebration('Secret Deed!', `+5 family points!`, true, 5);
    });
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
    addLiveActivity(`🎲 Dua Dice rolled`);
    
    if (gameState.familyCode && Object.keys(gameState.players).length > 0) {
        // Add 1 point to every player
        const updates = {};
        let totalBonus = 0;
        
        Object.values(gameState.players).forEach(p => {
            const newPoints = (p.points || 0) + 1;
            const newContribution = (p.totalContribution || 0) + 1;
            updates[`families/${gameState.familyCode}/players/${p.id}/points`] = newPoints;
            updates[`families/${gameState.familyCode}/players/${p.id}/totalContribution`] = newContribution;
            totalBonus++;
            
            // Update local player if it's current user
            if (p.id === playerId && currentPlayer) {
                currentPlayer.points = newPoints;
                currentPlayer.totalContribution = newContribution;
            }
        });
        
        updates[`families/${gameState.familyCode}/totalPoints`] = (gameState.totalPoints || 0) + totalBonus;
        
        database.ref().update(updates);
    }
}

// Weekly Quest
function completeQuest() {
    if (!gameState.familyCode || !currentPlayer) {
        showCelebration('Error', 'Join a family first', false);
        return;
    }
    
    if (gameState.weeklyQuest > 4) {
        showCelebration('All Done!', 'You completed all quests!', true, 0);
        return;
    }
    
    if (Object.keys(gameState.players).length === 0) {
        showCelebration('No Players', 'Wait for others to join!', false);
        return;
    }
    
    const bonus = gameState.weeklyQuest * 5;
    const newQuest = Math.min(gameState.weeklyQuest + 1, 4);
    
    // Add bonus to every player
    const updates = {};
    let totalBonus = 0;
    
    Object.values(gameState.players).forEach(p => {
        const newPoints = (p.points || 0) + bonus;
        const newContribution = (p.totalContribution || 0) + bonus;
        updates[`families/${gameState.familyCode}/players/${p.id}/points`] = newPoints;
        updates[`families/${gameState.familyCode}/players/${p.id}/totalContribution`] = newContribution;
        totalBonus += bonus;
        
        // Update local player if it's current user
        if (p.id === playerId && currentPlayer) {
            currentPlayer.points = newPoints;
            currentPlayer.totalContribution = newContribution;
        }
    });
    
    updates[`families/${gameState.familyCode}/totalPoints`] = (gameState.totalPoints || 0) + totalBonus;
    updates[`families/${gameState.familyCode}/weeklyQuest`] = newQuest;
    
    database.ref().update(updates).then(() => {
        addLog(`Weekly Quest ${gameState.weeklyQuest} completed! +${bonus} each!`);
        addLiveActivity(`🏆 Weekly Quest completed! +${bonus} points each!`);
        showCelebration('Quest Complete!', `+${bonus} points each!`, true, bonus);
    });
}

// Goal Functions
function updateGoalDisplay() {
    document.getElementById('goalProgress').textContent = `${gameState.totalPoints} / 1100`;
    const percent = Math.min(Math.floor((gameState.totalPoints / 1100) * 100), 100);
    document.getElementById('goalProgressFill').style.width = percent + '%';
    document.getElementById('goalPercentage').textContent = percent + '%';
    
    if (!gameState.goalAchieved && gameState.totalPoints >= 1100) {
        document.getElementById('goalCelebration').style.display = 'block';
        
        // Update in Firebase
        if (gameState.familyCode) {
            database.ref(`families/${gameState.familyCode}/goalAchieved`).set(true);
        }
    }
    
    updateTreatsDisplay();
}

function updateTreatsDisplay() {
    const list = document.getElementById('treatList');
    const treats = Object.values(gameState.treats);
    document.getElementById('treatCount').textContent = treats.length;
    
    list.innerHTML = '';
    if (treats.length === 0) {
        list.innerHTML = '<div style="padding: 15px; text-align: center;">✨ Add your favorite treats! ✨</div>';
    } else {
        treats.forEach(treat => {
            const item = document.createElement('div');
            item.className = 'treat-item';
            item.innerHTML = `🎁 ${treat.name} <span style="color: #d4af37;">by ${treat.addedBy}</span>`;
            list.appendChild(item);
        });
    }
}

function addTreat() {
    if (!gameState.familyCode || !currentPlayer) {
        showCelebration('Error', 'Join a family first', false);
        return;
    }
    
    const input = document.getElementById('treatInput');
    const name = input.value.trim();
    
    if (!name) {
        showCelebration('Error', 'Please enter a treat', false);
        return;
    }
    
    const treat = {
        name: name,
        addedBy: currentPlayer.name,
        timestamp: Date.now()
    };
    
    database.ref(`families/${gameState.familyCode}/treats`).push(treat).then(() => {
        addLog(`Treat added: ${name}`);
        addLiveActivity(`🎁 ${currentPlayer.name} added a treat: ${name}`);
        showCelebration('Treat Added!', name, true, 0);
        input.value = '';
    });
}

function claimReward() {
    if (!gameState.familyCode || !currentPlayer) {
        showCelebration('Error', 'Join a family first', false);
        return;
    }
    
    if (!gameState.goalAchieved) {
        showCelebration('Not Yet!', 'Reach 1100 points first!', false);
        return;
    }
    
    const treats = Object.entries(gameState.treats);
    if (treats.length === 0) {
        showCelebration('No Treats', 'Add some treats first!', false);
        return;
    }
    
    const [treatKey, treat] = treats[Math.floor(Math.random() * treats.length)];
    
    // Remove treat and add points
    const updates = {};
    updates[`families/${gameState.familyCode}/treats/${treatKey}`] = null;
    updates[`families/${gameState.familyCode}/players/${playerId}/points`] = (currentPlayer.points || 0) + 10;
    updates[`families/${gameState.familyCode}/players/${playerId}/totalContribution`] = (currentPlayer.totalContribution || 0) + 10;
    updates[`families/${gameState.familyCode}/totalPoints`] = (gameState.totalPoints || 0) + 10;
    
    database.ref().update(updates).then(() => {
        currentPlayer.points += 10;
        currentPlayer.totalContribution += 10;
        
        addLog(`${currentPlayer.name} claimed the treat: ${treat.name}!`);
        addLiveActivity(`🎉 ${currentPlayer.name} claimed the treat: ${treat.name}!`);
        showCelebration('TREAT CLAIMED!', `🎁 ${treat.name} 🎁`, true, 10);
    });
}

// Check-In Functions
function morningCheckIn() {
    if (!gameState.familyCode || !currentPlayer) return;
    
    const today = `day${gameState.currentDay}`;
    
    database.ref(`families/${gameState.familyCode}/morningCheckIns/${today}`).once('value', (snapshot) => {
        let checkIns = snapshot.val() || [];
        
        if (checkIns.includes(currentPlayer.name)) {
            showCelebration('Already Checked In!', 'You already checked in today', false);
            return;
        }
        
        checkIns.push(currentPlayer.name);
        database.ref(`families/${gameState.familyCode}/morningCheckIns/${today}`).set(checkIns).then(() => {
            addLog(`${currentPlayer.name} checked in for Fajr`);
            addLiveActivity(`☀️ ${currentPlayer.name} checked in for Fajr`);
            showCelebration('Morning Check-In', 'Ramadan Mubarak! ☀️', false);
        });
    });
}

function eveningCheckIn() {
    if (!gameState.familyCode || !currentPlayer) return;
    
    const today = `day${gameState.currentDay}`;
    
    database.ref(`families/${gameState.familyCode}/eveningCheckIns/${today}`).once('value', (snapshot) => {
        let checkIns = snapshot.val() || [];
        
        if (checkIns.includes(currentPlayer.name)) {
            showCelebration('Already Checked In!', 'You already checked in today', false);
            return;
        }
        
        checkIns.push(currentPlayer.name);
        database.ref(`families/${gameState.familyCode}/eveningCheckIns/${today}`).set(checkIns).then(() => {
            addLog(`${currentPlayer.name} checked in for Maghrib`);
            addLiveActivity(`🌙 ${currentPlayer.name} checked in for Maghrib`);
            showCelebration('Evening Check-In', 'Iftar Mubarak! 🌙', false);
        });
    });
}

function saveReflection() {
    if (!gameState.familyCode || !currentPlayer) return;
    
    const input = document.getElementById('reflectionInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const reflection = {
        player: currentPlayer.name,
        day: gameState.currentDay,
        text: text,
        timestamp: Date.now()
    };
    
    database.ref(`families/${gameState.familyCode}/reflections`).push(reflection).then(() => {
        addLog(`${currentPlayer.name} shared a reflection`);
        addLiveActivity(`💭 ${currentPlayer.name} shared a reflection`);
        showCelebration('Reflection Saved', 'JazakAllah khair! 💚', false);
        input.value = '';
    });
}

function updateCheckInDisplay() {
    const today = `day${gameState.currentDay}`;
    
    const morning = gameState.morningCheckIns[today] || [];
    const evening = gameState.eveningCheckIns[today] || [];
    const players = Object.values(gameState.players);
    
    document.getElementById('morningCheckInCount').textContent = `${morning.length} / ${players.length}`;
    document.getElementById('eveningCheckInCount').textContent = `${evening.length} / ${players.length}`;
    
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
    
    const players = Object.values(gameState.players);
    
    if (players.length === 0) {
        list.innerHTML = '<div class="player"><div>✨ Awaiting Heroes ✨</div><div class="player-points">0</div></div>';
        return;
    }
    
    players.sort((a, b) => (b.points || 0) - (a.points || 0)).forEach(p => {
        const div = document.createElement('div');
        div.className = 'player';
        div.innerHTML = `
            <div>
                <strong>${p.name} ${p.id === playerId ? '(You)' : ''}</strong><br>
                <small>${CHARACTER_NAMES[p.character] || ''}</small>
            </div>
            <div class="player-points">${p.points || 0}</div>
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
    if (!gameState.familyCode) return;
    
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    const logEntry = `[${time}] ${message}`;
    
    database.ref(`families/${gameState.familyCode}/logs`).push({
        message: logEntry,
        timestamp: Date.now()
    });
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
        addLog(`Day ${gameState.currentDay} begins`);
        addLiveActivity(`🌙 Day ${gameState.currentDay} begins`);
        showCelebration('New Day', `Welcome to Day ${gameState.currentDay}`, true);
    } else {
        showCelebration('Complete!', 'Ramadan Mubarak! 🎉', true);
    }
}

function exportData() {
    if (!gameState.familyCode) return;
    
    database.ref(`families/${gameState.familyCode}`).once('value', (snapshot) => {
        const data = snapshot.val();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ramadan-quest-${gameState.familyCode}.json`;
        a.click();
        showCelebration('Saved!', 'Family data exported', true);
    });
}

function toggleHelp() {
    showCelebration('How to Play', 
        '1️⃣ Join/Create family\n2️⃣ Choose character\n3️⃣ Log daily worship\n4️⃣ Roll Dua Dice\n5️⃣ Complete quests\n\n🎯 Goal: 1100 points!\n\n👥 Family members now see each other in real-time!\n✅ Points sync automatically\n✅ Check-ins visible to all\n✅ Reflections shared with family',
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
