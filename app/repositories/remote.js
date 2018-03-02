module.exports = ({ baseurl, context }) => {
  return {
    getTriples: (subjects, predicates, ranges) => {},
    // TODO - getTriples should do this by default?
    getPredicateCount: (subjects, predicates) => {},
    getOntologiesForSubjecs: (subjects, ranges) => {},
    getSearch: (search, ranges) => {},
    getSearchCounts: (searches) => {},
    getTypes: () => {},
    getPredicatesForType: (type) => {},
    // getInverseTriples?  // not needed if entire ontology is in memory
  };
};
