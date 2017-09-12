import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';

// time statistics according to mongoid hash
const fields = {
  type: { type: 'String', required: true },      // sample type
  daystamp: { type: 'Date' },                    // record by day
  conditions: { type: 'Mixed', required: true }, // conditions of sampling
  values: { type: 'Mixed', required: true }      // values of sampling
};

export default function(app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields);
  schema.plugin(timestamps);
  schema.index({ type: 1, daystamp: 1 });
  return mongoose.model(name, schema);
}