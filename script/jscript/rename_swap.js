//!*script
/**
 * Swap filenames between two files
 *
 * NOTE:
 *  If the number of marks is two, the name is swapped between two files.
 *  If the number of marks is less than two, swap with the cursor position file name in the opposite window.
 *  If the files have the same name, the file extension is swapped.
 *  Name swapping between file and directory is not supported.
 */

/* Import modules */
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

// Load modules
var util = module(PPx.Extract('%*getcust(S_ppm#global:module)\\util.js'));
var fo = module(
  PPx.Extract(
    '%*getcust(S_ppm#plugins:ppm-fileoperation)\\script\\%*getcust(S_ppm#global:scripttype)\\mod_fo.js'
  )
);
module = null;

var TITLE = 'ppm-fileoperation';
var NL_CHAR = '\r\n';
// var ppm_lang = PPx.Extract('S_global:language');
var ppm_lang = 'ja';
var mes = {
  ja: {
    same: '同名のファイルがあります',
    notexist: 'エントリを取得できません',
    diffatt: 'ファイルとディレクトリの名前交換はできません',
    filename: 'ファイル名を入れ替えます',
    fileext: '拡張子を入れ替えます',
    window: '反対窓を対象にファイル名を入れ替えます',
    desc: [
      '対象を取得できません',
      '',
      'mark < 2: 反対窓を対象にファイル名交換',
      'mark = 2: マークしたエントリのファイル名交換'
    ]
  },
  en: {
    same: 'There is a file with the same name',
    notexist: 'Cannot get entry',
    diffatt: 'File and directory cannot be renamed',
    filename: 'Swap file names',
    fileext: 'Swap file extentions',
    window: 'Swap file names for the window opposite',
    desc: [
      'Cannot get target',
      '',
      'mark < 2: Opposite window cursor position and file name swapping',
      'mark = 2: Swap file names for marked entries'
    ]
  }
}[ppm_lang];

var fso = PPx.CreateObject('Scripting.FileSystemObject');

var confirm_msg = function (message, e1, e2) {
  !util.interactive(TITLE, message + NL_CHAR + NL_CHAR + e1 + NL_CHAR + e2) && PPx.Quit(-1);
};

var check_exceptions = function (e1, e2, r1, r2) {
  var renamed = [r1, r2];

  for (var i = 2; i--; ) {
    if (fso.FileExists(renamed[i]) && e1 !== renamed[i] && e2 !== renamed[i]) {
      util.quitMsg(mes.same, '', renamed[i]);
    }
  }

  var e1isDir = fso.FolderExists(e1);
  var e2isDir = fso.FolderExists(e2);
  var e1notExist = !e1isDir && !fso.FileExists(e1);
  var e2notExist = !e2isDir && !fso.FileExists(e2);

  if (e1notExist || e2notExist) {
    util.quitMsg(mes.notexist);
  }

  if (e1isDir !== e2isDir) {
    util.quitMsg(mes.diffatt);
  }
};

var assort_entry = function (filename) {
  var name = util.extract('C', '%*name(XN,"' + filename + '")');
  var ext = util.extract('C', '%*name(T,"' + filename + '")');
  ext = ext ? '.' + ext : '';

  return {
    name: name,
    ext: ext,
    filename: util.extract('C', filename)
  };
};

var to_temp_name = function (entry) {
  var name = entry.name + '_ren_' + entry.ext;

  while (fso.FileExists(name) || fso.FolderExists(name)) {
    name = name.replace('_ren_', '__ren__');
  }

  return name;
};

var mark_count = PPx.EntryMarkCount;

if (mark_count === 2) {
  var markedEntry = PPx.Entry;
  markedEntry.FirstMark;
  var entry1 = assort_entry(markedEntry.Name);
  markedEntry.NextMark;
  var entry2 = assort_entry(markedEntry.Name);
  var renamed1, renamed2, msg;

  if (entry1.name === entry2.name) {
    renamed1 = entry1.name + entry2.ext;
    renamed2 = entry2.name + entry1.ext;
    msg = mes.fileext;
  } else {
    renamed1 = entry2.name + entry1.ext;
    renamed2 = entry1.name + entry2.ext;
    msg = mes.filename;
  }

  check_exceptions(entry1.filename, entry2.filename, renamed1, renamed2);
  confirm_msg(msg, entry1.filename, entry2.filename);

  var tempName = to_temp_name(entry1);

  util.execute(
    'C',
      '*rename ' + entry1.filename + ',' + tempName + '%%:' +
      '*rename ' + entry2.filename + ',' + renamed2 + '%%:' +
      '*rename ' + tempName + ',' + renamed1
  ) && PPx.Quit(-1);

  fo.undologWrite(fo.undologpath(), [], NL_CHAR);
} else if (PPx.Pane.Count > 1 && mark_count < 2) {
  var entry1 = assort_entry(util.extract('C', '%FDCN'));
  var entry2 = assort_entry(util.extract('C', '%~FDCN'));
  var renamed1 = util.extract('C', '%FD') + '\\' + entry2.name + entry1.ext;
  var renamed2 = util.extract('C', '%~FD') + '\\' + entry1.name + entry2.ext;

  check_exceptions(entry1.filename, entry2.filename, renamed1, renamed2);
  confirm_msg(mes.window, entry1.filename, entry2.filename);

  util.execute(
    'C',
      '*rename ' + entry1.filename + ',' + renamed1 + '%:' +
      '*rename ' + entry2.filename + ',' + renamed2 + '%:' +
      '%K~"@^F5'
  ) && PPx.Quit(-1);

  var undolog = [
    'Move\t' + entry1.filename,
    ' ->\t' + renamed1,
    'Move\t' + entry2.filename,
    ' ->\t' + renamed2
  ];

  fo.undologWrite(fo.undologpath(), undolog, NL_CHAR);
} else {
  util.quitMsg.apply(this, mes.desc);
}

util.execute('C', '*unmarkentry');
