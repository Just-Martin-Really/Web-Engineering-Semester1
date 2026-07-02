const fs = require('fs');
const path = require('path');

const {logger} = require('../utils/errorLogger');
const Topic = require('../models/Topic');

function parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') return defaultValue;
    return ['1', 'true', 'yes', 'y', 'on'].includes(String(value).trim().toLowerCase());
}

function getDefaultSeedFile() {
    return path.join(__dirname, 'topics.seed.json');
}

function loadSeedTopics(seedFilePath) {
    const raw = fs.readFileSync(seedFilePath, 'utf8');
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
        throw new Error('Seed file must be a JSON array');
    }

    return data;
}

async function upsertSeedTopic(topic) {
    if (!topic || typeof topic !== 'object') {
        throw new Error('Seed topic must be an object');
    }

    const {seedKey, title, content, kurs, seedAuthorName, seedComment} = topic;

    if (!seedKey || typeof seedKey !== 'string') {
        throw new Error('Seed topic is missing a valid seedKey');
    }

    if (!title || !content || !kurs) {
        throw new Error(`Seed topic '${seedKey}' must include title, content and kurs`);
    }

    const comments = (seedComment && typeof seedComment === 'object' && typeof seedComment.content === 'string')
        ? [{
            content: seedComment.content,
            seedAuthorName: typeof seedComment.seedAuthorName === 'string' ? seedComment.seedAuthorName.trim() : null
        }]
        : [];

    await Topic.upsertSeed({
        seedKey,
        title,
        content,
        kurs,
        seedAuthorName: typeof seedAuthorName === 'string' ? seedAuthorName.trim() : null,
        comments
    });
}

async function seedTopicsIfEnabled() {
    const enabled = parseBoolean(process.env.SEED_TOPICS, false);
    if (!enabled) return;

    const onlyOnEmpty = parseBoolean(process.env.SEED_TOPICS_ON_EMPTY_ONLY, true);

    try {
        if (onlyOnEmpty) {
            const count = await Topic.count();
            if (count > 0) {
                logger.info('Seed topics skipped (collection not empty)', {count});
                return;
            }
        }

        const seedFilePath = process.env.SEED_TOPICS_FILE || getDefaultSeedFile();
        const topics = loadSeedTopics(seedFilePath);

        const uniqueKeys = new Set();
        for (const t of topics) {
            if (t && typeof t.seedKey === 'string') {
                if (uniqueKeys.has(t.seedKey)) {
                    throw new Error(`Duplicate seedKey in seed file: '${t.seedKey}'`);
                }
                uniqueKeys.add(t.seedKey);
            }
        }

        for (const topic of topics) {
            await upsertSeedTopic(topic);
        }

        logger.info('Seed topics completed', {insertedOrExisting: topics.length, seedFilePath, onlyOnEmpty});
    } catch (err) {
        logger.error('Seed topics failed', {
            message: err.message,
            stack: err.stack,
            seedFilePath: process.env.SEED_TOPICS_FILE
        });
    }
}

module.exports = {
    seedTopicsIfEnabled
};
