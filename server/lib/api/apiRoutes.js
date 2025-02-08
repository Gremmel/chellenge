import logger from '../logger.js';
import authMiddleware from '../middleware/authMiddleware.js';
import loginController from './loginController.js';
import sessionController from './sessionController.js';
import userController from './userController.js';
import challengesController from './challengesController.js';
import vereineController from './vereineController.js';

const apiRoutes = {
  init (app, config) {
    sessionController.init(config);

    // API-Routen
    app.post('/api/login', async (req, res) => {
      logger.fatal('/api/login req.body', req.body);
      const { username, password } = req.body;

      // Überprüfe Benutzername und Passwort
      const user = await loginController.loginUser(username, password);

      logger.fatal('api login user', user);

      if (user) {
        // session erzeugen
        const token = sessionController.addSession(user);

        // Setze das Token als HTTP-Only Cookie
        res.cookie('session_token', token, {
          httpOnly: true, // Cookie nicht durch JavaScript im Browser zugreifbar
          secure: true, // Setze dies auf true, wenn du HTTPS verwendest
          maxAge: 3600000, // Cookie-Lebensdauer (z.B. 1 Stunde)
          sameSite: 'strict' // Schützt vor CSRF-Angriffen
        });

        // Erfolgsnachricht senden
        res.json({ user });
      } else {
        // Falsche Zugangsdaten
        res.status(401).json({ message: 'Ungültiger Benutzername oder Passwort' });
      }
    });

    // Logout-Route (GET)
    app.get('/api/logout', (req, res) => {
      logger.info('/api/logout');
      const token = req.cookies.session_token;

      sessionController.removeSession(token);

      res.clearCookie('session_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict'
      });
      res.json({ message: 'Erfolgreich abgemeldet' });
    });

    // Logout-Route (GET)
    app.get('/api/getSession', (req, res) => {
      const token = req.cookies.session_token;

      logger.info('/api/getSession', token);

      if (token) {
        const session = sessionController.getSessionByToken(token);

        res.json({ user: session?.user });
      } else {
        res.json({ message: 'Keine session vorhanden' });
      }
    });

    // alle Vereine abrufen
    app.get('/api/getVereineList', authMiddleware.check('benutzer'), async (req, res) => {
      try {
        const vereineList = await vereineController.getVereine();

        res.json({ vereineList });
      } catch (error) {
        res.status(401).json({ message: error.message });
      }
    });

    app.post('/api/setUserVereinsId', authMiddleware.check('benutzer'), async (req, res) => {
      try {
        const io = await vereineController.setUserVereinsId(req.body.user);

        res.json({ io });
      } catch (error) {
        res.status(401).json({ message: error.message });
      }
    });

    // gibt die Benutzerliste zurück
    app.get('/api/getUserList', authMiddleware.check('admin'), (req, res) => {
      const token = req.cookies.session_token;

      logger.info('/api/getUserList', token);

      const users = userController.getUsers();

      if (token) {
        res.json({ users });
      } else {
        res.json({ message: 'Keine session vorhanden' });
      }
    });

    // legt einen neuen User an
    app.post('/api/adduser', authMiddleware.check('admin'), async (req, res) => {
      logger.fatal('/api/adduser req.body', req.body);

      // Neuen Benutzer anlegen
      const newUser = await userController.addUser(req.body);

      if (newUser) {
        // Erfolgsnachricht senden
        res.json({ newUser });
      } else {
        res.status(401).json({ message: 'Fehler beim anlegen des neuen Users' });
      }
    });

    // Benutzer ändern
    app.post('/api/updateUser', authMiddleware.check('admin'), async (req, res) => {
      logger.fatal('/api/updateUser req.body', req.body);

      // Benutzer ändern
      const result = await userController.updateUser(req.body);

      if (result) {
        // Erfolgsnachricht senden
        res.json({ result });
      } else {
        res.status(401).json({ message: 'Fehler beim ändern des Users' });
      }
    });

    // löscht einen User
    app.post('/api/deluser', authMiddleware.check('admin'), async (req, res) => {
      logger.fatal('/api/deluser req.body', req.body);

      // Benutzer löschen
      const delUser = await userController.delUser(req.body);

      if (delUser) {
        // Erfolgsnachricht senden
        res.json({ delUser: true });
      } else {
        // Fehler beim löschen
        res.status(401).json({ message: 'Fehler beim löschen des Users' });
      }
    });

    app.get('/api/getChallenges/:userId', authMiddleware.check('benutzer'), async (req, res) => {
      try {
        const list = await challengesController.getList(req.params.userId);

        res.json({ list });
      } catch (error) {
        res.status(401).json({ message: error.message });
      }
    });

    // abrufen der Daten aller Benutzer und challenges
    app.post('/api/deleteChallenge/:challengeId', authMiddleware.check('admin'), async (req, res) => {
      try {
        logger.fatal('/api/deleteChallenge req.params', req.params);
        const io = await challengesController.deleteChallenge(req.params.challengeId);

        res.json({ io });
      } catch (error) {
        res.status(501).json({ message: error.message });
      }
    });

    // abrufen der Daten aller Benutzer und challenges
    app.post('/api/addChallenge', authMiddleware.check('admin'), async (req, res) => {
      try {
        logger.fatal('/api/addChallenge', req.body);
        const io = await challengesController.addChallenge(req.body);

        res.json({ io });
      } catch (error) {
        res.status(501).json({ message: error.message });
      }
    });

    // setze counter
    app.post('/api/setCount', authMiddleware.check('benutzer'), async (req, res) => {
      logger.fatal('/api/setCount req.body', req.body);

      // Benutzer löschen
      const io = await challengesController.setCount(req.body);

      if (io) {
        // Erfolgsnachricht senden
        res.json({ io });
      } else {
        // Fehler beim löschen
        res.status(401).json({ message: 'setze Counter' });
      }
    });

    // abrufen der Daten aller Benutzer und challenges
    app.get('/api/getStatusData', authMiddleware.check('benutzer'), async (req, res) => {
      try {
        const challengeData = await challengesController.getStatusData(req.params.userId);

        res.json({ challengeData });
      } catch (error) {
        res.status(401).json({ message: error.message });
      }
    });
  }
};

export default apiRoutes;
