import Entity from 'mostly-entity';

const TimeSampleEntity = new Entity('TimeSample');

TimeSampleEntity.excepts('createdAt', 'updatedAt', 'destroyedAt');

export default TimeSampleEntity.asImmutable();
