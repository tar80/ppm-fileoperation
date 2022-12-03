//!*script
/**
 * Delete entries to multiple paths
 *
 * @arg {string} 0 *ppcfile delete, additional options.
 */

var NL_CHAR = '\r\n';
var LIST_NAME = 'multipath.txt';
var DEFAULT_OPTS =
  '-min -log:off -undolog:off -querycreatedirectory:off -checkexistfirst -nocount -symdel:sym';

var responce_file = PPx.Extract('%*temp()\\deletes.txt');

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
module = null;

var delete_opts = (function (args) {
  var addOpts = args.length ? args.Item(0) + ' ' : '';

  return addOpts + DEFAULT_OPTS;
})(PPx.Arguments);

var delete_entries = function (destinations) {
  var entries = util.extract('C', '%%#;FCN').split(';');
  var targets = [];
  var thisPath;

  for (var i = 0, l = destinations.length; i < l; i++) {
    thisPath = destinations[i];

    if (thisPath === '') {
      continue;
    }

    for (var j = 0, k = entries.length; j < k; j++) {
      targets.push((thisPath + '\\' + entries[j]).replace(/ /g, '_'));
    }
  }

  util.write.apply({filepath: responce_file, newline: NL_CHAR}, targets);

  return targets;
};

var nl = NL_CHAR.metaNewline('ppx');
var dest_paths = PPx.Extract(
  input.lied.call({
    title: 'Multiple Delete / Specify directories separated by spaces',
    mode: 'd',
    listname: LIST_NAME
  })
)
  .trim()
  .split(' ');
var target_paths = delete_entries(dest_paths);

!util.interactive('Muitiple Operation', 'Delete entries?' + nl + nl + target_paths.join(nl)) &&
  PPx.Quit(1);

util.execute(
  'C',
  '*ppcfile !delete ' + delete_opts + ' -src:"@' + responce_file + '" -compcmd *focus'
);
