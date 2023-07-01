describe('confirm_msg', function () {
  conv_skip_to_it = false
  skip('check_message', function () {
    assert.do('', function() {
      confirm_msg('check_message', '.git', '')
      return ''
    })
  });
});
describe('check_exceptions', function () {
  conv_skip_to_it = false
  var fo_parent = PPx.Extract('%*getcust(S_ppm#plugins:ppm-fileoperation)\\setting')
  var file1 = fo_parent + '\\base.cfg'
  var file2 = fo_parent + '\\patch.cfg'
  var notexist = 'notexistfilename'
  skip('not exists', function () {
    assert.do('', function () {
      check_exceptions(notexist, notexist, notexist, notexist)
    })
  });
  skip('same name exists', function () {
    var test_parent = PPx.Extract('%*getcust(S_ppm#plugins:ppm-test)\\setting')
    var rename1 = test_parent + '\\base.cfg'
    var rename2 = test_parent + '\\patch.cfg'
    assert.do('', function () {
      check_exceptions(file1, file2, rename1, rename2)
    })
  });
  skip('target file and directory', function () {
    assert.do('', function () {
      check_exceptions(file1, fo_parent, notexist, notexist)
    })
  });
});
describe('assort_entry', function () {
  it('root_path', function () {
    var path = 'C:\\'
    assert.equal('', assort_entry(path).name)
    assert.equal('', assort_entry(path).ext)
    assert.equal(path, assort_entry(path).filename)
  });
  it('archive', function () {
    var path = 'C:\\bin\\test.zip\\test.txt'
    assert.equal('test', assort_entry(path).name)
    assert.equal('.txt', assort_entry(path).ext)
    assert.equal(path, assort_entry(path).filename)
  });
});
