import { hooks } from 'mostly-feathers-mongoose';
import TimeSampleEntity from '~/entities/time-sample-entity';

module.exports = function(options = {}) {
  return {
    before: {
      all: [
        hooks.authenticate('jwt', options)
      ],
      update: [
        hooks.discardFields('id', 'createdAt', 'updatedAt', 'destroyedAt')
      ],
      patch: [
        hooks.discardFields('id', 'createdAt', 'updatedAt', 'destroyedAt')
      ]
    },
    after: {
      all: [
        hooks.presentEntity(TimeSampleEntity, options),
        hooks.responder()
      ]
    }
  };
};