import Entity from 'mostly-entity';

const TimeStatsEntity = new Entity('TimeStats');

TimeStatsEntity.discard('_id');

export default TimeStatsEntity.asImmutable();
