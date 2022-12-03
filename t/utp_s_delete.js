describe('delete file', function () {
  var wd = util.extract('C', '%%*temp()%%\\');
  it('trial SafeDelete', function () {
    var path = 't e s t.txt';
    var del = delete_type['SafeDel'];
    assert.equal(path, del('File', wd, path));
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
  var del = delete_type['Delete'];
  it('delete readonly directory', function () {
    assert.do(dirname, function () {
      return del('Folder', wd, dirname, true);
    });
  });
  it('delete readonly file', function () {
    assert.do(filename, function () {
      return del('File', wd, filename, true);
    });
  });
});
