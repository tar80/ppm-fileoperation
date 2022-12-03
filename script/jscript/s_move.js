//!*script
/**
 * Move files to suit the situation
 *
 * @arg {number} 0 How the ppcfile command is start. 0=detail | 1=quick
 * @arg {number} 1 If nonzero, use FileSystem MoveFile to regular move. 0=false | 1=true(rename:false) | 2=true(rename:true)
 * @arg {number} 2 If nonzero, MoveFile output message per file
 * @arg {number} 3 If nonzero, update entry-list after the move process is completed
 * @arg {number} 4 If nonzero, target parent directory. Move up files.
 * @arg {number} 5 If nonzero, Specify *ppcfile "-same" option number. default=3(skip)
 * NOTE:arg(1) "rename:" means rename to the destination file of same name. If false, skip. On MoveFile.
 */

var NL_CHAR = '\r\n';
var debug = typeof ppm_test_run !== 'undefined' ? ppm_test_run : 0;

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
var util = module(PPx.Extract('%*getcust(S_ppm#global:ppm)\\module\\jscript\\util.js'));
// var util = module(PPx.Extract('%*getcust(S_ppm#global:module)\\util.js'));
var fo = module(
  PPx.Extract('%*getcust(S_ppm#plugins:ppm-fileoperation)\\script\\%*getcust(S_ppm#global:scripttype)\\mod_fo.js')
);
module = null;

var g_args = (function (args) {
  var arr = [0, 0, 0, 0, 0, 0, 3];
  for (var i = 0, l = args.length; i < l; i++) {
    arr[i] = args.Item(i) | 0;
  }

  return {
    proc: arr[0],
    useFS: arr[1],
    log: arr[2],
    update: arr[3],
    upper: arr[4],
    same: arr[5]
  };
})(PPx.Arguments);

var target_path = g_args.upper === 0 ? util.extract('C', '%%2') : util.extract('C', '%%*name(D,""%%1"")');

/**
 * Paired window details
 *
 * @return {object} {path: dest, ext: dirtype}
 */
var target_dir = fo.pairedWindow(target_path);

/**
 * Destination sort
 *
 * @return {array} [process, dest, add-options, compcmd]
 */
var move_detail = fo.detail(target_dir.ext, g_args.proc, target_dir.path, g_args.same);

// Move command values
var move = fo.command('move', move_detail);

var fso = PPx.CreateObject('Scripting.FileSystemObject');

var result = [];

// Execute Move command
if (/[62|63|96]/.test(Number(util.extractJS('C', 'DirectoryType')))) {
  // for Archive
  fo.imcompatible(target_dir.ext, 'Cannot move from archive to ListFile');
  fo.sevenzip(
    input.lied.call({
      text: move.dest,
      title: 'Expand selected files / Skip duplicate names',
      mode: 'd'
    })
  );
} else {
  // for Regular
  g_args.useFS !== 0 && target_dir.ext === ':DIR' ? filesystem_move() : fo.run(move, util.execute);
}

fo.postproc(g_args.update, util.execute);

function fsmove(duplicate, method, source, dest, name) {
  if (duplicate) {
    var newName = PPx.Extract('%*name(CU,"' + dest + '")');
    var stDest = fso.GetFile(dest);
    dest = fso.BuildPath(stDest.ParentFolder, newName);
  }

  fso[method](source, dest);
  result.push('Move\t' + source + NL_CHAR + ' ->\t' + dest);
  return name;
}

function filesystem_move() {
  if (PPx.Extract('%n').indexOf('C') !== 0) {
    debug === 0 && util.quitMsg('filesystem-move only works on PPc');
  }

  var success_count = 0;
  var skip_count = 0;
  var error_count = 0;
  var pass_count = 0;
  var responce = {};
  var entries = PPx.Entry;

  var entryIs = function (att, entry, pairwise, name) {
    var method = att + 'Exists';

    if (!fso[method](name)) {
      return false;
    }

    var hasDuplicate = fso[method](pairwise);

    if (hasDuplicate && g_args.useFS !== 2) {
      responce = {header: 'Skip', msg: name};
      skip_count++;
    } else {
      try {
        responce = {
          header: 'Move',
          msg: fsmove(hasDuplicate, 'Move' + att, entry, pairwise, name)
        };
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

  var wd = PPx.extract('%1%\\');
  var markCount = Math.max(PPx.EntryMarkCount, 1);

  entries.FirstMark;

  for (var i = 0; i < markCount; i++) {
    var thisName = entries.Name;
    var thisEntry = wd + thisName;
    var pairedEntry = fso.BuildPath(target_dir.path, thisName);

    entryIs('Folder', thisEntry, pairedEntry, thisName) ||
      entryIs('File', thisEntry, pairedEntry, thisName) ||
      pass_count++;
  }

  var logs = fo.resultlog.call({
    cmd: 'Move',
    success: success_count,
    skip: skip_count,
    error: error_count,
    pass: pass_count
  });
  util.log(logs);

  if (success_count === 0) {
    debug === 0 && PPx.Quit(1);
  }

  if (target_dir.ext !== 'na') {
    fo.pairedUpdate();
  }

  var undolog = fo.undologpath();
  fo.undologWrite(undolog, result, NL_CHAR);
}
