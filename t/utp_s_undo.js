describe('Oparetion undo', function () {
  var tempdir = util.extract('C', '%%*temp()%%\\');
  var deleted = util.extract('_', '%*getcust(S_ppm#user:trash)%\\deleted$\\');
  var dummyfile = 'utp_undo_file';
  var dummydir = 'utp_undo_dir';
  var notaccess = '\t' + 'not_access_file' + NL_CHAR + '\tプロセスはファイルにアクセスできません。別のプロセスが使用中です。(32)';
  it('Overwrite PPXUNDO.LOG by move-items', function () {
    var dummydata = [
      'MoveError' + notaccess,
      'Copy AutoRetryError' + notaccess,
      'Error SkipError' + notaccess,
      'Move\t' + deleted + dummydir + NL_CHAR + ' ->\t' + tempdir + dummydir,
      'Move\t' + deleted + dummyfile + NL_CHAR + ' ->\t' + tempdir + dummyfile
    ];
    assert.equal(true, fo.undologWrite(undolog, dummydata, NL_CHAR, util));
  });
  it('Undo run. case "Move"', function () {
    PPx.Execute('*makefile ' + tempdir + dummyfile);
    PPx.Execute('*makefile ' + tempdir + dummydir);
    assert.do(0, proc.undo);
  });
  it('Overwrite PPXUNDO.LOG by backup-items', function () {
    var dummydata = [
      'Backup\t' + tempdir + dummydir + NL_CHAR + ' ->\t' + deleted + dummydir + NL_CHAR + 'Delete\t' + tempdir + dummydir,
      'Backup\t' + tempdir + dummyfile + NL_CHAR + ' ->\t' + deleted + dummyfile + NL_CHAR + 'Delete\t' + tempdir + dummyfile
    ];
    assert.equal(true, fo.undologWrite(undolog, dummydata, NL_CHAR, util));
  });
  it('Undo run. case "Backup"', function () {
    assert.equal(0, proc.undo());
    PPx.Execute('*delete ' + deleted + dummyfile);
    PPx.Execute('*delete ' + deleted + dummydir);
  });
  it('Overwrite PPXUNDO.LOG by skip-items', function () {
    var dummydata = [
      'Skip\t' + tempdir + dummydir,
      'Skip\t' + tempdir + dummyfile
    ];
    assert.equal(true, fo.undologWrite(undolog, dummydata, NL_CHAR, util));
  });
  it('Undo run. case "Skip"', function () {
    assert.notEqual(0, proc.undo());
  });
});
