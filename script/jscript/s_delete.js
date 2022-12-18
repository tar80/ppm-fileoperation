//!*script
/**
 * Deletion
 *
 * @arg {number} 0 If nonzero, output message per file
 * @arg {number} 1 If nonzero, update entry-list after the delete process is completed
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
  PPx.Extract(
    '%*getcust(S_ppm#plugins:ppm-fileoperation)\\script\\%*getcust(S_ppm#global:scripttype)\\mod_fo.js'
  )
);
module = null;

var g_args = (function (args) {
  var arr = [0, 0, 0, 0];

  for (var i = 0, l = args.length; i < l; i++) {
    arr[i] = args.Item(i) | 0;
  }

  return {
    log: Boolean(arr[0]),
    update: arr[1]
  };
})(PPx.Arguments);

var working_dir = util.extract('C', '%%1%%\\');
var trash_dir = util.extract('_', '%*getcust(S_ppm#user:fo_trash)%\\deleted$\\');

if (~working_dir.indexOf('deleted$')) {
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
var safe_delete = function (method, send, name) {
  var pwd = PPx.Extract(trash_dir + '\\%*now(date)');

  if (!fso.FolderExists(pwd)) {
    fso.CreateFolder(pwd);
  }

  var dest = PPx.Extract('%*name(DCUN,"' + pwd + '\\' + name + '")');

  debug
    ? util.execute('C', 'fso.Move' + method + '(' + send + name + ', ' + dest + ')')
    : fso['Move' + method](send + name, dest);
  result.push('Backup\t' + send + name + NL_CHAR + ' ->\t' + dest + NL_CHAR + 'Delete\t' + name);
  return PPx.Extract('%*name(CN,"' + dest + '")');
};

var success_count = 0;
var skip_count = 0;
var error_count = 0;
var responce = {};
var entries = PPx.Entry;

var entry_delete = function (name) {
  var entryAtt = fo.exist(name);

  if (!entryAtt) {
    return false;
  }

  try {
    responce = {header: 'SafeDel', msg: safe_delete(entryAtt, working_dir, name)};
    entries.State = 1;
    success_count++;
  } catch (err) {
    responce = {header: err, msg: name};
    error_count++;
  } finally {
    entries.NextMark;
  }

  g_args.log && util.log(responce.header + '\t' + responce.msg);
  return true;
};

var markCount = Math.max(PPx.EntryMarkCount, 1);

entries.FirstMark;

for (var i = 0; i < markCount; i++) {
  entry_delete(entries.Name);
}

var logs = fo.resultlog.call({
  cmd: 'SafeDel',
  success: success_count,
  skip: skip_count,
  error: error_count
});
util.log(logs);

if (success_count === 0) {
  !debug && PPx.Quit(1);
}

fo.postproc(g_args.update, util.execute);

var undolog = fo.undologpath();
fo.undologWrite(undolog, result, NL_CHAR);
