(function () {
  if (typeof util === 'undefined' && typeof ppm_test_run === 'undefined') {
    PPx.Echo('This module depends on util. load util first');
    typeof ppm_test_run === 'undefined' && PPx.Quit(1);
  }
  var UNDOLOG_FILENAME = 'PPXUNDO.LOG';
  var fso;
  var fo = {};
  fo.exist = function (entry) {
    fso = fso || PPx.CreateObject('Scripting.FileSystemObject');
    if (fso.FolderExists(entry)) return 'Folder';
    if (fso.FileExists(entry)) return 'File';
    return false;
  };
  fo.pairedWindow = function (path) {
    var fileInfo = PPx.GetFileInformation(path);
    var reg = /^aux:.*/;
    var type = fileInfo || (reg.test(path) ? ':AUX' : 'na');
    return {
      path: path,
      ext: type
    };
  };
  fo.detail = function (dirtype, proc, dest, same) {
    var d = {
      ':DIR': [
        proc,
        dest,
        ' -qstart -nocount -preventsleep -same:' + same + ' -sameall -undolog',
        '-compcmd *focus %%: *execute ~,*jumppath -update -savelocate'
      ],
      ':XLF': [
        proc,
        dest,
        '-qstart -nocount -preventsleep -same:' + same + ' -sameall -undolog ',
        '-compcmd *focus %%: *execute ~,*jumppath -update -savelocate'
      ],
      ':AUX': [
        proc,
        dest,
        '-qstart -nocount -skiperror -preventsleep -same:' + same + ' -sameall -undolog',
        '-compcmd *execute ~,%%K"@F5"'
      ],
      'na': [
        0,
        '%*getcust(S_ppm#user:work)%\\',
        ' -qstart -nocount -preventsleep -same:' + same + ' -sameall -undolog',
        '-compcmd *ppc -pane:~ %%hd0 -k *jumppath -entry:%%R'
      ]
    }[dirtype];
    if (typeof d === 'undefined') {
      if (typeof ppm_test_run !== 'undefined') return d;
      PPx.Echo(dirtype + ' cannot be specified as the destination');
      PPx.Quit(-1);
    }
    return {action: d[0], dest: d[1], append: d[2], post: d[3]};
  };
  fo.command = function (order, cmd) {
    var act = cmd.action === 0 ? order : '!' + order;
    var opt = cmd.action === 0 ? '-renamedest' : '-min';
    return {act: act, dest: cmd.dest, opt: opt + cmd.append, post: cmd.post};
  };
  fo.run = function (cmd, callback) {
    return callback('C', '*ppcfile ' + cmd.act + ',"' + cmd.dest + '",' + cmd.opt + ' ' + cmd.post);
  };
  fo.imcompatible = function (dirtype, msg) {
    if (dirtype !== ':XLF') return;
    PPx.echo(msg);
    PPx.Quit(1);
  };
  fo.sevenzip = function (dest) {
    fso = fso || PPx.CreateObject('Scripting.FileSystemObject');
    var pwd = PPx.Extract('%0%\\');
    var cal = ['7-zip64.dll', '7-zip32.dll'];
    var errormsg = '7-zipXX.dll is not exist';
    var dll;
    if (fso.FileExists(pwd + cal[0])) {
      dll = cal[0];
    } else if (fso.FileExists(pwd + cal[1])) {
      dll = cal[1];
    } else {
      if (typeof ppm_test_run !== 'undefined') return errormsg;
      PPx.Echo(errormsg);
      PPx.Quit(1);
    }
    var isPPc = PPx.Extract('%n').indexOf('C') === 0;
    var cmdPart = dll + ',x -aos -hide "%1" -o' + dest + ' %@';
    return isPPc ? PPx.Execute('%u' + cmdPart) : PPx.Execute('*execute C,%(%u' + cmdPart + '%)');
  };
  fo.resultlog = function () {
    var format = function (value, subject) {
      return typeof value === 'number' ? subject + ': ' + value : '';
    };
    var success = format(this.success, this.cmd);
    var skip = this.skip ? format(this.skip, ' / Skip') : '';
    var error = this.error ? format(this.error, ' / Error') : '';
    var pass = this.pass ? format(this.pass, ' / Pass') : '';
    var total = this.total ? format(this.total, ' / Total') : '';
    return success + skip + error + pass + total;
  };
  fo.pairedUpdate = function () {
    PPx.Execute('*execute ~,*jumppath -update -savelocate');
  };
  fo.postproc = function (update, callback) {
    return !update ? callback('C', '*unmarkentry') : callback('C', '%%K"@F5"');
  };
  fo.undologpath = function () {
    fso = fso || PPx.CreateObject('Scripting.FileSystemObject');
    var xsave = PPx.Extract('%*getcust(X_save)');
    var path = !~xsave.indexOf(':')
      ? PPx.Extract('%0%\\' + xsave + '%\\' + UNDOLOG_FILENAME)
      : PPx.Extract(xsave + '%\\' + UNDOLOG_FILENAME);
    if (!fso.FileExists(path)) {
      PPx.Echo('Warning: UndoLog not exist');
      PPx.Quit(1);
    }
    return path;
  };
  fo.undologWrite = function (path, data, newline) {
    fso = fso || PPx.CreateObject('Scripting.FileSystemObject');
    try {
      var ts = fso.OpenTextFile(path, 2, true, -1);
      ts.Write(data.join(newline));
      ts.Close();
      return true;
    } catch (err) {
      util.log(err);
      return false;
    }
  };
  fo.elevatePPb = function (taskname) {
    util.execute('_', '%%Obnq *ppb -c schtasks /run /tn ' + taskname + '%%:*wait 1000,2');
    return '';
  };
  fo.symlink = function (option, data) {
    return util.execute(
      'C',
      '%(' + option + 'FOR %%i IN (' + data.join(',') + ') DO mklink %%~i>nul%&%)'
    );
  };
  fo.fastcopy = function () {
    fso = fso || PPx.CreateObject('Scripting.FileSystemObject');
    var wd = util.extract('_', '%*getcust(S_ppm#user:fo_fastcopy)');
    if (!fso.FileExists(fso.buildPath(wd, 'fcp.exe'))) {
      PPx.echo(
        'Invalid parent directory path for FastCopy.' +
          NL_CHAR +
          'Required "*ppmEdit ppm-fileoperation"'
      );
      PPx.Quit(1);
    }
    return {
      parent: wd,
      log: util.extract('_', '%*temp()%\\fastcopy.log')
    };
  };
  return fo;
})();
