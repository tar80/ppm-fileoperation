describe('Multiple delete', function () {
  it('target paths', function () {
    var filename = 'dummy.zip';
    var testdir = util.getc('S_ppm#plugins:ppm-test') + '\\t';
    var path = ['1\\' + filename, '2\\' + filename, '3\\' + filename];
    PPx.Execute('*execute C,*jumppath ' + testdir + '%%:*markentry ' + filename);
    assert.equal(path, delete_entries([1,2,3]));
    PPx.Execute('*execute C,*unmarkentry');
  });
});
