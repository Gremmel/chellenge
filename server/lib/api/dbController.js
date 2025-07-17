/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
// db.mjs
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../logger.js';

// Bestimme das Root-Verzeichnis des Projekts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseController {
  constructor (dbPath) {
    this.db = new Database(dbPath, { verbose: console.log });
    this.ensureChallengeColumns();
    logger.info('Datenbankverbindung hergestellt und Spalten überprüft.');
  }

  /**
   * Prüft, ob die gewünschten Spalten in der Tabelle challenges existieren und fügt sie ggf. hinzu.
   */
  ensureChallengeColumns () {
    const columnsToAdd = [
      { name: 'challengeTyp', type: 'INTEGER' },
      { name: 'countBeginn', type: 'INTEGER' },
      { name: 'countAdd', type: 'INTEGER' },
      { name: 'countIntervall', type: 'INTEGER' }
    ];

    // Hole die existierenden Spaltennamen
    const pragma = this.db.prepare('PRAGMA table_info(challenges)').all();
    const existingColumns = pragma.map((col) => col.name);

    columnsToAdd.forEach((col) => {
      if (!existingColumns.includes(col.name)) {
        const sql = `ALTER TABLE challenges ADD COLUMN ${col.name} ${col.type}`;

        this.db.prepare(sql).run();
        logger.info(`Spalte '${col.name}' zur Tabelle 'challenges' hinzugefügt.`);
      }
    });
  }

  prepare (query) {
    return this.db.prepare(query);
  }

  close () {
    this.db.close();
  }
}

const dbPath = path.join(__dirname, '..', '..', '..', 'extern', 'datenbank.db');
const dbController = new DatabaseController(dbPath);

export default dbController;
