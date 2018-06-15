import Entity from 'mostly-entity';

const TimeStatsEntity = new Entity('TimeStats');

TimeStatsEntity.excepts('_id');

export default TimeStatsEntity.asImmutable();
