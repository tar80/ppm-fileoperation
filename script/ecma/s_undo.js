//!*script
/**
 * Undo and Redo
 *
 */

'use strict';

const NL_CHAR = '\r\n';

/* Initial */
// Read module
const st = PPx.CreateObject('ADODB.stream');
let module = function (filepath) {
  st.Open;
  st.Type = 2;
  st.Charset = 'UTF-8';
  st.LoadFromFile(filepath);
  const data = st.ReadText(-1);
  st.Close;

  return Function(' return ' + data)();
};

// Load module
const util = module(PPx.Extract('%*getcust(S_ppm#global:module)\\util.js'));
const fo = module(
  PPx.Extract(
    '%*getcust(S_ppm#plugins:ppm-fileoperation)\\script\\%*getcust(S_ppm#global:scripttype)\\mod_fo.js'
  )
);
module = null;

const fso = PPx.CreateObject('Scripting.FileSystemObject');
const undolog = fo.undologpath();

const proc = {};
proc['undo'] = () => {
  const ts = fso.OpenTextFile(undolog, 1, false, -1);
  const errors = ['Error detected in PPXUNDO.LOG. Skip it?', ''];
  let postCmd = false;

  const quitLog = (msg) => {
    ts.Close();
    util.log(msg);
    return typeof ppm_test_run !== 'undefined' ? 1223 : PPx.Quit(1);
  };

  // Exit if log is empty
  if (ts.AtEndOfLine) {
    return quitLog('!"Empty UndoLog');
  }

  // Read and format UndoLog line by line
  util.log('Undo>');

  do {
    const line = ts.ReadLine().split('\t');
    const header = line[0];
    const linePre = line[1];

    if (header === 'Skip' || header === 'MakeDir') {
      continue;
    }

    const linePost = ts.ReadLine().split('\t')[1];

    switch (header) {
      case 'MoveError':
      case 'Copy AutoRetryError':
      case 'Error SkipError':
        errors.push(line);
        continue;

      case 'Move':
      case 'MoveDir':
        postCmd = true;
        break;

      case 'Backup':
        if (!fso.FileExists(linePost) && !fso.FolderExists(linePost)) {
          return quitLog(`NotExist ${linePost}`);
        }

        ts.SkipLine();
        postCmd = true;
        break;

      default:
        return quitLog(`Unknown process "${header}"`);
    }

    util.log([`Send ${linePost}`, `Dest -> ${linePre}`], NL_CHAR);
  } while (!ts.AtEndOfStream);

  if (!postCmd) {
    return quitLog('No result');
  }

  ts.Close();

  if (errors.length > 2) {
    !util.interactive('ppm-fileoperation', errors.join(NL_CHAR.metaNewline('ppx'))) && PPx.Quit(1);
    proc.overwrite('skip');
  }

  // NOTE:Switching process. If don't do this, REDO will not load.
  PPx.Execute('*wait 0,2');
  util.extract('_', '*file !undo -src:%%1 -min -nocount -log:off%%:1') !== '1' && PPx.Quit(1);
  postCmd && proc.overwrite('redo');

  if (util.extract('C', '%%2') !== '') {
    fo.pairedUpdate();
  }

  return 0;
};

// Process Skip for errors
proc['overwrite'] = function (format) {
  const ts = fso.OpenTextFile(undolog, 1, false, -1);
  const result = [];

  // Read and format UndoLog line by line
  while (!ts.AtEndOfStream) {
    const line = ts.ReadLine().split('\t');
    const header = line[0];
    const linePre = line[1];

    if (header === 'Skip') {
      continue;
    }
    if (
      header === 'MoveError' ||
      header === 'Copy AutoRetryError' ||
      header === 'Error SkipError'
    ) {
      ts.SkipLine();
      continue;
    }
    if (header === 'Backup') {
      ts.SkipLine();
      ts.SkipLine();
      continue;
    }

    const linePost = ts.ReadLine().split('\t')[1];
    const path = {
      skip: {send: linePre, dest: linePost},
      redo: {send: linePost, dest: linePre}
    }[format];
    result.push(`Move\t${path.send}${NL_CHAR} ->\t${path.dest}`);
  }

  ts.Close();
  // Write out the replacement result and overwrite it with utf16le
  fo.undologWrite(undolog, result, NL_CHAR);
};

proc.undo();
