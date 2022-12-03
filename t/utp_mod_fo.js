const st = PPx.CreateObject('ADODB.stream');
let module = function (filepath) {
  st.Open;
  st.Type = 2;
  st.Charset = 'UTF-8';
  st.LoadFromFile(filepath);
  const data = st.ReadText(-1);
  st.Close;
  return Function(' return ' + data)();
};

const util = module(PPx.Extract('%*getcust(S_ppm#global:module)\\util.js'));
const input = module(PPx.Extract('%*getcust(S_ppm#global:module)\\input.js'));
const fo = module(
  PPx.Extract('%*getcust(S_ppm#plugins:ppm-fileoperation)\\script\\jscript\\mod_fo.js')
);
module = null;

describe('Check the sorting by DirectoryType in pair-window', function () {
  var path;
  it('type :DIR', function () {
    path = PPx.Extract('%~D');
    assert.equal(':DIR', fo.pairedWindow(path).ext);
  });
  it('type :XLF', function () {
    path = PPx.Extract('%*temp()\\utp_test.txt');
    PPx.Execute('*execute C,*makelistfile ' + path + ' -marked');
    PPx.Execute('*wait 100');
    assert.equal(':XLF', fo.pairedWindow(path).ext);
  });
  it('type aux:', function () {
    path = 'aux:S_test:c:\\';
    assert.equal(':AUX', fo.pairedWindow(path).ext);
  });
  it('No paired', function () {
    path = '';
    assert.equal('na', fo.pairedWindow(path).ext);
  });
  it('Not support dirtype', function () {
    assert.do(undefined, function () {
      fo.detail(':TXT', 0, null);
    });
  });
});
describe('Operation result-logs', function () {
  it('trial result', function () {
    var cmd = 'test';
    var success = 0;
    var skip = -1;
    var error = 2;
    var pass = '3';
    var exp = cmd + ': ' + success + ' / Skip: ' + skip + ' / Error: ' + error;
    assert.equal(
      exp,
      fo.resultlog.call({cmd: cmd, success: success, pass: pass, skip: skip, error: error})
    );
  });
});
describe('Check undolog operations', function () {
  it('purpose, undolog file-path', function () {
    assert.equal('X_save\\PPXUNDO.LOG', fo.undologpath());
  });
  skip('failed case, sending wrong data value', function () {
    assert.notEqual(true, fo.undologWrite(fo.undologpath(), 'test', '\r\n', util));
  });
});
describe('Sevenzip command run', function () {
  it('expand dummy.zip to PPXXXX.TMP directory', function () {
    var zippath = util.getc('S_ppm#plugins:ppm-test') + '\\t\\dummy.zip';
    var temppath = util.extract('C', '%%*temp()');
    var pairedID = util.extract('C', '%%~n');
    if (pairedID === '') {
      PPx.Execute('*execute C,%%K"@F6"');
      pairedID = util.extract('C', '%%~n');
    }
    PPx.Execute('*execute C,*jumppath ' + zippath + '%%:*markentry *');
    PPx.Execute('*execute ' + pairedID + ',*jumppath ' + temppath);
    assert.do(0, function () {
      return fo.sevenzip(temppath);
    });
  });
});
describe('Prompt for input', function () {
  // conv_skip_to_it = true;
  skip('specifying multiple directories', function () {
    var LIST_NAME = 'multipath.txt';
    assert.do([1, 2, 3].join(' '), function () {
      return input.lied.call({
        title: 'Multiple TEST-INPUT/Specify directories separated by spaces',
        mode: 'd',
        listname: LIST_NAME
      }).trim();
    });
  });
});
