/* @file Batch deletion of multiple paths
 * @arg 0 {string} - *ppcfile
 */

import '@ppmdev/polyfills/stringTrim.ts';
import type {Error_Data} from '@ppmdev/modules/types.ts';
import {validArgs} from '@ppmdev/modules/argument.ts';
import {info, tmp} from '@ppmdev/modules/data.ts';
import {isEmptyStr} from '@ppmdev/modules/guard.ts';
import {writeLines} from '@ppmdev/modules/io.ts';
import {langMultiCopy} from './mod/language.ts';
import {nl, uselang, ppmin as ppm} from './mod/core.ts';
import debug from '@ppmdev/modules/debug.ts';

const LIST_NAME = '%sgu"ppmcache"\\list\\multipath.txt';
const DEFAULT_OPTS = '-min -log:off -undolog:off -querycreatedirectory:off -checkexistfirst -nocount -symdel:sym';
const respFilePath = tmp().file;
const lang = langMultiCopy[uselang];

const main = () => {
  const [addOpts] = validArgs();
  const opts = [DEFAULT_OPTS, addOpts].join(' ');

  const inputOpts =
    `'title':'Multiple Delete / ${lang.subTitle}',` +
    "'mode':'h'," +
    "'leavecancel':true," +
    "'list':false," +
    "'module':false," +
    "'detail':'1user1 path'," +
    `'file':'${LIST_NAME}'`;
  const input = PPx.Extract(`%*script("%sgu'ppmlib'\\input.js","{${inputOpts}}")`);

  if (input === '[error]' || isEmptyStr(input)) {
    PPx.Quit(-1);
  }

  const [error, data] = extractPaths(PPx.Extract(input).trim().split(' '));

  if (error) {
    ppm.echo(data);
    PPx.Quit(-1);
  }

  if (!ppm.question(`[Multiple Delete]${nl}${data.join(nl)}`)) {
    return;
  }

  ppm.execute('C', `*ppcfile !delete ${opts} -src:"@${respFilePath}" -compcmd *focus`);
};

const extractPaths = (paths: string[]): Error_Data => {
  const entries: string[] = ppm.extract('C', '%%#;FCN')[1].split(';');
  const deletePaths: string[] = [];

  for (const path of paths) {
    if (isEmptyStr(path)) {
      continue;
    }

    for (const entry of entries) {
      deletePaths.push(`${path}\\${entry}`.replace(/ /g, '_'));
    }
  }

  const [error, msg] = writeLines({path: respFilePath, data: deletePaths, enc: 'utf16le', overwrite: true, linefeed: info.nlcode});

  return error ? [true, msg] : [false, deletePaths];
};

main();
