/* eslint-disable class-methods-use-this */
import dbController from './dbController.js';
import logger from '../logger.js';

class ChellengesController {
  async getList (userId) {
    try {
      const stmt = dbController.prepare(`SELECT * FROM chellenges ORDER BY name `);
      const list = stmt.all();

      const stmt2 = dbController.prepare(`SELECT * FROM counter where userId = ?`);
      const counter = stmt2.all(userId);

      for (const countEntry of counter) {
        for (const item of list) {
          // eslint-disable-next-line eqeqeq
          if (countEntry.chellengeId === item.id && countEntry.userId == userId) {
            item.countDone = countEntry.count;
            const today = new Date().toISOString().split('T')[0];

            if (countEntry.datumHeute !== today) {
              item.countDatumHeute = 0;
              item.datumHeute = today;
            } else {
              item.countDatumHeute = countEntry.countDatumHeute;
              item.datumHeute = countEntry.datumHeute;
            }
          }
        }
      }

      return list;
    } catch (error) {
      logger.error('Fehler beim Abrufen der Chellenges:', error);

      throw new Error('Konnte keine Chellenges abrufen.');
    }
  }

  async setCount (counter) {
    try {
      const stmt = dbController.prepare(`SELECT * FROM counter where userId = ? and chellengeId = ?`);
      const count = stmt.get(counter.userId, counter.chellengeId);

      if (count) {
        dbController.prepare(`UPDATE counter SET count = ?, countDatumHeute = ?, datumHeute = ? WHERE userId = ? and chellengeId = ?`).run(counter.count, counter.countDatumHeute, counter.datumHeute, counter.userId, counter.chellengeId);
      } else {
        dbController.prepare(`INSERT INTO counter (userId, chellengeId, count, countDatumHeute, datumHeute) VALUES (?, ?, ?, ?, ?)`).run(counter.userId, counter.chellengeId, counter.count, counter.countDatumHeute, counter.datumHeute);
      }

      return true;
    } catch (error) {
      logger.error('Fehler beim Setzen des Counters:', error);

      throw new Error('Konnte den Counter nicht setzen.');
    }
  }

  async getCounter () {
    try {
      const stmt = dbController.prepare(`SELECT * FROM counter`);
      const counter = stmt.get();

      return counter;
    } catch (error) {
      logger.error('Fehler beim Abrufen der counter:', error);

      throw new Error('Konnte keine counter abrufen.');
    }
  }
}

export default new ChellengesController();
