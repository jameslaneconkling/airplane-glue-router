const { InverseFactory } = require('../model/inverse');
const {
  $ref
} = require('../utils/falcor');
require('rxjs/add/observable/of');
require('rxjs/add/operator/map');
require('rxjs/add/operator/mergeMap');


module.exports = (db, context) => {
  const Inverse = InverseFactory(db, context);

  return [
    {
      route: 'inverse[{keys:objects}][{keys:predicates}][{ranges:ranges}]',
      get({ objects, predicates, ranges }) {
        return Inverse.getTriples(objects, predicates, ranges)
          .map(({ object, predicate, subjectIdx, subject }) => {
            return {
              path: ['inverse', object, predicate, subjectIdx],
              value: typeof subject === 'undefined' ?
                null :
                $ref(['resource', subject])
            };
          });
      }
    },
    {
      route: 'inverse[{keys:objects}][{keys:predicates}]',
      get({ objects, predicates }) {
        return Inverse.getTriples(objects, predicates, [{ from: 0, to: 0 }])
          .map(({ object, predicate, subject }) => {
            return {
              path: ['inverse', object, predicate],
              value: typeof subject === 'undefined' ?
                null :
                $ref(['resource', subject])
            };
          });
      }
    }
  ];
};
