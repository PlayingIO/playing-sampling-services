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
    options = fp.assignAll(defaultOptions, options);
    super(options);
  }

  setup (app) {
    super.setup(app);
    this.hooks(defaultHooks(this.options));
  }

  async find (params) {
    assert(params.query.ids, 'query.ids is undefined');
    assert(params.query.type, 'query.type is not provided');
    
    const ids = fp.is(String, params.query.ids)
      ? fp.map(fp.trim, fp.split(',', params.query.ids))
      : params.query.ids;
    const counters = await this.Model.getSampleCounts(params.query.type, ids, params.query.start, params.query.end);
    debug('after getSampleCounts', counters);
    return counters;
  }

  async get (id, params) {
    assert(id, 'id is null');
    assert(params.query.type, 'query.type is not provided');

    const counters = await this.Model.getSampleCounts(params.query.type, [id], params.query.start, params.query.end);
    debug('after getSampleCounts', counters);
    return counters && counters.length > 0? counters[0] : null;
  }

  async create (data, params) {
    assert(data.type, 'type is not provided');
    assert(data.ids, 'ids is not provided');
    
    const ids = fp.is(String, data.ids)
      ? fp.map(fp.trim, fp.split(',', data.ids))
      : data.ids;
    const result = await this.Model.incrSampleCounts(data.type, ids);
    debug('after incrSampleCounts', result.nModified, result.nUpserted);
    return { modified: result.nModified, upserted: result.nUpserted };
  }

  async update (id, data, params) {
    throw new Error('Not allowed');
  }

  async patch (id, data, params) {
    throw new Error('Not allowed');
  }
}

export default function init (app, options, hooks) {
  options = { ModelName: 'time-sample', ...options };
  return createService(app, TimeSampleService, TimeSampleModel, options);
}

init.Service = TimeSampleService;
