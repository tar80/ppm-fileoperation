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

'use strict';

/* Import modules */
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

// Load modules
const util = module(PPx.Extract('%*getcust(S_ppm#global:module)\\util.js'));
const fo = module(
  PPx.Extract(
    '%*getcust(S_ppm#plugins:ppm-fileoperation)\\script\\%*getcust(S_ppm#global:scripttype)\\mod_fo.js'
  )
);
module = null;

const TITLE = 'ppm-fileoperation';
const NL_CHAR = '\r\n';
// const ppm_lang = PPx.Extract('S_global:language');
const ppm_lang = 'ja';
const mes = {
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

const fso = PPx.CreateObject('Scripting.FileSystemObject');

const confirm_msg = (message, e1, e2) => {
  return util.interactive(TITLE, `${message}${NL_CHAR}${NL_CHAR}${e1}${NL_CHAR}${e2}`);
};

const check_exceptions = (e1, e2, r1, r2) => {
  const renamed = [r1, r2];

  for (let i = 2; i--; ) {
    if (fso.FileExists(renamed[i]) && ![e1, e2].includes(renamed[i])) {
      return [mes.same, '', renamed[i]];
    }
  }

  const e1isDir = fso.FolderExists(e1);
  const e2isDir = fso.FolderExists(e2);
  const e1notExist = !e1isDir && !fso.FileExists(e1);
  const e2notExist = !e2isDir && !fso.FileExists(e2);

  if (e1notExist || e2notExist) {
    return [mes.notexist];
  }

  if (e1isDir !== e2isDir) {
    return [mes.diffatt];
  }
};

const assort_entry = (filename) => {
  const name = util.extract('C', `%%*name(XN,""${filename}"")`);
  let ext = util.extract('C', `%%*name(T,""${filename}"")`);
  ext = ext ? `.${ext}` : '';

  return {
    name: name,
    ext: ext,
    filename: util.extract('C', filename)
  };
};

const to_temp_name = (entry) => {
  let name = `${entry.name}_ren_${entry.ext}`;

  while (fso.FileExists(name) || fso.FolderExists(name)) {
    name = name.replace('_ren_', '__ren__');
  }

  return name;
};

const mark_count = PPx.EntryMarkCount;

if (mark_count === 2) {
  const markedEntry = PPx.Entry;
  markedEntry.FirstMark;
  const entry1 = assort_entry(markedEntry.Name);
  markedEntry.NextMark;
  const entry2 = assort_entry(markedEntry.Name);
  const [renamed1, renamed2, msg] = {
    true: [`${entry1.name}${entry2.ext}`, `${entry2.name}${entry1.ext}`, mes.fileext],
    false: [`${entry2.name}${entry1.ext}`, `${entry1.name}${entry2.ext}`, mes.filename]
  }[entry1.name === entry2.name];

  const err = check_exceptions(entry1.filename, entry2.filename, renamed1, renamed2);
  err !== undefined && util.quitMsg.apply(err);
  !confirm_msg(msg, entry1.filename, entry2.filename) && PPx.Quit(-1);

  const tempName = to_temp_name(entry1);

  util.execute(
    'C',
    `*rename ${entry1.filename},${tempName}
     *rename ${entry2.filename},${renamed2}
     *rename ${tempName},${renamed1}`
  );

  fo.undologWrite(fo.undologpath(), [], NL_CHAR);
} else if (PPx.Pane.Count > 1 && mark_count < 2) {
  const entry1 = assort_entry(util.extract('C', '%FDCN'));
  const entry2 = assort_entry(util.extract('C', '%~FDCN'));
  const renamed1 = `${util.extract('C', '%FD')}\\${entry2.name}${entry1.ext}`;
  const renamed2 = `${util.extract('C', '%~FD')}\\${entry1.name}${entry2.ext}`;

  const err = check_exceptions(entry1.filename, entry2.filename, renamed1, renamed2);
  err !== undefined && util.quitMsg.apply(err);
  !confirm_msg(mes.window, entry1.filename, entry2.filename) && PPx.Quit(-1);

  util.execute(
    'C',
    `*rename ${entry1.filename},${renamed1}
     *rename ${entry2.filename},${renamed2}
     %K~"@^F5"`
  );

  const undolog = [
    `Move\t${entry1.filename}`,
    ` ->\t${renamed1}`,
    `Move\t${entry2.filename}`,
    ` ->\t${renamed2}`
  ];

  fo.undologWrite(fo.undologpath(), undolog, NL_CHAR);
} else {
  util.quitMsg(...mes.desc);
}

util.execute('C', '*unmarkentry');
