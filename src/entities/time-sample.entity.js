import Entity from 'mostly-entity';

const TimeSampleEntity = new Entity('TimeSample');

TimeSampleEntity.discard('_id');

export default TimeSampleEntity.freeze();
