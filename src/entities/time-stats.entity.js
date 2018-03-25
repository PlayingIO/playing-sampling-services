import Entity from 'mostly-entity';

const TimeStatsEntity = new Entity('TimeStats');

TimeStatsEntity.excepts('createdAt', 'updatedAt', 'destroyedAt');

export default TimeStatsEntity.asImmutable();
