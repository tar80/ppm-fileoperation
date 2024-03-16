/* @file Copy files according to the situation
 * @arg 0 {number} How the process is started. 0=detail | 1=quick | 2=confirm(symlink) | 3=quick(symlink)
 * @arg 1 {number} If non-zero, use FastCopy
 * @arg 2 {number} How to process files with the same name. 0=skip | 1=update | 2=overwrite
 * @arg 3 {string} Specify scheduler task name when PPb(elevate) is used for symbolic link
 */

import {isEmptyStr, withinRange} from '@ppmdev/modules/guard.ts';
import {uselang, ppmin as ppm, copyFile as core} from './mod/core.ts';
import {safeArgs} from '@ppmdev/modules/argument.ts';
import {langFileOparations} from './mod/language.ts';
import debug from '@ppmdev/modules/debug.ts';

const lang = langFileOparations[uselang];

const main = () => {
  const [order, useFc, sameName, taskName] = safeArgs(0, false, 0, '');
  let immediate = order === 1 || order === 3;
  const {send, dest} = core.parentDetails(ppm.extract('C', '%%1')[1], ppm.extract('C', '%%2')[1]);
  const method = (() => {
    let cmd = 'ppcfile';
    let change = core.switchMethod(order, send, dest);

    if (change === 1 && useFc) {
      cmd = 'fastcopy';
    } else if (change > 1) {
      cmd = 'symlink';
    }

    return cmd;
  })();
  const opt = procSameName(sameName);

  if (dest.dirtype === 'ARCHIVE') {
    PPx.linemessage(`!"${lang.notSupported(dest.dirtype)}`);

    return;
  } else if (dest.dirtype === 'NA' && isEmptyStr(dest.dir)) {
    dest.dir = '%*getcust(S_ppm#user:work)%\\';
    immediate = false;
  }

  if (send.dirtype === 'ARCHIVE') {
    if (method === 'symlink') {
      PPx.linemessage(`!"${lang.abort}`);

      return;
    } else if (dest.dirtype === 'LISTFILE' || dest.dirtype === 'ARCHIVE') {
      PPx.linemessage(`!"${lang.notSupported(dest.dirtype)}`);

      return;
    }

    if (!immediate) {
      dest.dir = inputPath(lang.fileExpand, dest.dir);
      dest.dir === '[error]' && PPx.Quit(1);
    }

    core.expandFiles(dest.dir);
  } else if (method === 'symlink') {
    if (!immediate) {
      dest.dir = inputPath(lang.createLink, dest.dir);
      dest.dir === '[error]' && PPx.Quit(1);
    }

    const cmdline = core.symlinkCmdline(dest.dir);
    core.symlink(cmdline, taskName);
  } else if (method === 'fastcopy') {
    core.fastCopy(dest.dir, immediate, opt.fc);
  } else {
    const parameters = core.cmdParameters(dest, immediate, opt.ppc);

    if (!parameters) {
      PPx.linemessage(`!"${lang.abort}`);

      return;
    }

    core.ppcfile('copy', parameters);
    // ok && PPx.Execute('*execute C,*unmarkentry path:');
  }
};

const procSameName = (v: number): {ppc: string; fc: string} => {
  if (!withinRange(v, 2)) {
    v = 0;
  } else {
    v;
  }

  return {
    0: {ppc: '3', fc: 'noexist_only'},
    1: {ppc: '0', fc: 'update'},
    2: {ppc: '2', fc: 'force_copy'}
  }[v as 0 | 1 | 2];
};

const inputPath = (title: string, destPath: string) => {
  const opts = `{'text':'${destPath}','title':'${title}','mode':'e','select':'a','k':'*completelist -set -history:p'}`;

  return PPx.Extract(`%*script("%sgu'ppmlib'\\input.js","${opts}")`);
};

main();
