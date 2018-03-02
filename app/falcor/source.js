const {
  prop
} = require('ramda');
const {
  $atom
} = require('../utils/falcor');


module.exports = (repos) => ([
  {
    route: 'sources',
    get: () => ({
      path: ['sources'],
      value: $atom(repos.map(prop('name')))
    })
  }
]);
