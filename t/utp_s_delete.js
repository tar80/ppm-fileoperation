describe('delete file', function () {
  var wd = util.extract('C', '%%*temp()%%\\');
  it('trial SafeDelete', function () {
    var path = 't e s t.txt';
    assert.equal(path, safe_delete('File', wd, path));
  });
  var filename = 'utp_readonly_file';
  var dirname = 'utp_readonly_dir';
  var filepath = wd + filename;
  var dirpath = wd + dirname;
  if (!fso.FileExists(filepath)) {
    fso.CreateTextFile(filepath);
    fso.CreateFolder(dirpath);
    PPx.Execute('*wait 100');
    fso.GetFile(filepath).Attributes = 1;
    fso.GetFolder(dirpath).Attributes = 1;
  }
  debug = false;
  it('delete readonly file', function () {
    assert.do(filename, function () {
      return safe_delete('File', wd, filename, true);
    });
  });
});
