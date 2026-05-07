const crypto = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, salt, storedKey] = storedHash.split('$');

  if (algorithm !== 'scrypt' || !salt || !storedKey) {
    return password === storedHash;
  }

  const derivedKey = await scryptAsync(password, salt, 64);
  const storedBuffer = Buffer.from(storedKey, 'hex');

  return storedBuffer.length === derivedKey.length && crypto.timingSafeEqual(storedBuffer, derivedKey);
}

function isHashedPassword(passwordHash) {
  return passwordHash?.startsWith('scrypt$');
}

module.exports = {
  hashPassword,
  isHashedPassword,
  verifyPassword,
};
