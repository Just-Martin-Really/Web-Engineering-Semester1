const { expect } = require('chai');

const Topic = require('../models/Topic');
const { seedTopicsIfEnabled } = require('../seeds/seedTopics');

describe('Seeding (seedAuthorName)', function () {
  this.timeout(20000);

  beforeEach(async () => {
    await Topic.deleteMany();
  });

  it('should persist seedAuthorName into seeded topics', async () => {
    process.env.SEED_TOPICS = 'true';
    process.env.SEED_TOPICS_ON_EMPTY_ONLY = 'true';

    await seedTopicsIfEnabled();

    const topic = await Topic.findOne({ seedKey: 'demo1' });
    expect(topic).to.not.equal(null);
    expect(topic.seedAuthorName).to.equal('Amica');

    expect(topic.author).to.equal(null);

    expect(topic.comments).to.be.an('array');
    expect(topic.comments.length).to.equal(1);
    expect(topic.comments[0].seedAuthorName).to.equal('Janis');
    expect(topic.comments[0].content).to.equal('Ich dachte du rauchst nicht mehr? :D');
  });

  after(() => {
    delete process.env.SEED_TOPICS;
    delete process.env.SEED_TOPICS_ON_EMPTY_ONLY;
    delete process.env.SEED_TOPICS_FILE;
  });
});
