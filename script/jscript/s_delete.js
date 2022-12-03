//!*script
/**
 * Deletion
 *
 * @arg {number} 0 How the process is delete. 0=SafeDelete | 1=FileSystemDelete
 * @arg {number} 1 If nonzero, include read-only files for deletion
 * @arg {number} 2 If nonzero, output message per file
 * @arg {number} 3 If nonzero, update entry-list after the delete process is completed
 */

var NL_CHAR = '\r\n';

/* Initial */
// Read module
var st = PPx.CreateObject('ADODB.stream');
var module = function (filepath) {
  st.Open;
  st.Type = 2;
  st.Charset = 'UTF-8';
  st.LoadFromFile(filepath);
  const data = st.ReadText(-1);
  st.Close;

  return Function(' return ' + data)();
};

// Load module
var util = module(PPx.Extract('%*getcust(S_ppm#global:module)\\util.js'));
var fo = module(
  PPx.Extract('%*getcust(S_ppm#plugins:ppm-fileoperation)\\script\\%*getcust(S_ppm#global:scripttype)\\mod_fo.js')
);
module = null;

var g_args = (function (args) {
  var arr = [0, 0, 0, 0];

  for (var i = 0, l = args.length; i < l; i++) {
    arr[i] = args.Item(i) | 0;
  }

  return {
    proc: {0: 'SafeDel', 1: 'Delete'}[arr[0]],
    ro: arr[1],
    log: Boolean(arr[2]),
    update: arr[3]
  };
})(PPx.Arguments);

var working_dir = util.extract('C', '%%1%%\\');
var trash_dir = util.extract('_', '%*getcust(S_ppm#user:fo_trash)%\\deleted$\\');

if (g_args.proc === 'SafeDel' && ~working_dir.indexOf('deleted$')) {
  util.log('!"SafeDelete was completed');
  PPx.Quit(1);
}

var fso = PPx.CreateObject('Scripting.FileSystemObject');

if (!fso.FolderExists(trash_dir)) {
  util.interactive(
    'ppm-fileoperation',
    trash_dir + ' is not exist.' + NL_CHAR.metaNewline('ppx') + 'Create Directory?'
  ) && fso.CreateFolder(trash_dir);
}

var result = [];
var debug = typeof ppm_test_run !== 'undefined';
var delete_type = {
  SafeDel: function (method, send, name) {
    var pwd = PPx.Extract(trash_dir + '\\%*now(date)');

    if (!fso.FolderExists(pwd)) {
      fso.CreateFolder(pwd);
    }

    var dest = PPx.Extract('%*name(DCUN,"' + pwd + '\\' + name + '")');

    debug
      ? util.execute('C', 'fso.Move' + method + '(' + send + name + ', ' + dest + ')')
      : fso['Move' + method](send + name, dest);
    result.push(
      'Backup\t' + send + name + NL_CHAR + ' ->\t' + dest + NL_CHAR + 'Delete\t' + name
    );
    return PPx.Extract('%*name(CN,"' + dest + '")');
  },
  Delete: function (method, send, name, readonly) {
    debug
      ? util.execute(
          'B',
          '*linemessage fso.Delete' + method + '(' + send + name + ', ' + g_args.ro + ')'
        )
      : fso['Delete' + method](send + name, readonly);
    return name;
  }
};
var del = delete_type[g_args.proc];

var success_count = 0;
var skip_count = 0;
var error_count = 0;
var responce = {};
var entries = PPx.Entry;

var entryIs = function (att, name) {
  if (!fso[att + 'Exists'](name)) {
    return false;
  }

  if (g_args.ro === 0 && fso['Get' + att](name).attributes % 2 !== 0) {
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

  g_args.log && util.log(responce.header + '\t' + responce.msg);
  return true;
};

var markCount = Math.max(PPx.EntryMarkCount, 1);
entries.FirstMark;

for (var i = 0; i < markCount; i++) {
  entryIs('Folder', entries.Name) || entryIs('File', entries.Name);
}

var logs = fo.resultlog.call({cmd: g_args.proc, success: success_count, skip: skip_count, error: error_count});
util.log(logs);

if (success_count === 0) {
  !debug && PPx.Quit(1);
}

fo.postproc(g_args.update, util.execute);

var undolog = fo.undologpath();
fo.undologWrite(undolog, result, NL_CHAR);
