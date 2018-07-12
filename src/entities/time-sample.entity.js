const Entity = require('mostly-entity');

const TimeSampleEntity = new Entity('TimeSample');

TimeSampleEntity.discard('_id');

module.exports = TimeSampleEntity.freeze();
