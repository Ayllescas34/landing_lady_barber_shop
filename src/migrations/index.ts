import * as migration_20261112_224215_initial from './20261112_224215_initial'
import * as migration_20261112_230000_seed_services from './20261112_230000_seed_services'

export const migrations = [
  {
    up: migration_20261112_224215_initial.up,
    down: migration_20261112_224215_initial.down,
    name: '20261112_224215_initial',
  },
  {
    up: migration_20261112_230000_seed_services.up,
    down: migration_20261112_230000_seed_services.down,
    name: '20261112_230000_seed_services',
  },
]
