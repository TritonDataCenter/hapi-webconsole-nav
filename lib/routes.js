'use strict';

const Crypto = require('crypto');


module.exports = [
  {
    path: '/account',
    method: 'graphql',
    handler: async (request, h) => {
      const emailHash = Crypto.createHash('md5');
      const account = await request.plugins.cloudapi.fetch('');
      emailHash.update(account.email.toLowerCase());

      return {
        id: account.id,
        login: account.login,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        emailHash: emailHash.digest('hex'),
        services: request.options.accountServices
      };
    }
  },
  {
    path: '/datacenter',
    method: 'graphql',
    handler: (request, h) => {
      const dcName = request.options.dcName;

      let datacenter = null;
      for (const region of request.options.regions) {
        for (const dc of region.datacenters) {
          if (dc.name === dcName) {
            datacenter = dc;
            break;
          }
        }

        if (datacenter) {
          break;
        }
      }

      return datacenter;
    }
  },
  {
    path: '/regions',
    method: 'graphql',
    handler: (request, h) => {
      return request.options.regions;
    }
  },
  {
    path: '/categories',
    method: 'graphql',
    handler: (request, h) => {
      return request.options.categories;
    }
  },
  {
    path: '/service',
    method: 'graphql',
    handler: (request, h) => {
      return request.options.categories
        .reduce((sum, { services }) => {
          return sum.concat(services);
        }, [])
        .find((service) => {
          return service.slug === request.payload.slug;
        });
    }
  }
];
