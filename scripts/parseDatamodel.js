const fs = require('fs')
const path = require('path')

const { getDMMF } = require('@prisma/sdk')
const { getPaths } = require('@redwoodjs/internal')

const DATAMODEL_PATH = path.join(getPaths().generated.base, 'datamodel.json')

getDMMF({ datamodelPath: getPaths().api.dbSchema }).then((schema) => {
  fs.writeFileSync(DATAMODEL_PATH, JSON.stringify(schema.datamodel, null, 2))
  console.info(`Wrote ${DATAMODEL_PATH}`)
})
