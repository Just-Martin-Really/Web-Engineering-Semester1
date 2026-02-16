const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).render('index', { title: 'Kursforum' });
});

router.get('/register', (req, res) => {
    res.status(200).render('registration', { title: 'Register' });
});

router.get('/forum', (req, res) => {
    res.status(200).render('forumpage', { title: 'Kursforum' });
});

router.get('/404', (req, res) => {
    res.status(404).render('404', { title: 'Seite nicht gefunden' });
});

module.exports = router;

