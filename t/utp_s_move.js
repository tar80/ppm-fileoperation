describe('paired window information', function () {
  it('parent filetype', function () {
    var path = PPx.GetFileInformation(PPx.Extract('%~D'));
    assert.equal(path, target_dir.ext);
  });
});
describe('filesystem move command', function () {
  var wd = util.extract('C', '%%*temp()%%\\');
  var name = 'ppmutptest';
  var rename = 'T E S T';
  fso.CreateTextFile(wd + name);
  it('fsmove run "ppmutptest" -> "T E S T"', function () {
    assert.equal(name, fsmove(false, 'MoveFile', wd + name, wd + rename, name));
  });
  it('fsmove run "T E S T" -> "ppmutptest"', function () {
    assert.equal(name, fsmove(false, 'MoveFile', wd + rename, wd + name, name));
  });
  fso.CreateTextFile(wd + rename);
  it('fsmove run Rename with the same name as destination', function () {
    assert.equal(name, fsmove(true, 'MoveFile', wd + rename, wd + name, name));
  });
  fso.DeleteFile(wd + name);
  fso.DeleteFile(wd + name + '-1');
});
