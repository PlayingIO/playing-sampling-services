import _ from 'lodash';
import assert from 'assert';
import fp from 'mostly-func';
import moment from 'moment';
import { Types } from 'mongoose';
import { plugins } from 'mostly-feathers-mongoose';

const options = {
  timestamps: true
};

// time sampling records according to mongoid hash
const fields = {
  type: { type: String, required: true },   // sampling type
  bucket: { type: String, required: true }, // bucket of mongoid
  daystamp: { type: Date }, // record by day, null for all days
  values: { type: 'Mixed', required: true } // counter for every hour
  // e.g. { <sampleId>: { total: 99, values: { 0: 99, 1: 99, ... 23: 99 } } }
};

// use timestamp in mongoid as a bucket key
const getSampleBucket = function (sampleId) {
  if (!sampleId.getTimestamp) {
    sampleId = Types.ObjectId(sampleId);
  }
  return moment(sampleId.getTimestamp()).startOf('day').toISOString();
};

const getSampleCounts = (mongoose, model) => (sampleType, sampleIds, startDate, endDate) => {
  if (!Array.isArray(sampleIds)) sampleIds = [sampleIds];

  const TimeSample = mongoose.model(model);
  const sampleBuckets = fp.uniq(fp.map(getSampleBucket, sampleIds));

  let query = TimeSample.find({
    type: sampleType,
    bucket: { $in: sampleBuckets }
  });
  // total or a timespan
  if (startDate) {
    startDate = moment(startDate).startOf('day');
  }
  if (endDate) {
    endDate = moment(endDate).startOf('day');
  }
  if (startDate && endDate) {
    query.where({ daystamp: { $gte: startDate, $lte: endDate } });
  } else if (startDate) {
    query.where({ daystamp: { $gte: startDate } });
  } else if (endDate) {
    query.where({ daystamp: { $lte: endDate } });
  } else {
    query.where({ daystamp: null });
  }

  return query.lean().then((result) => {
    return fp.reduce((counters, item) => {
      if (item.type && item.values) {
        fp.reduce((counter, key) => {
          counter[key] = counter[key] || {};
          counter[key][item.type] = counter[key][item.type] || 0;
          counter[key][item.type] += item.values[key].total;
          return counter;
        }, counters, Object.keys(item.values));
      }
      return counters;
    }, {}, result);

  });
};

const getTopCounts = (mongoose, model) => (sampleType, limit, startBucketDate, endBucketDate, startDate, endDate) => {
  const TimeSample = mongoose.model(model);

  let query = TimeSample.find({ type: sampleType });
  // filter by bucket scope
  if (startBucketDate && endBucketDate) {
    query.where({ bucket: { $gte: startBucketDate, $lte: endBucketDate } });
  }
  // total or a timespan
  if (startDate && endDate) {
    query.where({ daystamp: { $gte: startDate, $lte: endDate } });
  } else {
    query.where({ daystamp: null });
  }

  return query.lean().then((result) => {
    let topCounters = fp.reduce((counters, item) => {
      if (item.type && item.values) {
        fp.reduce((counter, value, key) => {
          counter[key] = counter[key] || {};
          counter[key].id = key;
          counter[key].counter = counter[key].counter || 0;
          counter[key].counter += value.total || 0;
          return counter;
        }, counters, item.values);
      }
      return counters;
    }, {}, result);
    return fp.sortBy(o => o.counter * -1, topCounters).slice(0, limit);
  });
};

// add sample counters
const incrSampleCounts = (mongoose, model) => (sampleType, sampleIds, count) => {
  if (!Array.isArray(sampleIds)) sampleIds = [sampleIds];
  count = count || 1;

  const TimeSample = mongoose.model(model);
  return new Promise((resolve, reject) => {
    const timestamp = moment();
    const hour = timestamp.hour();
    const daystamp = timestamp.startOf('day').toDate();
    // bulk with unordered to increase performance
    const bulk = TimeSample.collection.initializeUnorderedBulkOp();
    sampleIds.forEach(sampleId => {
      const sampleBucket = getSampleBucket(sampleId);
      // total statistics
      bulk.find({
        daystamp: null,
        type: sampleType,
        bucket: sampleBucket
      }).upsert().updateOne({
        $inc: {
          ['values.' + sampleId + '.total']: count,
          ['values.' + sampleId + '.values.' + hour]: count
        }
      });
      // per day/hour statistics
      bulk.find({
        daystamp: daystamp,
        type: sampleType,
        bucket: sampleBucket
      }).upsert().updateOne({
        $inc: {
          ['values.' + sampleId + '.total']: count,
          ['values.' + sampleId + '.values.' + hour]: count
        }
      });
    });
    bulk.execute((err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });
  });
};

// assoc counters to items in list
const assocSampleCounts = (mongoose, model) => (list, sampleType, numField, startDate, endDate) => {
  assert(list && list.length &&list[0].id, 'invalid assocSampleCounts list');

  const TimeSample = mongoose.model(model);
  return new Promise((resolve, reject) => {
    const sampleIds = fp.map(fp.prop('id'), list);
    const itemsById = fp.groupBy(fp.prop('id'), list);
    if (sampleIds.length > 0) {
      TimeSample.getSampleCounts(sampleType, sampleIds, startDate, endDate)
      .then((counters) => {
        //debug('assocSampleCounts', counters);
        const data = fp.map((counter, id) => {
          const item = itemsById[id];
          if (item && item[0]) {
            fp.assoc(numField, counter[sampleType] || 0, item[0]);
          }
        }, counters);
        resolve(data);
      }).catch(reject);
    } else {
      resolve(list);
    }
  });
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.index({ type: 1, bucket: 1, daystamp: 1 });

  schema.statics.getSampleCounts = getSampleCounts(mongoose, name);
  schema.statics.getTopCounts = getTopCounts(mongoose, name);
  schema.statics.incrSampleCounts = incrSampleCounts(mongoose, name);
  schema.statics.assocSampleCounts = assocSampleCounts(mongoose, name);

  return mongoose.model(name, schema);
}

model.schema = fields;