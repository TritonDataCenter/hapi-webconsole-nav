'use strict';

const Fs = require('fs');
const Path = require('path');
const Graphi = require('graphi');
const Package = require('../package.json');
const Routes = require('./routes');

const Schema = Fs.readFileSync(Path.join(__dirname, '/schema.graphql')).toString();


const register = async (server, options = { datacenters: [], categories: [] }) => {
  server.decorate('request', 'options', options);
  server.route(Routes);

  const schema = Graphi.makeExecutableSchema({ schema: Schema });

  const graphiOptions = {
    schema,
    authStrategy: options.authStrategy
  };

  await server.register({ plugin: Graphi, options: graphiOptions });
};

module.exports = {
  pkg: Package,
  register
};
