describe('Multiple copy', function () {
  PPx.Execute('*execute C,*ifmatch 0,0%%~D%%:%%K"@f6"');
  var testdir = util.getc('S_ppm#plugins:ppm-test') + '\\t';
  var temppath = util.extract('C', '%%*temp()%%\\');
  var filename = 'dummy.zip';
  var pairedID = util.extract('C', '%%~n');
  PPx.Execute('*execute C,*jumppath ' + testdir + '%%:*markentry ' + filename);
  PPx.Execute('*execute ' + pairedID + ',*jumppath ' + temppath);
  var parent = temppath + 'utp_multippcfile';
  var destdir = [parent + '1', parent + '2', parent + '3'];
  it('ppx_copy run', function () {
    assert.do('undefined', function () {
      return multicopy_run('Copy', destdir);
    });
  });
  var parent = temppath + 'utp_multifastcopy';
  var destdir = [parent + '1', parent + '2', parent + '3'];
  it('fastcopy run', function () {
    assert.do('undefined', function () {
      return multicopy_run('FastCopy', destdir);
    });
  });
  var parent = temppath + 'utp_multisymlink';
  var destdir = [parent + '1', parent + '2', parent + '3'];
  it('symlink run', function () {
    assert.do(undefined, function () {
      return multicopy_run('Link', destdir);
    });
  });
  PPx.Execute('*execute C,*unmarkentry');
});
