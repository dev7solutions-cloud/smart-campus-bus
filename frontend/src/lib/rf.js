import model from '../data/rf_model.json'

export const modelInfo = { features: model.features, metrics: model.metrics }

function predictTree(tree, x) {
  let node = 0
  while (tree.l[node] !== -1) {
    node = x[tree.f[node]] <= tree.t[node] ? tree.l[node] : tree.r[node]
  }
  return tree.v[node]
}

/** Random Forest regression: average of all decision trees. */
export function predictDemand({ day, hour, stop, scheduled, absent = 0, examWeek = false }) {
  const x = [day, hour, stop, scheduled, absent, examWeek ? 1 : 0]
  const sum = model.trees.reduce((acc, tree) => acc + predictTree(tree, x), 0)
  return Math.max(0, sum / model.trees.length)
}
