﻿//!*script
/**
 * Copy files to suit the situation
 *
 * @arg {number} 0 - How the process is started. 0=detail | 1=quick | 2=confirm(symlink) | 3=quick(symlink)
 * @arg {number} 1 - If non-zero, use FastCopy to regular copy
 * @arg {number} 2 - If non-zero, How to process files with the same name. 0=skip | 1=update | 2=overwrite
 * @arg {number} 3 - If non-zero, update entry-list after the copy process is completed
 * @arg {string} 4 - for Symlink. Specify the Scheduler task-name if you use an elevate-PPb
 * NOTE:arg(1) If you select FastCopy, it is always quick-copy.
 */

'use strict';

const NL_CHAR = '\r\n';
const LIMIT_FILE_SIZE = 3000000;
const LIMIT_SUB_DIRECTORIES = 30;

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
const input = module(PPx.Extract('%*getcust(S_ppm#global:module)\\input.js'));
const fo = module(
  PPx.Extract(
    '%*getcust(S_ppm#plugins:ppm-fileoperation)\\script\\%*getcust(S_ppm#global:scripttype)\\mod_fo.js'
  )
);
module = null;

const fso = PPx.CreateObject('Scripting.FileSystemObject');

const g_args = ((args = PPx.Arguments) => {
  const arr = [0, 0, 0, 0, 0];

  for (let i = 0, l = args.length; i < l; i++) {
    arr[i] = args.Item(i) === '_' ? arr[i] : args.Item(i);
  }

  const samename = {
    0: {ppc: 3, fc: 'noexist_only'},
    1: {ppc: 0, fc: 'update'},
    2: {ppc: 2, fc: 'force_copy'}
  };

  return {
    proc: arr[0] | 0,
    useFC: arr[1] | 0,
    same: samename[arr[2]],
    update: arr[3] | 0,
    useTask: arr[4]
  };
})();

const paired_parent = util.extract('C', '%%2');

/**
 * Paired window details
 *
 * @param {object} {path: destination, ext: dirtype}
 */
const paired_win = fo.pairedWindow(paired_parent);

const entries = (() => {
  const names = util.extract('C', '%%#;FCN').replace(/ /g, '_').split(';');

  return {
    paths: util.extract('C', '%%#;FDCSN').split(';'),
    names: names,
    counts: names.length
  };
})();

/**
 * Destination sort
 *
 * @return {obj} {process, dest, append, post}
 */
const copy_detail = fo.detail(paired_win.ext, g_args.proc, paired_win.path, g_args.same.ppc);

/**
 * Copy command values
 *
 * @return {obj} {act, dest, opt, post}
 */
const copy = fo.command('copy', copy_detail);

/**
 * Symbolic-link argument values
 *
 * @return {number} exitcode
 * @param {string} 0 Destination path
 * @param {obj}    1 {paths, names, counts}
 */
const sym_link = (dest, marked) => {
  if (g_args.proc === 2) {
    !util.interactive('ppm-fileoperation', 'Run mklink to create symbolic-links?') && PPx.Quit(1);
  }

  const cmdline = [];

  for (let i = 0; i < marked.counts; i++) {
    const thisFile = marked.names[i];
    const thisPath = marked.paths[i];
    const isDir = PPx.GetFileInformation(thisPath) === ':DIR' ? '/D ' : '';

    cmdline.push(`"${isDir}${dest}\\${thisFile} ${thisPath}"`);
  }

  let prefixOpt = '%Obdq ';

  if (!!g_args.useTask) {
    prefixOpt = fo.elevatePPb(g_args.useTask);
  }

  return fo.symlink(prefixOpt, cmdline);
};

const check_async = () => {
  const vbs = '%*getcust(S_ppm#global:ppm)\\lib\\vbs\\count_entries.vbs';
  let file_size = 0;
  let dir_count = 0;

  const markCount = Math.max(PPx.EntryMarkCount, 1);
  const en = PPx.Entry;
  en.FirstMark;

  for (let i = 0; i < markCount; i++) {
    const entryAtt = fo.exist(en.Name);

    if (!entryAtt) {
      continue;
    }

    const st = fso[`Get${entryAtt}`](en.Name);
    file_size = file_size + st.size;

    if (file_size > LIMIT_FILE_SIZE) {
      return 2;
    }

    if (entryAtt === 'Folder') {
      dir_count = PPx.Extract(`%*script(${vbs},${en.Name},dir,${LIMIT_SUB_DIRECTORIES})`);

      if (dir_count >= LIMIT_SUB_DIRECTORIES) {
        return 2;
      }
    }

    en.NextMark;
  }

  return 1;
};

const fast_copy = (confirm, paths, send, dest, same) => {
  if (confirm !== 0) {
    confirm = check_async();
  }

  const options =
    ` /cmd=${same} /force_start=2 /verify /error_stop /log=false /filelog=${paths.log}` +
    ` /postproc=false ${send.join(' ')} /to="${dest}%%\\"`;

  if (confirm == 0) {
    util.execute('_', `%%Oq *cd ${paths.parent}%%:fastcopy.exe /no_exec /auto_close ${options}`);
  } else if (confirm == 2) {
    util.execute('_', `%%Oq *cd ${paths.parent}%%:fastcopy.exe /auto_close ${options}`);
    PPx.SetPopLineMessage('Limit: Asynchronous Fastcopy');
    PPx.Quit(1);
  } else {
    if (util.execute('_', `%%Obdq *cd ${paths.parent}%%:fcp.exe ${options} %%&`) !== 0) {
      util.log('Error: FastCopy did not work');
      PPx.Quit(1);
    }
  }

  try {
    const ts = fso.OpentextFile(paths.log, 1, -1);
    const logLines = ts.ReadAll().split(NL_CHAR);
    const fcErr = logLines[logLines.length - 3]
      .replace(/^Result\s\D+(\d+)\D+(\d+).+/, '$1,$2')
      .split(',');
    ts.Close();

    util.log(`FastCopy Error: ${Number(fcErr[0]) + Number(fcErr[1])}`);
  } catch (err) {
    util.log('Error: FastCopy result not found.');
  }
};

// Execute Copy command
if (g_args.proc >= 2) {
  // for symlink
  fo.imcompatible(paired_win.ext, 'Cannot create symbolic-links to ListFile');
  sym_link(copy.dest, entries);
} else if (/[62|63|96]/.test(Number(util.extractJS('C', 'DirectoryType')))) {
  // for Archive
  fo.imcompatible(paired_win.ext, 'Cannot copy from archive to ListFile');
  fo.sevenzip(
    input.lied.call({
      text: copy.dest,
      title: 'Expand selected files / Skip duplicate names',
      mode: 'd'
    })
  );
} else {
  // for Regular
  if (g_args.useFC !== 0 && paired_win.ext === ':DIR') {
    const fc = fo.fastcopy();
    fast_copy(g_args.proc, fc, entries.paths, paired_win.path, g_args.same.fc);
  } else {
    fo.run(copy, util.execute);
  }
}

if (paired_win.ext !== 'na') {
  fo.pairedUpdate();
}

fo.postproc(g_args.update, util.execute);
