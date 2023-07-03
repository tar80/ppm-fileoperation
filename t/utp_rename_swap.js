describe('confirm_msg', function () {
  it('check_message', function () {
    assert.equal(true, confirm_msg('check_message', '.git', ''));
  });
});
describe('check_exceptions', function () {
  var fo_parent = PPx.Extract('%*getcust(S_ppm#plugins:ppm-fileoperation)\\setting');
  var file1 = fo_parent + '\\base.cfg';
  var file2 = fo_parent + '\\patch.cfg';
  var notexist = 'notexistfilename';
  it('not exists', function () {
    assert.equal(
      ['エントリを取得できません'],
      check_exceptions(notexist, notexist, notexist, notexist)
    );
  });
  it('same name exists', function () {
    var test_parent = PPx.Extract('%*getcust(S_ppm#plugins:ppm-test)\\setting');
    var fo_parent = PPx.Extract('%*getcust(S_ppm#plugins:ppm-fileoperation)\\setting');
    var entry1 = test_parent + '\\base.cfg';
    var entry2 = test_parent + '\\patch.cfg';
    var rename1 = fo_parent + '\\base.cfg';
    var rename2 = fo_parent + '\\patch.cfg';
    assert.equal(
      '同名のファイルがあります',
      check_exceptions(entry1, entry2, rename1, rename2)[0]
    );
  });
  it('Target file and directory', function () {
    var test_parent = PPx.Extract('%*getcust(S_ppm#plugins:ppm-test)\\setting');
    var rename1 = test_parent + '\\base.cfg';
    assert.equal(
      ['ファイルとディレクトリの名前交換はできません'],
      check_exceptions(test_parent, rename1, notexist, notexist)
    );
  });
});
describe('assort_entry', function () {
  it('root_path', function () {
    var path = 'C:\\'
    assert.equal('', assort_entry(path).name)
    assert.equal('', assort_entry(path).ext)
    assert.equal(path, assort_entry(path).filename)
  });
  it('general_path', function () {
    var path = 'C:\\bin\\test\\test.cfg'
    assert.equal('test', assort_entry(path).name)
    assert.equal('.cfg', assort_entry(path).ext)
    assert.equal(path, assort_entry(path).filename)
  });
  it('archive_path', function () {
    var path = 'C:\\bin\\test.zip\\test.txt'
    assert.equal('test', assort_entry(path).name)
    assert.equal('.txt', assort_entry(path).ext)
    assert.equal(path, assort_entry(path).filename)
  });
});
