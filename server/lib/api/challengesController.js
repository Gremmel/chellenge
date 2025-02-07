/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
import dbController from './dbController.js';
import logger from '../logger.js';
import userController from './userController.js';

class ChallengesController {
  async getList (userId) {
    try {
      const stmt = dbController.prepare(`SELECT * FROM challenges ORDER BY name `);
      const list = stmt.all();

      const stmt2 = dbController.prepare(`SELECT * FROM counter where userId = ?`);
      const counter = stmt2.all(userId);
      const today = new Date().toISOString().split('T')[0];

      for (const countEntry of counter) {
        for (const item of list) {
          // eslint-disable-next-line eqeqeq
          if (countEntry.challengeId === item.id && countEntry.userId == userId) {
            item.countDone = countEntry.count;

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

      for (const item of list) {
        if (!item.countDatumHeute) {
          item.countDatumHeute = 0;
          item.datumHeute = today;
        }
      }

      return list;
    } catch (error) {
      logger.error('Fehler beim Abrufen der Challenges:', error);

      throw new Error('Konnte keine Challenges abrufen.');
    }
  }

  async setCount (counter) {
    try {
      const stmt = dbController.prepare(`SELECT * FROM counter where userId = ? and challengeId = ?`);
      const count = stmt.get(counter.userId, counter.challengeId);

      if (count) {
        dbController.prepare(`UPDATE counter SET count = ?, countDatumHeute = ?, datumHeute = ? WHERE userId = ? and challengeId = ?`).run(counter.count, counter.countDatumHeute, counter.datumHeute, counter.userId, counter.challengeId);
      } else {
        dbController.prepare(`INSERT INTO counter (userId, challengeId, count, countDatumHeute, datumHeute) VALUES (?, ?, ?, ?, ?)`).run(counter.userId, counter.challengeId, counter.count, counter.countDatumHeute, counter.datumHeute);
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

  // abrufen der Daten aller Benutzer und challenges
  async getStatusData () {
    // alle challenges abrufen
    const stmt = dbController.prepare(`SELECT * FROM challenges ORDER BY name `);
    const challangesList = stmt.all();

    const result = [];

    logger.fatal('challangesList', challangesList);

    // challangesList [
    //   {
    //     id: 1,
    //     name: 'liegestütz',
    //     count: 500,
    //     startDatum: '2025-02-01 00:00:00',
    //     endDatum: '2025-02-28 00:00:00'
    //   }
    // ];

    // alle Benutzer abrufen
    const userList = userController.getUsers();

    logger.warn('userList', userList);

    // userList [
    //   {
    //     id: 14,
    //     username: 'Gremmel',
    //     email: 'mc@soseies.de',
    //     enabled: '1',
    //     roles: '["admin","benutzer"]',
    //     verein_id: 1,
    //     verein_name: 'Team 1',
    //     verein_logo: ''
    //   }
    // };

    // alle counter abrufen
    const stmt2 = dbController.prepare(`SELECT * FROM counter`);
    const counterList = stmt2.all();

    logger.info('counterList', counterList);

    // counterList [
    //   {
    //     userId: 14,
    //     challengeId: 1,
    //     count: 91,
    //     countDatumHeute: 24,
    //     datumHeute: '2025-02-07'
    //   }
    // ]

    for (const challenge of challangesList) {
      const challengeData = {
        id: challenge.id,
        name: challenge.name,
        count: challenge.count,
        startDatum: challenge.startDatum,
        endDatum: challenge.endDatum,
        users: []
      };

      for (const user of userList) {
        const userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          enabled: user.enabled,
          roles: user.roles,
          verein_id: user.verein_id,
          verein_name: user.verein_name,
          verein_logo: user.verein_logo,
          count: 0,
          countDatumHeute: 0
        };

        for (const counter of counterList) {
          if (counter.userId === user.id && counter.challengeId === challenge.id) {
            userData.count = counter.count;
            userData.countDatumHeute = counter.countDatumHeute;
          }
        }

        challengeData.users.push(userData);
      }

      result.push(challengeData);
    }

    return result;
  }
}

export default new ChallengesController();
