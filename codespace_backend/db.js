const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'users_db.json');

// Session store in-memory (tokens map to user IDs)
const sessions = new Map();

// Load the JSON database state
function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { users: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error("Error reading users database, resetting file:", err);
    return { users: [] };
  }
}

// Save database state
function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing users database:", err);
  }
}

// Hash password helper using Node crypto scrypt
function hashPassword(password, salt) {
  const hash = crypto.scryptSync(password, salt, 64);
  return hash.toString('hex');
}

// Register User
function registerUser(username, password) {
  const data = loadDb();
  
  // Check if user exists
  const exists = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    throw new Error("Username is already taken");
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const userId = crypto.randomUUID();

  const newUser = {
    id: userId,
    username,
    passwordHash,
    salt,
    fantasyState: {
      roster: [],
      budget: 100.0,
      transfersMade: 0,
      totalPoints: 0,
      pointsHistory: []
    }
  };

  data.users.push(newUser);
  saveDb(data);

  // Auto create session
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, userId);

  return { token, user: { id: userId, username, fantasyState: newUser.fantasyState } };
}

// Login User
function loginUser(username, password) {
  const data = loadDb();
  
  const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    throw new Error("Invalid username or password");
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    throw new Error("Invalid username or password");
  }

  // Create session
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, user.id);

  return { token, user: { id: user.id, username: user.username, fantasyState: user.fantasyState } };
}

// Get User by Session Token
function getUserByToken(token) {
  const userId = sessions.get(token);
  if (!userId) return null;

  const data = loadDb();
  const user = data.users.find(u => u.id === userId);
  if (!user) return null;

  return { id: user.id, username: user.username, fantasyState: user.fantasyState };
}

// Update User Fantasy State
function updateFantasyState(token, fantasyState) {
  const userId = sessions.get(token);
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const data = loadDb();
  const userIdx = data.users.findIndex(u => u.id === userId);
  if (userIdx === -1) {
    throw new Error("User not found");
  }

  // Preserve values or overwrite securely
  data.users[userIdx].fantasyState = {
    roster: fantasyState.roster || [],
    budget: typeof fantasyState.budget === 'number' ? fantasyState.budget : 100.0,
    transfersMade: typeof fantasyState.transfersMade === 'number' ? fantasyState.transfersMade : 0,
    totalPoints: typeof fantasyState.totalPoints === 'number' ? fantasyState.totalPoints : 0,
    pointsHistory: fantasyState.pointsHistory || []
  };

  saveDb(data);
  return data.users[userIdx].fantasyState;
}

module.exports = {
  registerUser,
  loginUser,
  getUserByToken,
  updateFantasyState
};
