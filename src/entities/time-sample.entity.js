import Entity from 'mostly-entity';

const TimeSampleEntity = new Entity('TimeSample');

TimeSampleEntity.excepts('_id');

export default TimeSampleEntity.asImmutable();
