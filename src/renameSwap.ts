/* @file Swap filenames
 *
 * NOTE:
 *  - If the number of marks is two, the name is swapped between two files.
 *  - If the number of marks is less than two, swap with the cursor position file name in the opposite window.
 *  - If the files have the same name, the file extension is swapped.
 *  - Name swapping between file and directory is not supported.
 */

import {langRenameSwap} from './mod/language.ts';
import {nl, uselang, ppmin as ppm, renameSwap as core, undologWrite} from './mod/core.ts';

const lang = langRenameSwap[uselang];

const main = (): void => {
  const markCount = PPx.EntryMarkCount;
  let [error, data]: [boolean, string[]] = [false, []];

  if (markCount === 2) {
    [error, data] = handleMarks();
  } else if (markCount < 2 && PPx.Pane.Count > 1) {
    [error, data] = handlePairs();
  } else {
    ppm.echo(lang.desc.join(nl));

    return;
  }

  if (!error) {
    ppm.execute('C', '*unmarkentry');
    undologWrite(data);
  }
};

const confirm = (msg: string, name1: string, name2: string): boolean =>
  ppm.question(`${msg}${nl}${nl}${name1}${nl}${name2}`);

const handleMarks = (): [boolean, string[]] => {
  const entry = PPx.Entry;

  entry.FirstMark;
  const mark1 = core.entryDetails(entry.Name);
  entry.NextMark;
  const mark2 = core.entryDetails(entry.Name);

  type Bool = 'true' | 'false';
  const [newname1, newname2, msg] = {
    true: [`${mark1.name}.${mark2.ext}`, `${mark2.name}.${mark1.ext}`, lang.fileExt],
    false: [`${mark2.name}.${mark1.ext}`, `${mark1.name}.${mark2.ext}`, lang.fileName]
  }[(mark1.name === mark2.name).toString() as Bool];
  const [error, errorMsg] = core.checkExistence(
    [mark1.filepath, mark2.filepath],
    [newname1, newname2],
    [mark1.type, mark2.type]
  );

  if (error) {
    ppm.echo(errorMsg);

    return [true, []];
  }

  if (!confirm(msg, mark1.filepath, mark2.filepath)) {
    return [true, []];
  }

  const tempName = core.createUniqName(mark1);
  ppm.execute(
    'C',
    `*rename ${mark1.filepath},${tempName}` +
      `%%:*rename ${mark2.filepath},${newname2}` +
      `%%:*rename ${tempName},${newname1}`
  );

  return [false, []];
};

const handlePairs = (): [boolean, string[]] => {
  const current = core.entryDetails(ppm.extract('C', '%%FDCN')[1]);
  const pairs = core.entryDetails(ppm.extract('C', '%%~FDCN')[1]);
  const newname1 = `${ppm.extract('C', '%%1')[1]}\\${pairs.name}.${current.ext}`;
  const newname2 = `${ppm.extract('C', '%%2')[1]}\\${current.name}.${pairs.ext}`;
  const [error, errorMsg] = core.checkExistence(
    [current.filepath, pairs.filepath],
    [newname1, newname2],
    [current.type, pairs.type]
  );

  if (error) {
    ppm.echo(errorMsg);

    return [true, []];
  }

  if (!confirm(lang.opWindow, current.filepath, pairs.filepath)) {
    return [true, []];
  }

  ppm.execute('C', `*rename ${current.filepath},${newname1}%%:*jumppath -update -entry:"${pairs.name}.${current.ext}"`);
  ppm.execute('~', `*rename ${pairs.filepath},${newname2}%%:*jumppath -update -entry:"${current.name}.${pairs.ext}"`);

  const undolog = [`Move\t${current.filepath}`, ` ->\t${newname1}`, `Move\t${pairs.filepath}`, ` ->\t${newname2}`];

  return [false, undolog];
};

main();
