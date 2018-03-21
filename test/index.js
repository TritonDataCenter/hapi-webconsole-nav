'use strict';

const Fs = require('fs');
const Path = require('path');
const { expect } = require('code');
const { graphql } = require('graphi');
const Hapi = require('hapi');
const Lab = require('lab');
const Navigation = require('../');
const schema = Fs.readFileSync(Path.join(__dirname, '../lib/schema.graphql'));

const lab = exports.lab = Lab.script();
const { describe, it } = lab;

const register = {
  plugin: Navigation,
  options: {
    datacenters: [
      {
        name: 'development',
        url: 'http://localhost'
      }
    ],
    categories: [
      {
        name: 'Compute',
        slug: 'compute',
        services: [
          {
            name: 'VMs & Containers',
            slug: 'vms_containers',
            description: 'Run VMs and bare metal containers',
            url: '/instaces',
            tags: []
          }
        ]
      },
      {
        name: 'Help & Support',
        slug: 'help_support',
        services: [
          {
            name: 'Service Status',
            slug: 'service_status',
            description: 'Find out about the status of our services',
            url: '/status',
            tags: []
          }
        ]
      }
    ]
  }
};

describe('Navigation', () => {
  it('can be registered with hapi', async () => {
    const server = new Hapi.Server();
    await server.register(register);
  });

  it('has a resolver for every query and mutation in the schema', async () => {
    const fields = [];
    const parsed = graphql.parse(schema.toString());
    for (const def of parsed.definitions) {
      if (def.kind !== 'ObjectTypeDefinition' || (def.name.value !== 'Query' && def.name.value !== 'Mutation')) {
        continue;
      }

      for (const field of def.fields) {
        fields.push(field.name.value);
      }
    }

    const server = new Hapi.Server();
    await server.register(register);
    await server.initialize();
    const paths = server.table().map((route) => {
      return route.path.substr(1);
    });

    for (const field of fields) {
      expect(paths).to.contain(field);
    }
  });

  it('can retrieve a list of datacenters', async () => {
    const server = new Hapi.Server();
    await server.register(register);
    await server.initialize();

    const res = await server.inject({ url: '/graphql', method: 'post', payload: { query: 'query { datacenters { name url } }' } });
    expect(res.result.data.datacenters[0].name).to.equal(register.options.datacenters[0].name);
    await server.stop();
  });

  it('can retrieve a list of categories', async () => {
    const server = new Hapi.Server();
    await server.register(register);
    await server.initialize();

    const res = await server.inject({ url: '/graphql', method: 'post', payload: { query: 'query { categories { name } }' } });
    expect(res.result.data.categories[0].name).to.equal(register.options.categories[0].name);
    await server.stop();
  });

  it('can retrieve a service', async () => {
    const server = new Hapi.Server();
    await server.register(register);
    await server.initialize();

    const res = await server.inject({ url: '/graphql', method: 'post', payload: { query: 'query { service(slug: "help_support") { name } }' } });
    expect(res.result.data.service.name).to.equal('Help & Support');
    await server.stop();
  });
});
