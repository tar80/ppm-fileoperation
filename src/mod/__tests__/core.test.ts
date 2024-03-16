import PPx from '@ppmdev/modules/ppx.ts';
global.PPx = Object.create(PPx);
import {nl, undologPath, renameSwap, pairsExtract, moveFile, performMove, resultMsg, datetime} from '../core.ts';
import {execSync} from 'child_process';

describe('undologPath()', function () {
  it('check the path of undolog', () => {
    const xsave = PPx.Extract('%*getcust(X_save)');
    expect(undologPath()).toEqual(`${xsave}\\PPXUNDO.LOG`);
  });
});

describe('entryDetails()', function () {
  it('pass directory', () => {
    const filepath = 'c:\\windows';
    const name = 'windows';
    const ext = '';
    const type = ':DIR';
    expect(renameSwap.entryDetails(filepath)).toEqual({filepath, name, ext, type});
  });
  it('pass text-file', () => {
    const filepath = 'c:\\users\\doc\\test.txt';
    const name = 'test';
    const ext = 'txt';
    const type = ':TXT';
    expect(renameSwap.entryDetails(filepath)).toEqual({filepath, name, ext, type});
  });
});

describe('pairsExtract()', function () {
  it('no argument pattern', () => {
    expect(pairsExtract('DirectoryType')).toEqual([0, '1']);
  });
  it('has an argument pattern', () => {
    expect(pairsExtract('GetFileInformation', PPx.Extract('%~FD'))).toEqual([0, ':DIR']);
  });
});

describe('parentDetails()', function () {
  const ppxdir = `${process.env.PPX_DIR}`;
  const path1 = 'c:\\bin';
  const path2 = 'c:\\program files';

  //NOTE: send.dirtype always returns "NA"
  it('pairs window is not exist', () => {
    execSync(
      `${ppxdir}\\pptrayw.exe -c *string o,pair=%*extract(C,"%%~n")%:*if (""!="%so'pair'")%:*closeppx %so'pair'`
    );
    expect(moveFile.parentDetails(path1, path2)).toEqual({
      send: {dir: path1, dirtype: 'NA'},
      dest: {dir: path2, dirtype: 'NA'}
    });
  });
  it('pairs window is exist', () => {
    execSync(`${ppxdir}\\pptrayw.exe -c *if (""=="%2")%:*ppc -noactive`);
    expect(moveFile.parentDetails(path1, path2)).toEqual({
      send: {dir: path1, dirtype: 'NA'},
      dest: {dir: path2, dirtype: 'DIR'}
    });
  });
});

describe('switchMethod()', function () {
  it('use *ppcfile pattern', () => {
    const send = {dir: '', dirtype: ''};
    const dest = {dir: '', dirtype: ''};
    expect(moveFile.switchMethod('0', send, dest)).toBe('0');
  });
  it('use filesystem-move pattern', () => {
    const send = {dir: 'C:\\abc', dirtype: 'DIR'};
    const dest = {dir: 'C:\\def', dirtype: 'DIR'};
    expect(moveFile.switchMethod('1', send, dest)).toBe('1');
  });
  it('use filesystem-move and include virtual directory patterns', () => {
    let send = {dir: '', dirtype: 'DIR'};
    let dest = {dir: '', dirtype: 'LISTFILE'};
    expect(moveFile.switchMethod('1', send, dest)).toBe('0');
    send = {dir: '', dirtype: 'SPECIAL'};
    dest = {dir: '', dirtype: 'DIR'};
    expect(moveFile.switchMethod('1', send, dest)).toBe('0');
    send = {dir: '', dirtype: 'LISTFILE'};
    dest = {dir: '', dirtype: 'SPECIAL'};
    expect(moveFile.switchMethod('1', send, dest)).toBe('0');
  });
  it('use filesystem-move, destination drive is different', () => {
    const send = {dir: 'c:\\bin', dirtype: 'DIR'};
    const dest = {dir: 'D:\\bin', dirtype: 'DIR'};
    const isMove = true;
    expect(moveFile.switchMethod('1', send, dest, isMove)).toBe('0');
  });
});

describe('cmdParameters()', function () {
  const foOptions = PPx.Extract('%*getcust(S_ppm#user:fo_options)');

  it('acceptable directory patterns', () => {
    let dirtype = 'DIR';
    let ok = dirtype !== 'NA';
    let immediate = false;
    const destPath = 'C:\\test';
    let samename = '3';
    let opts = `-same:${samename} ${foOptions}`;
    const compcmd = '';
    expect(moveFile.cmdParameters({dir: destPath, dirtype}, immediate, samename)).toEqual({
      destPath,
      opts,
      compcmd,
      ok
    });
    dirtype = 'LISTFILE';
    ok = dirtype !== 'NA';
    immediate = true;
    samename = '0';
    opts = `-start -min -same:${samename} ${foOptions}`;
    expect(moveFile.cmdParameters({dir: destPath, dirtype}, immediate, samename)).toEqual({
      destPath,
      opts,
      compcmd,
      ok
    });
  });
  it('not acceptable directory patterns', () => {
    const dirtype = 'NA';
    const ok = dirtype !== 'NA';
    const immediate = false;
    let destPath = '';
    const returnpath = '%*getcust(S_ppm#user:work)%\\';
    const samename = '2';
    const opts = `-same:${samename} ${foOptions}`;
    const compcmd = ' -compcmd *ppc -pane:~ "%%hd0" -k *jumppath -entry:"%%R"';
    expect(moveFile.cmdParameters({dir: destPath, dirtype}, immediate, samename)).toEqual({
      destPath: returnpath,
      opts,
      compcmd,
      ok
    });
    destPath = 'c:\\test';
    expect(moveFile.cmdParameters({dir: destPath, dirtype}, immediate, samename)).toBeUndefined();
  });
});

describe('ppcfile()', function () {
  it('check command line', () => {
    const action = 'move';
    const param = {destPath: 'C:\\test', opts: '-renamedest', compcmd: ' -compcmd test', ok: true};
    const result = `*ppcfile ${action},${param.destPath},${param.opts}${param.compcmd}`;
    expect(moveFile.ppcfile(action, param)).toBe(result);
  });
});

describe('performMove()', function () {
  const thispath = PPx.Extract('%FD');
  const thisname = 'install';

  it('not exist path. the pass count must be incremental', () => {
    const perlog = '0';
    const sendDir = 'C:\\test';
    const filename = 'dummy.txt';
    const destDir = 'D:\\not\\exist\\path';
    const count = {success: 0, skip: 0, error: 0, pass: 0, undoData: []};
    const result = {success: 0, skip: 0, error: 0, pass: 1, undoData: []};
    expect(performMove(perlog, sendDir, filename, destDir, count)).toEqual(result);
  });
  it('duplicate path. the skip count must be incremental', () => {
    const perlog = '0';
    const sendDir = thispath;
    const filename = thisname;
    const destDir = thispath;
    const count = {success: 0, skip: 0, error: 0, pass: 0, undoData: []};
    const result = {success: 0, skip: 1, error: 0, pass: 0, undoData: []};
    expect(performMove(perlog, sendDir, filename, destDir, count)).toEqual(result);
  });
  it('failed to move. the errror count must be incremental', () => {
    const perlog = '0';
    const sendDir = thispath;
    const filename = thisname;
    const destDir = 'C:\\Users';
    const count = {success: 0, skip: 0, error: 0, pass: 1, undoData: []};
    const result = {success: 0, skip: 0, error: 1, pass: 1, undoData: []};
    expect(performMove(perlog, sendDir, filename, destDir, count)).toEqual(result);
  });
  it('successful move. the success count must be incremental', () => {
    const perlog = '0';
    const sendDir = thispath;
    const filename = thisname;
    const destDir = 'C:\\Users';
    const count = {success: 0, skip: 0, error: 0, pass: 0, undoData: []};
    const resp = `Move\t${sendDir}\\${filename}${nl} ->\t${destDir}\\${filename}`;
    const result = {success: 1, skip: 0, error: 0, pass: 0, undoData: [resp]};
    expect(performMove(perlog, sendDir, filename, destDir, count)).toEqual(result);
  });
});

describe('resultMsg()', function () {
  const time = datetime();

  it('show no negatives', () => {
    const cmd = 'Test';
    const total = 4;
    const success = 4;
    const skip = 0;
    const error = 0;
    const pass = 0;
    const message = `${cmd}\t${success}/${total}${time}`;
    expect(resultMsg(cmd, total, {success, skip, error, pass})).toBe(message);
  });
  it('show all factors', () => {
    const cmd = 'Test';
    const total = 4;
    const success = 1;
    const skip = 1;
    const error = 1;
    const pass = 1;
    const message = `${cmd}\t${success}/${total} [Skip:1,Error:1,Pass:1]${time}`;
    expect(resultMsg(cmd, total, {success, skip, error, pass})).toBe(message);
  });
});
