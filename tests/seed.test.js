const { expect } = require('chai');

const Topic = require('../models/Topic');
const { seedTopicsIfEnabled } = require('../seeds/seedTopics');

describe('Seeding (demo data)', function () {
  this.timeout(20000);

  beforeEach(async () => {
    await Topic.deleteMany({});
  });

  it('should insert seed topics once when enabled and collection empty', async () => {
    process.env.SEED_TOPICS = 'true';
    process.env.SEED_TOPICS_ON_EMPTY_ONLY = 'true';

    await seedTopicsIfEnabled();

    const count = await Topic.countDocuments();
    expect(count).to.equal(9);

    const hasSeedKey = await Topic.findOne({ seedKey: 'demo1' }).lean();
    expect(hasSeedKey).to.not.equal(null);
  });

  it('should be idempotent (no duplicates) when run multiple times', async () => {
    process.env.SEED_TOPICS = 'true';
    process.env.SEED_TOPICS_ON_EMPTY_ONLY = 'false';

    await seedTopicsIfEnabled();
    await seedTopicsIfEnabled();

    const count2 = await Topic.countDocuments();
    expect(count2).to.equal(9);
  });

  after(() => {
    delete process.env.SEED_TOPICS;
    delete process.env.SEED_TOPICS_ON_EMPTY_ONLY;
    delete process.env.SEED_TOPICS_FILE;
  });
});
