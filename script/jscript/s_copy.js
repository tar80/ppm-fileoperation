//!*script
/**
 * Copy files to suit the situation
 *
 * @arg {number} 0 How the process is started. 0=detail | 1=quick | 2=confirm(symlink) | 3=quick(symlink)
 * @arg {number} 1 If nonzero, use FastCopy to regular copy
 * @arg {number} 2 If nonzero, How to process files with the same name. 0=skip | 1=update | 2=overwrite
 * @arg {number} 3 If nonzero, update entry-list after the copy process is completed
 * @arg {string} 4 for Symlink. Specify the Scheduler task-name if you use an elevate-PPb
 * NOTE:arg(1) If you select FastCopy, it is always quick-copy.
 */

var NL_CHAR = '\r\n';
var LIMIT_FILE_SIZE = 3000000;
var LIMIT_SUB_DIRECTORIES = 30;

/* Initial */
// Read module
var st = PPx.CreateObject('ADODB.stream');
var module = function (filepath) {
  st.Open;
  st.Type = 2;
  st.Charset = 'UTF-8';
  st.LoadFromFile(filepath);
  var data = st.ReadText(-1);
  st.Close;

  return Function(' return ' + data)();
};

// Load module
var util = module(PPx.Extract('%*getcust(S_ppm#global:module)\\util.js'));
var input = module(PPx.Extract('%*getcust(S_ppm#global:module)\\input.js'));
var fo = module(
  PPx.Extract(
    '%*getcust(S_ppm#plugins:ppm-fileoperation)\\script\\%*getcust(S_ppm#global:scripttype)\\mod_fo.js'
  )
);
module = null;

var fso = PPx.CreateObject('Scripting.FileSystemObject');

var g_args = (function (args) {
  var arr = [0, 0, 0, 0, 0];

  for (var i = 0, l = args.length; i < l; i++) {
    arr[i] = args.Item(i) === '_' ? arr[i] : args.Item(i);
  }

  var samename = {
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
})(PPx.Arguments);

var paired_parent = util.extract('C', '%%2');

/**
 * Paired window details
 *
 * @param {object} {path: destination, ext: dirtype}
 */
var paired_win = fo.pairedWindow(paired_parent);

var marked_entry = function () {
  var names = util.extract('C', '%%#;FCN').replace(/ /g, '_').split(';');

  return {
    paths: util.extract('C', '%%#;FDCSN').split(';'),
    names: names,
    counts: names.length
  };
};
var entries = marked_entry();

/**
 * Destination sort
 *
 * @return {obj} {process, dest, append, post}
 */
var copy_detail = fo.detail(paired_win.ext, g_args.proc, paired_win.path, g_args.same.ppc);

/**
 * Copy command values
 *
 * @return {obj} {act, dest, opt, post}
 */
var copy = fo.command('copy', copy_detail);

/**
 * Symbolic-link argument values
 *
 * @return {number} exitcode
 * @param {string} 0 Destination path
 * @param {obj}    1 {paths, names, counts}
 */
var sym_link = function (dest, marked) {
  if (g_args.proc === 2) {
    !util.interactive('ppm-fileoperation', 'Run mklink to create symbolic-links?') && PPx.Quit(1);
  }

  var cmdline = [];

  for (var i = 0; i < marked.counts; i++) {
    var thisFile = marked.names[i];
    var thisPath = marked.paths[i];
    var isDir = PPx.GetFileInformation(thisPath) === ':DIR' ? '/D ' : '';

    cmdline.push('"' + isDir + dest + '\\' + thisFile + ' ' + thisPath + '"');
  }

  var prefixOpt = '%Obdq ';

  if (!!g_args.useTask) {
    prefixOpt = fo.elevatePPb(g_args.useTask);
  }

  return fo.symlink(prefixOpt, cmdline);
};

var check_async = function () {
  var vbs = '%*getcust(S_ppm#global:ppm)\\lib\\vbs\\count_entries.vbs';
  var file_size = 0;
  var dir_count = 0;

  var markCount = Math.max(PPx.EntryMarkCount, 1);
  var en = PPx.Entry;
  en.FirstMark;

  for (var i = 0; i < markCount; i++) {
    var entryAtt = fo.exist(en.Name);

    if (!entryAtt) {
      continue;
    }

    var st = fso['Get' + entryAtt](en.Name);
    file_size = file_size + st.size;

    if (file_size > LIMIT_FILE_SIZE) {
      return 2;
    }

    if (entryAtt === 'Folder') {
      dir_count = PPx.Extract(
        '%*script(' + vbs + ',' + en.Name + ',dir,' + LIMIT_SUB_DIRECTORIES + ')'
      );

      if (dir_count >= LIMIT_SUB_DIRECTORIES) {
        return 2;
      }
    }

    en.NextMark;
  }

  return 1;
};

var fast_copy = function (confirm, paths, send, dest, same) {
  if (confirm !== 0) {
    confirm = check_async();
  }

  var options =
    ' /cmd=' + same + ' /force_start=2 /verify /error_stop /log=false /filelog=' + paths.log +
    ' /postproc=false ' + send.join(' ') + ' /to=' + dest + '%%\\';

  if (confirm == 0) {
    util.execute(
      '_',
      '%%Oq *cd ' + paths.parent + '%%:fastcopy.exe /no_exec /auto_close' + options
    );
  } else if (confirm == 2) {
    util.execute('_', '%%Oq *cd ' + paths.parent + '%%:fastcopy.exe /auto_close' + options);
    PPx.SetPopLineMessage('Limit: Asynchronous Fastcopy');
    PPx.Quit(1);
  } else {
    if (util.execute('_', '%%Obdq *cd ' + paths.parent + '%%:fcp.exe' + options + '%%&') !== 0) {
      util.log('Error: FastCopy did not work');
      PPx.Quit(1);
    }
  }

  try {
    var ts = fso.OpentextFile(paths.log, 1, -1);
    var logLines = ts.ReadAll().split(NL_CHAR);
    var fcErr = logLines[logLines.length - 3]
      .replace(/^Result\s\D+(\d+)\D+(\d+).+/, '$1,$2')
      .split(',');
    ts.Close();

    util.log('FastCopy Error: ' + (Number(fcErr[0]) + Number(fcErr[1])));
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
    var fc = fo.fastcopy();
    fast_copy(g_args.proc, fc, entries.paths, paired_win.path, g_args.same.fc);
  } else {
    fo.run(copy, util.execute);
  }
}

if (paired_win.ext !== 'na') {
  fo.pairedUpdate();
}

fo.postproc(g_args.update, util.execute);
