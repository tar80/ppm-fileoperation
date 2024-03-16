/* @file Copy entries to multiple paths
 * @arg {number} 0 - How the process is started. 0=ppcfile | 1=fastcopy | 2=symlink
 * @arg {number} 1 - How to process files with the same name. 0=skip | 1=update | 2=overwrite
 * @arg {string} 2 - Copy additional options
 * @arg {string} 3 - for symbolic-links. Specify the Scheduler task-name if you use an elevate-PPb
 */

import '@ppmdev/polyfills/stringTrim.ts';
import type {Error_String} from '@ppmdev/modules/types.ts';
import {isEmptyStr, withinRange} from '@ppmdev/modules/guard.ts';
import {pathSelf} from '@ppmdev/modules/path.ts';
import {safeArgs} from '@ppmdev/modules/argument.ts';
import {langMultiCopy} from './mod/language.ts';
import {nl, uselang, ppmin as ppm, multiCopy as core} from './mod/core.ts';
import debug from '@ppmdev/modules/debug.ts';

type CopyProc = 'Copy' | 'FastCopy' | 'Link';

const LIST_NAME = '%sgu"ppmcache"\\list\\multipath.txt';
const lang = langMultiCopy[uselang];

const main = () => {
  const [proc, same, opts, taskName] = safeArgs(0, 0, '', '');
  const [error, option] = getOptions(proc, same, opts);

  if (error) {
    const {scriptName, parentDir} = pathSelf();
    PPx.Execute(`*script "%sgu'ppmlib'\\errors.js",arg,"${parentDir}\\${scriptName}"`);
    PPx.Quit(-1);
  }

  const procName = ['Copy', 'FastCopy', 'Link'][proc] as CopyProc;
  const inputOpts =
    `'title':'Multiple ${procName} / ${lang.subTitle}',` +
    "'mode':'h'," +
    "'leavecancel':true," +
    "'list':false," +
    "'module':false," +
    "'detail':'1user1 path'," +
    `'file':'${LIST_NAME}'`;
  const data = PPx.Extract(`%*script("%sgu'ppmlib'\\input.js","{${inputOpts}}")`);

  if (data === '[error]' || isEmptyStr(data)) {
    PPx.Quit(-1);
  }

  const destPaths = PPx.Extract(data).trim().split(' ');

  if (!ppm.question(`[Multiple ${procName}]${nl}${destPaths.join(nl)}`)) {
    return;
  }

  let cmdline: string[] = [];
  const func = multi[procName];

  for (let i = 0, k = destPaths.length; i < k; i++) {
    const dest = destPaths[i];

    if (isEmptyStr(dest)) {
      continue;
    }

    func(dest, option, cmdline);
  }

  if (procName === 'Link' && cmdline.length > 0) {
    core.symlink(cmdline, taskName);
  }
};

const getOptions = (proc: number, same: number, opts: string): Error_String => {
  let v = '';

  if (!withinRange(proc,2) || !withinRange(same,2)) {
    return [true, v];
  }

  if (proc < 2) {
    const o = {
      0: {ppc: '3', fc: 'noexist_only'},
      1: {ppc: '0', fc: 'update'},
      2: {ppc: '2', fc: 'force_copy'}
    }[same];

    v = proc === 1 ? `/cmd=${o.fc} ${opts}` : `-sameall -same:${o.ppc} ${opts}`;
  }

  return [false, v];
};

const multi = {
  Copy(dest: string, option: string): void {
    ppm.execute('C', `*wait 100,2%%:*ppcfile !copy -log:off -undolog:off -querycreatedirectory:off -dest:${dest} ${option}`);
  },
  FastCopy(dest: string, option: string): void {
    const fcpath = core.getFcPath();

    if (!fcpath) {
      return;
    }

    const paths = ppm.extract('C', '%%#FDCSN')[1];
    const logPath = PPx.Extract('%*name(DCU,"%*temp()%\\fastcopy.log")');
    const options = `${option} /filelog=${logPath} /postproc=false ${paths} /to=${dest}%\\`;
    ppm.execute('C', `${fcpath} %(${options}%)`);
  },
  Link(dest: string, _: string, cmdline: string[]): void {
    core.symlinkCmdline(dest, cmdline);
  }
};

main();
