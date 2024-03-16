/* @file Delete files according to the situation
 * @arg 0 {number} - If non-zero, output logs per file
 * @arg 1 {number} - If non-zero, reload entry-list after deletion
 */

import {uselang, ppmin as ppm, fileDelete as core} from './mod/core.ts';
import {langFileDelete} from './mod/language.ts';
import {safeArgs} from '@ppmdev/modules/argument.ts';
import debug from '@ppmdev/modules/debug.ts';

const TRASH_NAME = 'deleted$';
const lang = langFileDelete[uselang];

const main = () => {
  const [perLog, reload] = safeArgs(false, false);
  const sendDir = ppm.extract('C', '%%1')[1];

  if (~sendDir.indexOf(TRASH_NAME)) {
    PPx.linemessage(`!"${lang.deleted}`);

    return;
  }

  const trashDir = core.getTrash(TRASH_NAME);

  if (!trashDir) {
    PPx.linemessage(`!"${lang.abort}`);

    return;
  }

  const ok = core.fileOperation('SafeDel', core.performSafeDel, perLog, sendDir, {dir: trashDir, dirtype: 'DIR'});
  ok && core.updateWindow(reload);
};

main();
