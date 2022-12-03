//!*script
/**
 * Delete entries to multiple paths
 *
 * @arg {string} 0 *ppcfile delete, additional options.
 */

'use strict';

const NL_CHAR = '\r\n';
const LIST_NAME = 'multipath.txt';
const DEFAULT_OPTS =
  '-min -log:off -undolog:off -querycreatedirectory:off -checkexistfirst -nocount -symdel:sym';

const responce_file = PPx.Extract('%*temp()\\deletes.txt');

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
module = null;

const delete_opts = ((args = PPx.Arguments()) => {
  const addOpts = args.length ? `${args.Item(0)} ` : '';

  return `${addOpts} ${DEFAULT_OPTS}`;
})();

const delete_entries = (destinations) => {
  const entries = util.extract('C', '%%#;FCN').split(';');
  const targets = [];
  let thisPath;

  for (let i = 0, l = destinations.length; i < l; i++) {
    thisPath = destinations[i];

    if (thisPath === '') {
      continue;
    }

    for (let j = 0, k = entries.length; j < k; j++) {
      targets.push(`${thisPath}\\${entries[j]}`.replace(/ /g, '_'));
    }
  }

  util.write.apply({filepath: responce_file, newline: NL_CHAR}, targets);

  return targets;
};

const nl = NL_CHAR.metaNewline('ppx');
const dest_paths = PPx.Extract(
  input.lied.call({
    title: `Multiple Delete / Specify directories separated by spaces`,
    mode: 'd',
    listname: LIST_NAME
  })
)
  .trim()
  .split(' ');
const target_paths = delete_entries(dest_paths);

!util.interactive('Muitiple Operation', `Delete entries?${nl}${nl}${target_paths.join(nl)}`) &&
  PPx.Quit(1);

util.execute('C', `*ppcfile !delete ${delete_opts} -src:"@${responce_file}" -compcmd *focus`);
