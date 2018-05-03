import assert from 'assert';
import makeDebug from 'debug';
import { Service, createService } from 'mostly-feathers-mongoose';
import fp from 'mostly-func';

import TimeSampleModel from '../../models/time-sample.model';
import defaultHooks from './time-sample.hooks';

const debug = makeDebug('playing:sampling-services:time-samples');

const defaultOptions = {
  name: 'time-samples'
};

class TimeSampleService extends Service {
  constructor (options) {
    options = fp.assign(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  find (params) {
    assert(params.query.ids, 'params.query.ids is undefined');
    assert(params.query.type, 'params.query.type is not provided');
    
    const ids = fp.is(String, params.query.ids)
      ? fp.map(fp.trim, fp.split(',', params.query.ids))
      : params.query.ids;
    return this.Model.getSampleCounts(params.query.type, ids, params.query.start, params.query.end).then((counters) => {
      debug('after getSampleCounts', counters);
      return counters;
    });
  }

  get (id, params) {
    assert(id, 'id is null');
    assert(params.query.type, 'params.query.type is not provided');

    return this.Model.getSampleCounts(params.query.type, [id], params.query.start, params.query.end).then((counters) => {
      debug('after getSampleCounts', counters);
      return counters && counters.length > 0? counters[0] : null;
    });
  }

  create (data, params) {
    assert(data.type, 'data.type is not provided');
    assert(data.ids, 'data.ids is not provided');
    
    const ids = fp.is(String, data.ids)
      ? fp.map(fp.trim, fp.split(',', data.ids))
      : data.ids;
    return this.Model.incrSampleCounts(data.type, ids).then((result) => {
      debug('after incrSampleCounts', result.nModified, result.nUpserted);
      return { modified: result.nModified, upserted: result.nUpserted };
    });
  }

  update (id, data, params) {
    throw new Error('Not allowed');
  }

  patch (id, data, params) {
    throw new Error('Not allowed');
  }
}

export default function init (app, options, hooks) {
  options = fp.assign({ ModelName: 'time-sample' }, options);
  return createService(app, TimeSampleService, TimeSampleModel, options);
}

init.Service = TimeSampleService;
