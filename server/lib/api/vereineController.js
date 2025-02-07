/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import dbController from './dbController.js';
import logger from '../logger.js';

class VereineController {
  getVereine () {
    try {
      const stmt = dbController.prepare(`SELECT * FROM verein ORDER BY name `);
      const vereine = stmt.all();

      return vereine;
    } catch (error) {
      logger.error('Fehler beim Abrufen der Vereine:', error);

      throw new Error('Konnte keine Vereine abrufen.');
    }
  }

  setUserVereinsId (user) {
    try {
      logger.warn(' user', user);
      const { id, verein_id } = user;

      let stmt = dbController.prepare(`
        UPDATE user_verein
        SET verein_id = ?
        WHERE user_id = ?
      `);
      const result = stmt.run(verein_id, id);

      if (result.changes === 0) {
        stmt = dbController.prepare(`
          INSERT INTO user_verein (user_id, verein_id)
          VALUES (?, ?)
        `);
        stmt.run(id, verein_id);
      }

      return true;
    } catch (error) {
      logger.error('Fehler beim Abrufen der Vereine:', error);

      throw new Error('Konnte keine Vereine abrufen.');
    }
  }
}

export default new VereineController();
