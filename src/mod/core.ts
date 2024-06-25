import '@ppmdev/polyfills/arrayIncludes.ts';
import type {Error_String, Level_String, ErrorLevel} from '@ppmdev/modules/types.ts';
import fso from '@ppmdev/modules/filesystem.ts';
import {readLines, writeLines} from '@ppmdev/modules/io.ts';
import {pathSelf} from '@ppmdev/modules/path.ts';
import {isEmptyStr} from '@ppmdev/modules/guard.ts';
import {useLanguage, info} from '@ppmdev/modules/data.ts';
import {langCore} from './language.ts';
import debug from '@ppmdev/modules/debug.ts';

const CONFIRM_TITLE = 'ppm-fileoperation';

export const nl = info.nlcode;
export const uselang = useLanguage();
const lang = langCore[uselang];
const {parentDir} = pathSelf();

const _dialog = (type: 'I' | 'Q', message: string): boolean => PPx.Execute(`%"${CONFIRM_TITLE}" %OC %${type}"${message}"`) === 0;
const _hasTargetId = (id: string): boolean => id !== '.';

export const ppmin = {
  echo(message: string, errorlevel?: number): boolean {
    const tail = errorlevel ? `(${String(errorlevel)})` : '';
    return _dialog('I', `${message}${tail}`);
  },
  question(message: string): boolean {
    return _dialog('Q', message);
  },
  execute(ppxid: string, command: string, wait = false): ErrorLevel {
    if (isEmptyStr(command)) {
      return 1;
    }

    if (_hasTargetId(ppxid)) {
      return wait ? Number(PPx.Extract(`%*extract(${ppxid},"${command}%%:0")`)) : PPx.Execute(`*execute ${ppxid},${command}`);
    } else {
      return PPx.Execute(command);
    }
  },
  extract(ppxid: string, value: string): Level_String {
    if (isEmptyStr(value)) {
      return [13, ''];
    }

    const data = _hasTargetId(ppxid) ? PPx.Extract(`%*extract(${ppxid},"${value}")`) : PPx.Extract(value);
    const errorlevel = Number(PPx.Extract());

    return [errorlevel, data];
  }
};

const UNDOLOG_FILENAME = 'PPXUNDO.LOG';
const UNDOLOG_FILEENCODE = 'utf16le';

export const undologPath = (): string => {
  let logpath = PPx.Extract(`%*getcust(X_save)%\\${UNDOLOG_FILENAME}`);

  if (!~logpath.indexOf(':')) {
    logpath = PPx.Extract('%0%\\') + logpath;
  }

  if (!debug.jestRun()) {
    PPx.Execute(`%OC *execute ,*ifmatch "o:e,a:d-","${logpath}"%%:*stop%bn*makefile "${logpath}"%%&`);
  }

  return logpath;
};

export const undologRead = () => readLines({path: undologPath(), enc: UNDOLOG_FILEENCODE, linefeed: nl});

export const undologWrite = (data: string[]) => {
  const [error, errorMsg] = writeLines({
    path: undologPath(),
    data,
    enc: UNDOLOG_FILEENCODE,
    linefeed: nl,
    overwrite: true
  });

  if (error) {
    debug.log(errorMsg);
  }
};

const _notExist = (filename: string, isDir: boolean): boolean => {
  const method = isDir ? 'FolderExists' : 'FileExists';

  return !fso[method](filename);
};

type EntryDetails = ReturnType<typeof entryDetails>;
const entryDetails = (filepath: string) => {
  const name = ppmin.extract('C', `%%*name(XN,""${filepath}"")`)[1];
  const ext = ppmin.extract('C', `%%*name(T,""${filepath}"")`)[1];

  return {filepath, name, ext, type: PPx.GetFileInformation(filepath)};
};

const checkExistence = (presents: string[], newnames: string[], filetypes: string[]): Error_String => {
  const isDir = [false, false];

  for (let i = 2; i--; ) {
    if (filetypes[i] === ':DIR') {
      isDir[i] = true;
    }

    if (_notExist(presents[i], isDir[i])) {
      return [true, lang.notExist];
    } else if (fso.FileExists(newnames[i]) && !presents.includes(newnames[i])) {
      return [true, `${lang.sameName}${nl}${nl}${newnames[i]}`];
    }
  }

  if (isDir[0] !== isDir[1]) {
    return [true, lang.diffType];
  }

  return [false, ''];
};

const createUniqName = (entry: EntryDetails): string => {
  let name = `${entry.name}_ren_.${entry.ext}`;

  while (fso.FileExists(name) || fso.FolderExists(name)) {
    name = name.replace('_ren_', '__ren__');
  }

  return name;
};

export const pairsExtract = (method: string, value?: string) => {
  const item = value ? `${method}('${value.replace(/\\/g, '\\\\')}')` : method;

  return ppmin.extract('~', `%%*js(""PPx.result=PPx.${item};"")`);
};

const _getAttribute = (num: number): string => {
  switch (num) {
    case 1:
    case 3:
      return 'DIR';
    case 4:
      return 'LISTFILE';
    case 5:
    case 6:
    case 7:
    case 8:
    case 10:
    case 21:
      return 'SPECIAL';
    case 63:
    case 64:
    case 96:
      return 'ARCHIVE';
    default:
      return 'NA';
  }
};

type ParentDetail = ReturnType<typeof parentDetails>;
const parentDetails = (wd: string, owd: string) => {
  const currentDirtype = _getAttribute(PPx.DirectoryType);
  const pairsDirtype = _getAttribute(Number(pairsExtract('DirectoryType')[1]));

  return {send: {dir: wd, dirtype: currentDirtype}, dest: {dir: owd, dirtype: pairsDirtype}};
};

const switchMethod = (method: number, send: ParentDetail['send'], dest: ParentDetail['dest'], isMove = false) => {
  if (method !== 0) {
    if (/LISTFILE|SPECIAL/.test(send.dirtype + dest.dirtype)) {
      method = 0;
    } else if (isMove && send.dir.slice(0, 1).toUpperCase() !== dest.dir.slice(0, 1).toUpperCase()) {
      method = 0;
    }
  }

  return method;
};

type CmdParameters = Exclude<ReturnType<typeof cmdParameters>, void>;
const cmdParameters = (
  dest: ParentDetail['dest'],
  immediate: boolean,
  samename: string
): void | {destPath: string; opts: string; compcmd: string; ok: boolean} => {
  let opts = `-same:${samename} ${PPx.Extract('%*getcust(S_ppm#user:fo_options)')}`;
  const ok = dest.dirtype !== 'NA';

  if (ok) {
    if (immediate) {
      opts = `-start -min ${opts}`;
    }

    return {destPath: dest.dir, opts, compcmd: '', ok};
  } else if (isEmptyStr(dest.dir)) {
    return {
      destPath: '%*getcust(S_ppm#user:work)%\\',
      opts,
      compcmd: ' -compcmd *ppc -pane:~ "%%hd0" -k *jumppath -entry:"%%R"',
      ok
    };
  }
};

const ppcfile = (action: string, param: CmdParameters): boolean => {
  const options = isEmptyStr(param.compcmd) ? param.opts : `${param.opts}${param.compcmd}`;

  if (debug.jestRun()) {
    // @ts-ignore
    return `*ppcfile ${action},${param.destPath},${options}`;
  }

  ppmin.execute('C', `*ppcfile ${action},${param.destPath},%(${options}%)`);

  return param.ok;
};

// export const getArchiverName = (): void | string => {
//   const ppxPath = PPx.Extract('%0%\\');
//   const names = ['7-zip64.dll', '7-zip32.dll'];

//   if (fso.FileExists(`${ppxPath}${names[0]}`)) {
//     return names[0];
//   }

//   if (fso.FileExists(`${ppxPath}${names[1]}`)) {
//     return names[1];
//   }
// };

const expandFiles = (destPath: string): void => {
  ppmin.execute('C', `*unpack "${destPath}"`);
};

type FileSystemType = 'Folder' | 'File';
type CountKeys = 'success' | 'skip' | 'error' | 'pass';
type ResultCount = {[K in CountKeys]: number} & {undoData: string[]};

export const performMove = (
  perlog: boolean,
  sendDir: string,
  filename: string,
  destDir: string,
  {success, skip, error, pass, undoData}: ResultCount
): ResultCount => {
  const sendPath = `${sendDir}\\${filename}`;
  const destPath = `${destDir}\\${filename}`;
  const filetype: FileSystemType = PPx.GetFileInformation(filename) === ':DIR' ? 'Folder' : 'File';

  if (!fso[`${filetype}Exists`](sendPath)) {
    pass++;

    return {success, skip, error, pass, undoData};
  }

  const log: Record<string, string> = {message: filename};
  const dupEntry = fso[`${filetype}Exists`](destPath);

  if (dupEntry) {
    skip++;
    log['header'] = 'Skip';
  } else {
    try {
      if (debug.jestRun()) {
        if (pass !== 0) {
          throw new Error('debug');
        }
      } else {
        fso[`Move${filetype}`](sendPath, destPath);
      }

      undoData.push(`Move\t${sendPath}${nl} ->\t${destPath}`);
      success++;
      log['header'] = 'Move';
    } catch (err: any) {
      error++;
      log['header'] = err;
      PPx.EntryState = 0;
    }
  }

  !!perlog && PPx.linemessage(`${log.header}\t${log.message}`);

  return {success, skip, error, pass, undoData};
};

const symlinkCmdline = (destPath: string, cmdline: string[] = []) => {
  const paths = ppmin.extract('C', '%%#;FDCSN')[1].split(';');
  const names = ppmin.extract('C', '%%#;FCN')[1].replace(/ /g, '_').split(';');

  if (!fso.FolderExists(destPath)) {
    ppmin.execute('C', `*makedir ${destPath}`);
  }

  for (let i = 0, path, name, isDir; i < names.length; i++) {
    [path, name] = [paths[i], names[i]];
    isDir = PPx.GetFileInformation(path) === ':DIR' ? '/D ' : '';
    cmdline.push(`"${isDir}${destPath}\\${name} ${path}"`);
  }

  return cmdline;
};

const elevatePPb = (name: string) => {
  PPx.Execute(`%Obnq *ppb -c schtasks /run /tn ${name}%:*wait 1000,2`);

  return '';
};

const symlink = (cmdline: string[], taskName: string) => {
  const option = isEmptyStr(taskName) ? '%Obdq ' : elevatePPb(taskName);
  ppmin.execute('C', `%(${option}FOR %%i IN (${cmdline.join(',')}) DO mklink %%~i>nul%&%K~"@^F5"%)`);
};

const getFcPath = (): string | false => {
  const fcpath = PPx.Extract('%*getcust(S_ppm#user:fo_fcdir)\\fastcopy.exe');

  return fso.FileExists(fcpath) && fcpath;
};

const fastCopy = (destPath: string, immediate: boolean, cmdvalue: string) => {
  const fcpath = getFcPath();

  if (!fcpath) {
    ppmin.echo(lang.couldNotGetFc);

    return;
  }

  const noExec = !immediate ? '/no_exec' : undefined;
  const logPath = PPx.Extract('%*name(DCU,"%*temp()%\\fastcopy.log")');
  const markCount = PPx.EntryMarkCount;
  const fcoptions = [
    '%*getcust(S_ppm#user:fo_fcoptions)',
    noExec,
    `/cmd=${cmdvalue}`,
    `/filelog="${logPath}"`,
    ppmin.extract('C', '%%#FDC')[1],
    `/to="${destPath}%%\\"`
  ].join(' ');

  PPx.Execute(
    `*maxlength 10000%:*pptray -c %%Oq ${fcpath} ${fcoptions}%%&*script ${parentDir}\\resultFastcopy.js,"${logPath}",${markCount}`
  );

  return;
};

const getTrash = (name: string): string | void => {
  const path = PPx.Extract(`%*extract(C,"%*getcust(S_ppm#user:fo_trash)")%\\${name}\\`);

  if (!fso.FolderExists(path)) {
    if (ppmin.question(`${path} ${lang.createTrash}`)) {
      fso.CreateFolder(path);
    } else {
      return;
    }
  }

  return path;
};

export const performSafeDel = (
  perlog: boolean,
  sendDir: string,
  filename: string,
  destDir: string,
  {success, skip, error, pass, undoData}: ResultCount
): ResultCount => {
  const sendPath = `${sendDir}\\${filename}`;
  const filetype: FileSystemType = PPx.GetFileInformation(filename) === ':DIR' ? 'Folder' : 'File';

  if (!fso[`${filetype}Exists`](sendPath)) {
    pass++;

    return {success, skip, error, pass, undoData};
  }

  const dirName = PPx.Extract(`${destDir}\\%*now(data)`);
  !fso.FolderExists(dirName) && fso.CreateFolder(dirName);
  const destPath = PPx.Extract(`%*name(DCUN,"${dirName}\\${filename}")`);
  const displayLog: Record<string, string> = {message: PPx.Extract(`%*name(CN,"${destPath}")`)};

  try {
    if (debug.jestRun()) {
      if (pass !== 0) {
        throw new Error('debug');
      }
    } else {
      fso[`Move${filetype}`](sendPath, destPath);
    }

    undoData.push(`Backup\t${sendPath}${nl} ->\t${destPath}${nl}Delete\t${filename}`);
    success++;
    displayLog['header'] = 'SafeDel';
  } catch (err: any) {
    error++;
    displayLog['header'] = err;
    PPx.EntryState = 0;
  }

  !!perlog && PPx.linemessage(`${displayLog.header}\t${displayLog.message}`);

  return {success, skip, error, pass, undoData};
};

type FileOperation = 'MoveFS' | 'SafeDel';
type PerformOperation = typeof performMove | typeof performSafeDel;

const fileOperation = (att: FileOperation, perform: PerformOperation, perlog: boolean, sendDir: string, dest: ParentDetail['dest']) => {
  const entry = PPx.Entry;
  const markCount = Math.max(PPx.EntryMarkCount, 1);
  let result: ResultCount = {success: 0, skip: 0, error: 0, pass: 0, undoData: []};
  entry.FirstMark;

  do {
    result = perform(perlog, sendDir, entry.Name, dest.dir, result);
  } while (entry.NextMark);

  result.success > 0 && undologWrite(result.undoData);
  PPx.linemessage(resultMsg(att, markCount, result));

  return result.error === 0 && dest.dirtype !== 'NA';
};

export const ignoreValidTempDir = (): string => {
  const ppcids = PPx.Extract('%*ppxlist(-C)').split(',');
  const names: string[] = [];

  for (const id of ppcids) {
    const name = PPx.Extract(`%*extract(${id},"!%%*name(C,""%%*temp()"")")`);

    if (!names.includes(name)) {
      names.push(name);
    }
  }

  return names.join(';').replace(/\./g,'*');
};

export const datetime = (): string => {
  if (debug.jestRun()) {
    return '%bttest';
  }

  const format = PPx.Extract('%*getcust(S_ppm#user:fo_datetime)');

  return isEmptyStr(format) ? '' : PPx.Extract(`%bt%*nowdatetime("${format}")`);
};

export const resultMsg = (cmd: string, total: number, {success, skip, error, pass}: Omit<ResultCount, 'undoData'>) => {
  let msg = `${cmd}\t${success}/${total}`;
  const details: string[] = [];
  skip > 0 && details.push(`Skip:${skip}`);
  error > 0 && details.push(`Error:${error}`);
  pass > 0 && details.push(`Pass:${pass}`);

  if (details.length > 0) {
    msg = `${msg} [${details.join(',')}]`;
  }

  return `${msg}${datetime()}`;
};

const updateWindow = (reload: boolean) =>
  reload ? PPx.Execute('*execute C,%%K"@F5"') : PPx.Execute('*execute C,*unmarkentry path:%%:%%K"@^F5"');
const updatePairWindow = () => PPx.Execute('*ifmatch C*,%~n%:%K~"@^F5"');

export const renameSwap = {entryDetails, checkExistence, createUniqName};
export const moveFile = {
  parentDetails,
  cmdParameters,
  switchMethod,
  ppcfile,
  expandFiles,
  fileOperation,
  performMove,
  updateWindow,
  updatePairWindow
};
export const copyFile = {
  parentDetails,
  cmdParameters,
  switchMethod,
  ppcfile,
  expandFiles,
  updatePairWindow,
  symlinkCmdline,
  symlink,
  fastCopy
};
export const multiCopy = {
  symlinkCmdline,
  symlink,
  getFcPath
};
export const fileDelete = {getTrash, fileOperation, performSafeDel, updateWindow};
export const processUndo = {undologRead, undologWrite, updatePairWindow};
