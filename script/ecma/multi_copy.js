//!*script
/**
 * Copy entries to multiple paths
 *
 * @arg {number} 0 - How the process is started. 0=ppcfile | 1=fastcopy | 2=symlink
 * @arg {number} 1 - How to process files with the same name. 0=skip | 1=update | 2=overwrite
 * @arg {string} 2 - *ppcfile copy, additional options
 * @arg {string} 3 - for symbolic-links. Specify the Scheduler task-name if you use an elevate-PPb
 */

'use strict';

const NL_CHAR = '\r\n';
const LIST_NAME = 'multipath.txt';
const DEFAULT_OPTS =
  '-min -log:off -undolog:off -querycreatedirectory:off -checkexistfirst -nocount';
let prefix_opt = '%Obdq ';

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

const copy = ((args = PPx.Arguments()) => {
  const arr = ['0', '0', '', null];

  for (let i = 0, l = args.length; i < l; i++) {
    arr[i] = args.Item(i) === '_' ? arr[i] : args.Item(i);
  }

  const samename = {
    0: {ppc: 3, fc: 'noexist_only'},
    1: {ppc: 0, fc: 'update'},
    2: {ppc: 2, fc: 'force_copy'}
  }[arr[1]];

  var option = arr[0] === '1' ? samename.fc : `${arr[2]} ${DEFAULT_OPTS} -sameall -same:${samename.ppc}`

  return {
    proc: {0: 'Copy', 1: 'FastCopy', 2: 'Link'}[arr[0]],
    opt: option,
    useTask: arr[3]
  };
})();

const dest_paths = PPx.Extract(input.lied.call({
  title: `Multiple ${copy.proc} / Specify directories separated by spaces`,
  mode: 'd',
  listname: LIST_NAME
})).trim().split(' ');

const nl = NL_CHAR.metaNewline('ppx');
!util.interactive(
  'Muitiple Operation',
  `${copy.proc} entries to multiple directories?${nl}${nl}${dest_paths.join(nl)}`
) && PPx.Quit(1);

const ppx_copy = (dirname, option) =>
  util.execute('C', `*wait 100,2%%:*ppcfile !copy -dest:${dirname} ${option}`);
const fast_copy = (dirname, option) => {
  const fc = fo.fastcopy();

  util.execute(
    'C',
    `%(*cd ${fc.parent}%:` +
      `${prefix_opt}fcp.exe /cmd=${option} /force_start=2 /verify /error_stop /log=false` +
      ` /filelog=${fc.log} /postproc=false ${util.extract('C', '%%#FDCSN')} /to=${dirname}%\\%&%)`
  );
};

const sym_cmdline = [];
const sym_link = (dirname) => {
  const files = util.extract('C', '%%#;FCN').replace(/ /g, '_').split(';');
  const sendPath = util.extract('C', '%%#;FDCSN').split(';');

  if (!fso.FolderExists(dirname)) {
    util.execute('C', `*makedir ${dirname}`);
  }

  for (let i = 0, l = files.length; i < l; i++) {
    const thisFile = files[i];
    const thisPath = sendPath[i];
    const isDir = PPx.GetFileInformation(thisPath) === ':DIR' ? '/D ' : '';
    sym_cmdline.push(`"${isDir}${dirname}\\${thisFile} ${thisPath}"`);
  }
};

if (copy.proc === 'Link' && copy.useTask !== null) {
  prefix_opt = fo.elevatePPb(copy.useTask);
}

const multicopy_run = (process, destinations) => {
  const callback = {
    Copy: ppx_copy,
    FastCopy: fast_copy,
    Link: sym_link
  }[process];

  for (let i = 0, l = destinations.length; i < l; i++) {
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
