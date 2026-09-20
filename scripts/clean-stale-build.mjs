/**
 * `next build` y `next dev` escriben en el mismo `.next`, con formatos
 * distintos. Arrancar dev sobre los restos de un build deja el servidor
 * sirviendo 500 con "Cannot find module './xxx.js'", que no se parece en nada
 * a la causa.
 *
 * BUILD_ID solo lo escribe `next build`: si está, el directorio es de
 * producción y sobra. Corre como `predev`.
 */
import { existsSync, rmSync } from 'node:fs';

const DIST = '.next';

if (existsSync(`${DIST}/BUILD_ID`)) {
  rmSync(DIST, { recursive: true, force: true });
  console.log('Se limpió un build de producción en .next antes de arrancar dev.');
}
