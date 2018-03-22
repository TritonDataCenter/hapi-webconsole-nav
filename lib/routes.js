'use strict';


module.exports = [
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
