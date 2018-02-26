const R = require('ramda');

/**
 * Convert falcor range to an array of equivalent indices
 */
exports.range2List = range => R.range(range.from, range.to + 1);

/**
 * Convert falcor range to SQL OFFSET and LIMIT values
 * NOTE: levelGraph limit is fundamentally broken: https://github.com/levelgraph/levelgraph/issues/79
 * https://github.com/levelgraph/levelgraph/commit/86847a41cc2659e25529147ed6eeb688b36a4257#commitcomment-6691590
 * limit will match expected semantics from SQL, and should be used in non levelGraph cases, e.g. takeExactly(db$, limit)
 * levelGraphLimit should be used with levelGraph
 */
exports.range2LimitOffset = range => ({ offset: range.from, limit: range.to + 1 - range.from, levelGraphLimit: range.to + 1 });

/**
 * Get subset of jsonGraphEnvelope, optionally excluding keys (ids, fields, or indices)
 */
exports.getGraphSubset = (graph, path, excludeKeys = []) => {
  return R.pickBy((val, key) => !R.contains(key, excludeKeys),
    R.path(path, graph)
  );
};

exports.atomMetadata = (dataType, lang) => {
  const meta = {};

  if (dataType && dataType !== 'xsd:string') {
    meta.$dataType = dataType;
  }

  if (lang && lang !== 'en') {
    meta.$lang = lang;
  }

  return meta;
};

exports.$atom = (value, meta = {}) => Object.assign(meta, { $type: 'atom', value });
exports.$ref = (value, meta = {}) => Object.assign(meta, { $type: 'ref', value });
exports.$error = (value, meta = {}) => Object.assign(meta, { $type: 'error', value });
