describe('Mark entries', function () {
  PPx.Execute('*execute C,*markentry *');
  it('purpose, marked all entries', function () {
    assert.equal('names of marked entries', marked_entry().names);
  });
  PPx.Execute('*execute C,*unmarkentry p:,*');
  it('No marked', function () {
    assert.equal(1, marked_entry().counts);
  });
});
describe('Operation sym-link', function () {
  it('Create symbolic-link in tempdir', function () {
    var dest = util.extract('C', '%%*temp()');
    var entries = marked_entry();

    assert.do(0, function () {
      return sym_link(dest, entries);
    });
  });
});
describe('fast_copy()', function () {
  conv_skip_to_it = false;
  skip('fastcopy command details', function () {
    var filename = 'dummy.zip';
    var testdir = util.getc('S_ppm#plugins:ppm-test') + '\\t';
    var temppath = util.extract('C', '%%*temp()');
    var pairedID = util.extract('C', '%%~n');
    PPx.Execute('*execute C,*jumppath ' + testdir + '%%:*markentry ' + filename);
    PPx.Execute('*execute ' + pairedID + ',*jumppath ' + temppath);
    var fcinfo = fo.fastcopy();
    PPx.Execute('*wait 300');
    var entries = marked_entry();
    assert.do(0, function () {
      return fast_copy(1, fcinfo, entries.paths, temppath, 'update');
    });
  });
});
