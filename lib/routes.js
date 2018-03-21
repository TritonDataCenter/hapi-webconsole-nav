'use strict';


module.exports = [
  {
    path: '/datacenters',
    method: 'graphql',
    handler: (request, h) => {
      return request.options.datacenters;
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
        .reduce((sum, services) => {
          return sum.concat(services);
        }, [])
        .find((service) => {
          return service.slug === request.payload.slug;
        });
    }
  }
];
