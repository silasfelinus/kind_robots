// /types/mariadb-pool.d.ts
import 'mariadb'

declare module 'mariadb' {
  interface PoolConfig {
    /**
     * Maximum time in milliseconds for validating an idle pooled connection.
     * MariaDB Connector/Node.js 3.5.2 supports this runtime option, but its
     * published PoolConfig declaration does not currently expose it.
     */
    pingTimeout?: number
  }
}
