/* @file Undo/Redo
 */

import type {Error_String} from '@ppmdev/modules/types.ts';
import fso from '@ppmdev/modules/filesystem.ts';
import {info} from '@ppmdev/modules/data.ts';
import {uselang, ppmin as ppm, processUndo as core} from './mod/core.ts';
import {langUndo} from './mod/language.ts';
import debug from '@ppmdev/modules/debug.ts';

const lang = langUndo[uselang];

const main = (): void => {
  const [error, message] = undo();

  if (error) {
    ppm.echo(message);
    return;
  }

  if (ppm.extract('C', '%%2')[1] !== '') {
    core.updatePairWindow();
  }
};

const undo = (): Error_String => {
  const [error, data] = core.undologRead();

  if (error) {
    return [true, lang.couldNotRead];
  }

  if (data.lines.length === 0) {
    return [true, lang.noHistory];
  }

  const resultLog = ['[Undo]'];
  const errorMsg = [lang.errorDetected, ''];
  let hasProc = false;
  let n = 0;

  do {
    const line = data.lines[n];
    const [header, first] = line.split('\t');
    n++

    if (header === 'Skip' || header === 'MakeDir') {
      continue;
    }

    const second = data.lines[n].split('\t')[1];
    n++

    switch (header) {
      case 'MoveError':
      case 'Copy AutoRetryError':
      case 'Error SkipError':
        errorMsg.push(line);
        continue;

      case 'Move':
      case 'MoveDir':
        hasProc = true;
        break;

      case 'Backup':
        if (!fso.FileExists(second) && !fso.FolderExists(second)) {
          return [true, `${second} ${lang.notFound}`];
        }

        n++;
        hasProc = true;
        break;

      default:
        return [true, `${lang.unknown} "${header}"`];
    }

    resultLog.push(`Send ${first}`, `Dest -> ${second}`);
  } while (data.lines[n]);

  if (!hasProc) {
    return [true, lang.noUndo];
  }

  if (errorMsg.length > 2) {
    ppm.question(errorMsg.join('%%bn')) && PPx.Quit(1);
    overwrite('skip');
  }

  // NOTE:Switching process. If don't do this, REDO will not load.
  PPx.Execute('*wait 0,1');
  PPx.linemessage(resultLog.join(info.nlcode));
  PPx.Extract('*file !undo -min -nocount -log:off%:1') !== '1' && PPx.Quit(1);
  overwrite('redo');

  return [false, ''];
};

const overwrite = (proc: 'skip' | 'redo'): void => {
  const [error, data] = core.undologRead();

  if (error) {
    return;
  }

  const newLog = [];
  let n = 0;

  while (data.lines[n]) {
    const line = data.lines[n];
    const [header, first] = line.split('\t');
    n++

    if (header === 'Skip') {
      continue;
    }

    if (header === 'MoveError' || header === 'Copy AutoRetryError' || header === 'Error SkipError') {
      n++;
      continue;
    }
    if (header === 'Backup') {
      n = n + 2;
      continue;
    }

    const second = data.lines[n].split('\t')[1];
    const path = {
      skip: {send: first, dest: second},
      redo: {send: second, dest: first}
    }[proc];
    newLog.push(`Move\t${path.send}${info.nlcode} ->\t${path.dest}`);
    n++
  }

  // Write out the replacement result and overwrite it with utf16le
  core.undologWrite(newLog);
};

main();
