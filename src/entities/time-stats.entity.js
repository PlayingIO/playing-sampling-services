const Entity = require('mostly-entity');

const TimeStatsEntity = new Entity('TimeStats');

TimeStatsEntity.discard('_id');

module.exports = TimeStatsEntity.freeze();
