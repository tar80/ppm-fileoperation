/* @file Cleanup trash items
 * @arg 0 {number} - If non-zero, do a test run
 */

import fso from '@ppmdev/modules/filesystem.ts';
import {nl, uselang, ppmin as ppm} from './mod/core.ts';
import {langCleanup} from './mod/language.ts';
import {isEmptyStr} from '@ppmdev/modules/guard.ts';
import {safeArgs} from '@ppmdev/modules/argument.ts';
import debug from '@ppmdev/modules/debug.ts';

const lang = langCleanup[uselang];

const main = () => {
  const [isTest] = safeArgs(false);

  const trashListPath = PPx.Extract("%sgu'ppmcache'\\list\\cleanup.txt");

  if (!fso.FileExists(trashListPath)) {
    ppm.echo(lang.notExistList);

    return;
  }

  const entries = PPx.Extract('%OC %*extract("%*insertSource(%sgu\'ppmcache\'\\list\\cleanup.txt)")').replace(/;/g, ',').split(',');
  const errors: string[] = [];
  let [delFile, delFolder]: boolean[] = [];

  if (!isTest) {
    !ppm.question(lang.question) && PPx.Quit(-1);
  }

  for (const entry of entries) {
    if (isEmptyStr(entry)) {
      continue;
    }

    if (isTest) {
      ppm.echo(lang.test + nl + entries.join(nl));

      return;
    }

    delFile = cleanupFiles(entry);
    delFolder = cleanupFolders(entry);

    if (!delFile && !delFolder) {
      errors.push(entry);
    }
  }

  errors.length === 0 ? PPx.linemessage(`!"${lang.complete}`) : `${lang.remaining}${nl}${nl}${errors.join(nl)}`;
};

const cleanupFiles = (filespec: string) => {
  let isOkey = true;
  debug.log('file', filespec);

  try {
    fso.DeleteFile(filespec, true);
  } catch (err) {
    isOkey = false;
  }

  return isOkey;
};

const cleanupFolders = (folderspec: string) => {
  let isOkey = true;
  debug.log('folder', folderspec);

  try {
    fso.DeleteFolder(folderspec, true);
  } catch (err) {
    isOkey = false;
  }

  return isOkey;
};

main();
