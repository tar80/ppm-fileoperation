/* @file Move files according to the situation
 * @arg 0 {number} - If non-zero, execute *ppcfile immediately
 * @arg 1 {number} - If non-zero, use filesystem move
 * @arg 2 {number} - If non-zero, output logs per file
 * @arg 3 {number} - If non-zero, reload entry-list after the move process is completed
 * @arg 4 {number} - If non-zero, move files to/from a parent directory
 * @arg 5 {number} - Specify the -same value for *ppcfile option. default value is "3"(skip)
 */

import {uselang, ppmin as ppm, moveFile as core} from './mod/core.ts';
import {langFileOparations} from './mod/language.ts';
import {safeArgs} from '@ppmdev/modules/argument.ts';
import debug from '@ppmdev/modules/debug.ts';

const lang = langFileOparations[uselang];

const main = (): void => {
  const [immediate, useFs, perLog, reload, moveUpper, sameName] = safeArgs(false, 0, false, false, false, '3');
  const {send, dest} = pathDetails(moveUpper);

  /* switch to *ppcfile when the destination is another drive or a non-filesystem path */
  const method = core.switchMethod(useFs, send, dest, true);

  if (send.dirtype === 'ARCHIVE' || dest.dirtype === 'ARCHIVE') {
    PPx.linemessage(`!"${lang.abort}`);

    return;
  } else if (method === 0) {
    const parameters = core.cmdParameters(dest, immediate, sameName);

    if (!parameters) {
      PPx.linemessage(`!"${lang.abort}`);

      return;
    }

    core.ppcfile('move', parameters);
  } else {
    let ok = core.fileOperation('MoveFS', core.performMove, perLog, send.dir, dest);

    if (ok) {
      core.updateWindow(reload);
      !moveUpper && core.updatePairWindow();
    }
  }
};

const pathDetails = (moveUpper: boolean) => {
  const wd = ppm.extract('C', '%%1')[1];
  const [_, destspec] = moveUpper ? ppm.extract('.', `%*name(DN,"${wd}")`) : ppm.extract('C', '%%2');

  return core.parentDetails(wd, destspec);
};

main();
