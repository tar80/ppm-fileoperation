//!*script
/**
 * Copy entries to multiple paths
 *
 * @arg {number} 0 - How the process is started. 0=ppcfile | 1=fastcopy | 2=symlink
 * @arg {number} 1 - How to process files with the same name. 0=skip | 1=update | 2=overwrite
 * @arg {string} 2 - *ppcfile copy, additional options
 * @arg {string} 3 - for symbolic-links. Specify the Scheduler task-name if you use an elevate-PPb
 */

var NL_CHAR = '\r\n';
var LIST_NAME = 'multipath.txt';
var DEFAULT_OPTS = '-min -log:off -undolog:off -querycreatedirectory:off -checkexistfirst -nocount';
var prefix_opt = '%Obdq ';

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
  PPx.Extract('%*getcust(S_ppm#plugins:ppm-fileoperation)\\script\\jscript\\mod_fo.js')
);
module = null;

var fso = PPx.CreateObject('Scripting.FileSystemObject');

var copy = (function (args) {
  var arr = ['0', '0', '', null];

  for (var i = 0, l = args.length; i < l; i++) {
    arr[i] = args.Item(i) === '_' ? arr[i] : args.Item(i);
  }

  var samename = {
    0: {ppc: 3, fc: 'noexist_only'},
    1: {ppc: 0, fc: 'update'},
    2: {ppc: 2, fc: 'force_copy'}
  }[arr[1]];

  var option = arr[0] === '1' ? samename.fc : arr[2] + ' ' + DEFAULT_OPTS + ' -sameall -same:' + samename.ppc

  return {
    proc: {0: 'Copy', 1: 'FastCopy', 2: 'Link'}[arr[0]],
    opt: option,
    useTask: arr[3]
  };
})(PPx.Arguments);

var dest_paths = PPx.Extract(
  input.lied.call({
    title: 'Multiple ' + copy.proc + ' / Specify directories separated by spaces',
    mode: 'd',
    listname: LIST_NAME
  })
)
  .trim()
  .split(' ');

var nl = NL_CHAR.metaNewline('ppx');
!util.interactive(
  'Muitiple Operation',
  copy.proc + ' entries to multiple directories?' + nl + nl + dest_paths.join(nl)
) && PPx.Quit(1);

var ppx_copy = function (dirname, option) {
  util.execute('C', '*wait 100,2%%:*ppcfile !copy -dest:' + dirname + ' ' + option);
};
var fast_copy = function (dirname, option) {
  var fc = fo.fastcopy();

  util.execute(
    'C',
    '%(*cd ' +
      fc.parent +
      '%:' +
      prefix_opt +
      'fcp.exe /cmd=' + option + ' /force_start=2 /verify /error_stop /log=false /filelog=' +
      fc.log +
      ' /postproc=false ' +
      util.extract('C', '%%#FDCSN') +
      ' /to=' +
      dirname +
      '%\\%&%)'
  );
};

var sym_cmdline = [];
var sym_link = function (dirname) {
  var files = util.extract('C', '%%#;FCN').replace(/ /g, '_').split(';');
  var sendPath = util.extract('C', '%%#;FDCSN').split(';');

  if (!fso.FolderExists(dirname)) {
    util.execute('C', '*makedir ' + dirname);
  }

  for (var i = 0, l = files.length; i < l; i++) {
    var thisFile = files[i];
    var thisPath = sendPath[i];
    var isDir = PPx.GetFileInformation(thisPath) === ':DIR' ? '/D ' : '';
    sym_cmdline.push('"' + isDir + dirname + '\\' + thisFile + ' ' + thisPath + '"');
  }
};

if (copy.proc === 'Link' && copy.useTask !== null) {
  prefix_opt = fo.elevatePPb(copy.useTask);
}

var multicopy_run = function (process, destinations) {
  var callback = {
    Copy: ppx_copy,
    FastCopy: fast_copy,
    Link: sym_link
  }[process];

  for (var i = 0, l = destinations.length; i < l; i++) {
    var dest = destinations[i];

    if (dest === '') {
      continue;
    }

    callback(dest, copy.opt);
  }

  if (sym_cmdline.length !== 0) {
    fo.symlink(prefix_opt, sym_cmdline);
  }
};

multicopy_run(copy.proc, dest_paths);
