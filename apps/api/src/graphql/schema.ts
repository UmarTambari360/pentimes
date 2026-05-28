import { builder } from './builder.js';
import './inputs.js';
import './resolvers/index.js';

export const schema = builder.toSchema();