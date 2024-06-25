/* @file Cleanup trash items
 * @arg 0 {number} - If non-zero, cleanup PPXNNN.TMP directories
 */

import fso from '@ppmdev/modules/filesystem.ts';
import {tmp} from '@ppmdev/modules/data.ts';
import {langCleanup} from './mod/language.ts';
import {safeArgs} from '@ppmdev/modules/argument.ts';
import {uselang, ppmin as ppm} from './mod/core.ts';
import {ignoreValidTempDir} from './mod/core.ts';
import debug from '@ppmdev/modules/debug.ts';

const lang = langCleanup[uselang];

const main = () => {
  const [cleanPPxTmp] = safeArgs(false);

  const trashListPath = PPx.Extract("%sgu'ppmcache'\\list\\cleanup.txt");

  if (!fso.FileExists(trashListPath)) {
    ppm.echo(lang.notExistList);

    return;
  }

  !ppm.question(lang.question) && PPx.Quit(-1);

  const delOpts = ['-min', '-qstart', '-error:ignore', '-symdel:sym', '-undolog:off', '-nocount'].join(' ');
  const path = `${tmp().dir}\\cleanup.txt`;
  const entries = PPx.Extract('%OC %*extract("%*insertSource(%sgu\'ppmcache\'\\list\\cleanup.txt)")').replace(/,/g, ';');
  PPx.Execute(`%Os *whereis -path:"${entries}" -dir:on -subdir:off -name -listfile:${path}`);
  PPx.Execute(`%Os *ppcfile !delete -src:"@${path}" ${delOpts}`);

  if (cleanPPxTmp) {
    PPx.Execute(`%Os *whereis -path:%'temp' -mask1:"PPX*TMP" -mask2:"${ignoreValidTempDir()}" -dir:on -subdir:off -name -listfile:${path}`);
    PPx.Execute(`*ppcfile !delete -src:"@${path}" ${delOpts}`);
  }
};

main();
