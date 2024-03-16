/* @file Display fastcopy execution result message
 * @arg 0 {string} - Specify the path to the fastcopy result log
 */

import fso from '@ppmdev/modules/filesystem.ts';
import {readLines} from '@ppmdev/modules/io.ts';
import {useLanguage} from '@ppmdev/modules/data.ts';
import {langFastcopyResult} from './mod/language.ts';
import {datetime} from './mod/core.ts';
import {safeArgs} from '@ppmdev/modules/argument.ts';
import debug from '@ppmdev/modules/debug.ts';

const lang = langFastcopyResult[useLanguage()];
const LOG_TITLE = 'CopyFC';
const LOG_ENC = 'utf8';
const LOG_NL = '\r\n';

const main = () => {
  const [path] = safeArgs('');

  if (!fso.FileExists(path)) {
    PPx.linemessage(`${LOG_TITLE}\t${lang.resultNotExist}`);

    return;
  }

  const enc = LOG_ENC;
  const linefeed = LOG_NL;
  const [error, data] = readLines({path, enc, linefeed});

  if (error) {
    PPx.linemessage(`${LOG_TITLE}\t${lang.couldNotRead}`);

    return;
  }

  PPx.Execute(`*execute C,*unmarkentry path:%%:%%K~"@^F5"%%:*linemessage ${resultMsg(data.lines)}`);
};

const resultMsg = (lines: string[]) => {
  let [success, skip, error]: number[] = [0, 0, 0];

  for (let len = lines.length - 1, line; 0 < len; len--) {
    line = lines[len];

    if (~line.indexOf('TotalFiles')) {
      const resp = line.replace(/^TotalFiles\s+=\s(\d+)\s.*$/, '$1');
      success = Number(resp);

      break;
    } else if (~line.indexOf('SkipFiles')) {
      const resp = line.replace(/^SkipFiles\s+=\s(\d+).*$/, '$1');
      skip = Number(resp);
    } else if (~line.indexOf('Result')) {
      const resp = line.replace(/^Result\s\D+(\d+)\D+(\d+).+$/, '$1,$2').split(',');
      error = Number(resp[0]) + Number(resp[1]);
    }
  }

  if (error == null) {
    return `${LOG_TITLE}\t${lang.noProcess}`;
  } else {
    const total = success + error + skip;
    let items: string[] = [];

    if (skip > 0) {
      items.push(`Skip:${skip}`);
    }
    if (error > 0) {
      items.push(`Error:${error}`);
    }

    const factor = items.length === 0 ? '' : ` [${items.join(',')}]`;

    return `${LOG_TITLE}\t${success}/${total}${factor}${datetime()}`;
  }
};

main();
