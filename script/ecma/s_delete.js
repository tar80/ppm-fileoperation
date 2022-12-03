﻿//!*script
/**
 * Deletion
 *
 * @arg {number} 0 How the process is delete. 0=SafeDelete | 1=FileSystemDelete
 * @arg {number} 1 If nonzero, include read-only files for deletion
 * @arg {number} 2 If nonzero, output message per file
 * @arg {number} 3 If nonzero, update entry-list after the delete process is completed
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

const g_args = ((args = PPx.Arguments) => {
  const arr = [0, 0, 0, 0];

  for (let i = 0, l = args.length; i < l; i++) {
    arr[i] = args.Item(i) | 0;
  }

  return {
    proc: {0: 'SafeDel', 1: 'Delete'}[arr[0]],
    ro: arr[1],
    log: Boolean(arr[2]),
    update: arr[3]
  };
})();

const working_dir = util.extract('C', '%%1%%\\');
const trash_dir = util.extract('_', '%*getcust(S_ppm#user:fo_trash)%\\deleted$\\');

if (g_args.proc === 'SafeDel' && ~working_dir.indexOf('deleted$')) {
  util.log('!"SafeDelete was completed');
  PPx.Quit(1);
}

const fso = PPx.CreateObject('Scripting.FileSystemObject');

if (!fso.FolderExists(trash_dir)) {
  util.interactive(
    'ppm-fileoperation',
    `${trash_dir} is not exist.${NL_CHAR.metaNewline('ppx')}Create Directory?`
  ) && fso.CreateFolder(trash_dir);
}

const result = [];
const debug = typeof ppm_test_run !== 'undefined';
const del = {
  SafeDel(method, send, name) {
    const pwd = PPx.Extract(`${trash_dir}\\%*now(date)`);

    if (!fso.FolderExists(pwd)) {
      fso.CreateFolder(pwd);
    }

    const dest = PPx.Extract(`%*name(DCUN,"%(${pwd}\\${name}%)")`);

    debug
      ? util.execute('C', `fso.Move${method}(${send}${name},${dest})`)
      : fso[`Move${method}`](`${send}${name}`, dest);
    result.push(`Backup\t${send}${name}${NL_CHAR} ->\t${dest}${NL_CHAR}Delete\t${name}`);
    return PPx.Extract(`%*name(CN,"%(${dest}%)")`);
  },
  Delete(method, send, name, readonly) {
    debug
      ? util.execute('B', `*linemessage fso.Delete${method}(${send}${name}, ${g_args.ro})`)
      : fso[`Delete${method}`](`${send}${name}`, readonly);
    return name;
  }
}[g_args.proc];

let success_count = 0;
let skip_count = 0;
let error_count = 0;
let responce = {};
const entries = PPx.Entry;

const entryIs = (att, name) => {
  if (!fso[`${att}Exists`](name)) {
    return false;
  }

  if (g_args.ro === 0 && fso[`Get${att}`](name).attributes % 2 !== 0) {
    responce = {header: 'Skip RO', msg: name};
    skip_count++;
  } else {
    try {
      responce = {header: g_args.proc, msg: del(att, working_dir, name, g_args.ro)};
      entries.State = 1;
      success_count++;
    } catch (err) {
      responce = {header: err, msg: name};
      error_count++;
    } finally {
      entries.NextMark;
    }
  }

  g_args.log && util.log(`${responce.header}\t${responce.msg}`);
  return true;
};

const markCount = Math.max(PPx.EntryMarkCount, 1);
entries.FirstMark;

for (let i = 0; i < markCount; i++) {
  entryIs('Folder', entries.Name) || entryIs('File', entries.Name);
}

const logs = fo.resultlog.call({
  cmd: g_args.proc,
  success: success_count,
  skip: skip_count,
  error: error_count
});
util.log(logs);

if (success_count === 0) {
  !debug && PPx.Quit(1);
}

fo.postproc(g_args.update, util.execute);

const undolog = fo.undologpath();
fo.undologWrite(undolog, result, NL_CHAR);
