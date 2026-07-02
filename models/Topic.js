const pool = require('../db');

class TopicInstance {
    constructor(row, comments = []) {
        this.id = row.id;
        this.title = row.title;
        this.content = row.content;
        this.kurs = row.kurs;
        this.seedKey = row.seed_key;
        this.seedAuthorName = row.seed_author_name;
        this.authorId = row.author_id;
        this.author = row.author_username
            ? { id: row.author_id, username: row.author_username }
            : null;
        this.comments = comments;
        this.createdAt = row.created_at;
    }

    async pushComment({ content, authorId = null }) {
        const { rows } = await pool.query(
            `INSERT INTO comments (topic_id, content, author_id) VALUES ($1, $2, $3) RETURNING *`,
            [this.id, content, authorId]
        );
        this.comments.push({
            id: rows[0].id,
            content: rows[0].content,
            authorId: rows[0].author_id,
            author: null,
            seedAuthorName: rows[0].seed_author_name,
            createdAt: rows[0].created_at
        });
    }

    async populateCommentAuthors() {
        const ids = this.comments.filter(c => c.authorId).map(c => c.authorId);
        if (!ids.length) return;

        const { rows } = await pool.query(
            `SELECT id, username FROM users WHERE id = ANY($1)`,
            [ids]
        );
        const byId = Object.fromEntries(rows.map(u => [u.id, u.username]));

        this.comments = this.comments.map(c => ({
            ...c,
            author: c.authorId ? { id: c.authorId, username: byId[c.authorId] } : null
        }));
    }
}

async function fetchCommentsByTopicIds(topicIds) {
    if (!topicIds.length) return {};
    const { rows } = await pool.query(
        `SELECT c.id, c.topic_id, c.content, c.author_id, c.seed_author_name, c.created_at,
                u.username AS author_username
         FROM comments c
         LEFT JOIN users u ON c.author_id = u.id
         WHERE c.topic_id = ANY($1)
         ORDER BY c.created_at ASC`,
        [topicIds]
    );
    const grouped = {};
    for (const row of rows) {
        if (!grouped[row.topic_id]) grouped[row.topic_id] = [];
        grouped[row.topic_id].push({
            id: row.id,
            content: row.content,
            authorId: row.author_id,
            author: row.author_username ? { id: row.author_id, username: row.author_username } : null,
            seedAuthorName: row.seed_author_name,
            createdAt: row.created_at
        });
    }
    return grouped;
}

const Topic = {
    async find({ kurs } = {}, { skip = 0, limit = 10 } = {}) {
        const params = [];
        let where = '';
        if (kurs) {
            params.push(kurs);
            where = `WHERE t.kurs = $${params.length}`;
        }
        params.push(limit, skip);
        const limitParam = params.length - 1;
        const offsetParam = params.length;

        const { rows } = await pool.query(
            `SELECT t.id, t.title, t.content, t.kurs, t.seed_key, t.seed_author_name,
                    t.author_id, t.created_at, u.username AS author_username
             FROM topics t
             LEFT JOIN users u ON t.author_id = u.id
             ${where}
             ORDER BY t.created_at DESC
             LIMIT $${limitParam} OFFSET $${offsetParam}`,
            params
        );

        const commentsMap = await fetchCommentsByTopicIds(rows.map(r => r.id));
        return rows.map(row => new TopicInstance(row, commentsMap[row.id] || []));
    },

    async count({ kurs } = {}) {
        const params = [];
        let where = '';
        if (kurs) {
            params.push(kurs);
            where = `WHERE kurs = $1`;
        }
        const { rows } = await pool.query(
            `SELECT COUNT(*) AS total FROM topics ${where}`,
            params
        );
        return parseInt(rows[0].total, 10);
    },

    async create({ title, content, kurs, authorId = null, seedKey = null, seedAuthorName = null }) {
        const { rows } = await pool.query(
            `INSERT INTO topics (title, content, kurs, author_id, seed_key, seed_author_name)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, title, content, kurs, seed_key, seed_author_name, author_id, created_at`,
            [title, content, kurs, authorId, seedKey, seedAuthorName]
        );
        return new TopicInstance(rows[0], []);
    },

    async findById(id) {
        const { rows } = await pool.query(
            `SELECT t.id, t.title, t.content, t.kurs, t.seed_key, t.seed_author_name,
                    t.author_id, t.created_at, u.username AS author_username
             FROM topics t
             LEFT JOIN users u ON t.author_id = u.id
             WHERE t.id = $1`,
            [id]
        );
        if (!rows[0]) return null;
        const commentsMap = await fetchCommentsByTopicIds([rows[0].id]);
        return new TopicInstance(rows[0], commentsMap[rows[0].id] || []);
    },

    async findOne({ seedKey } = {}) {
        const { rows } = await pool.query(
            `SELECT t.id, t.title, t.content, t.kurs, t.seed_key, t.seed_author_name,
                    t.author_id, t.created_at
             FROM topics t
             WHERE t.seed_key = $1`,
            [seedKey]
        );
        if (!rows[0]) return null;
        const commentsMap = await fetchCommentsByTopicIds([rows[0].id]);
        return new TopicInstance(rows[0], commentsMap[rows[0].id] || []);
    },

    async findByIdAndDelete(id) {
        await pool.query('DELETE FROM topics WHERE id = $1', [id]);
    },

    async deleteMany() {
        await pool.query('DELETE FROM topics');
    },

    async upsertSeed({ seedKey, title, content, kurs, seedAuthorName = null, comments = [] }) {
        const { rows: existing } = await pool.query(
            'SELECT id FROM topics WHERE seed_key = $1',
            [seedKey]
        );
        if (existing.length > 0) return;

        const { rows } = await pool.query(
            `INSERT INTO topics (title, content, kurs, seed_key, seed_author_name, author_id)
             VALUES ($1, $2, $3, $4, $5, NULL)
             RETURNING id`,
            [title, content, kurs, seedKey, seedAuthorName]
        );
        const topicId = rows[0].id;

        for (const c of comments) {
            await pool.query(
                `INSERT INTO comments (topic_id, content, author_id, seed_author_name)
                 VALUES ($1, $2, NULL, $3)`,
                [topicId, c.content, c.seedAuthorName || null]
            );
        }
    }
};

module.exports = Topic;
