const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const dataDir = path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function getFilePath(collection) {
  return path.join(dataDir, `${collection}.json`);
}

function read(collection) {
  const file = getFilePath(collection);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '[]', 'utf8');
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function write(collection, data) {
  fs.writeFileSync(getFilePath(collection), JSON.stringify(data, null, 2), 'utf8');
}

function findAll(collection) {
  return read(collection).slice().reverse();
}

function findById(collection, id) {
  return read(collection).find((r) => r._id === id) || null;
}

function create(collection, payload) {
  const rows = read(collection);
  const row = { _id: randomUUID(), ...payload, createdAt: new Date().toISOString() };
  rows.push(row);
  write(collection, rows);
  return row;
}

function updateById(collection, id, payload) {
  const rows = read(collection);
  const idx = rows.findIndex((r) => r._id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...payload, updatedAt: new Date().toISOString() };
  write(collection, rows);
  return rows[idx];
}

function deleteById(collection, id) {
  const rows = read(collection);
  const idx = rows.findIndex((r) => r._id === id);
  if (idx === -1) return null;
  const deleted = rows.splice(idx, 1)[0];
  write(collection, rows);
  return deleted;
}

module.exports = { read, write, findAll, findById, create, updateById, deleteById };
