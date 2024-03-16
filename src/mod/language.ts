export const langCore = {
  en: {
    sameName: 'There is a file with the same name',
    notExist: 'Cannot get entry',
    diffType: 'File and directory cannot be renamed',
    couldNotGetFc: 'Could not get the path to the fastcopy.exe\nPlease check the value of S_ppm#user:fo_fcdir',
    createTrash: 'does not exist. Create a trash directory?'
  },
  ja: {
    sameName: '同名のファイルがあります',
    notExist: 'エントリを取得できません',
    diffType: 'ファイルとディレクトリの名前交換はできません',
    couldNotGetFc: 'fastcopy.exeのパスを取得できませんでした\nS_ppm#user:fo_fcdirの値を確認してください',
    createTrash: 'はありません。作成しますか?'
  }
};
export const langRenameSwap = {
  en: {
    fileName: 'Swap file names',
    fileExt: 'Swap file extentions',
    opWindow: 'Swap file names for the window opposite',
    desc: [
      'Cannot get the target',
      '',
      'mark < 2: Opposite window entry and current entry swapping',
      'mark = 2: Swap file names for marked entries'
    ]
  },
  ja: {
    fileName: 'ファイル名を入れ替えます',
    fileExt: '拡張子を入れ替えます',
    opWindow: '反対窓を対象にファイル名を入れ替えます',
    desc: ['対象を取得できません', '', 'mark < 2: 反対窓を対象にファイル名交換', 'mark = 2: マークしたエントリのファイル名交換']
  }
};

export const langFileOparations = {
  en: {
    abort: 'Abort. Not supported',
    fileExpand: 'Specify path (archive file extraction)',
    createLink: 'Specify path (create symbolic link)',
    notSupported(dest: string) {
      return `Operation to ${dest} is not supported`;
    }
  },
  ja: {
    abort: '非対応ディレクトリ',
    fileExpand: 'パスを指定 (書庫ファイル展開)',
    createLink: 'パスを指定 (シンボリックリンク作成)',
    notSupported(dest: string) {
      return `${dest}への処理は非対応です`;
    }
  }
};

export const langFastcopyResult = {
  en: {
    resultNotExist: 'Result log does not exist',
    couldNotRead: 'Could not read result log',
    noProcess: 'There was no processing'
  },
  ja: {
    resultNotExist: 'ログがありません',
    couldNotRead: 'ログを読めませんでした',
    noProcess: '処理なし'
  }
};

export const langFileDelete = {
  en: {
    deleted: 'Already SafeDeleted',
    abort: 'Abort'
  },
  ja: {
    deleted: '削除済みです',
    abort: '中止'
  }
};

export const langCleanup = {
  en: {
    notExistList: 'cleanup.txt does not exist',
    question: 'Start clenup',
    complete: 'Completed',
    remaining: 'There are files that failed to cleanup',
    test: '**Test Execution**\nPaths below are subject to deletion\n'
  },
  ja: {
    notExistList: 'cleanup.txtがありません',
    question: '不要ファイルを消去します',
    complete: '完了',
    remaining: '消去に失敗したファイルがあります',
    test: '**テスト実行**\n以下のパスが消去対象です\n'
  }
};

export const langUndo = {
  en: {
    couldNotRead: 'Could not read result log',
    noHistory: 'No undo history',
    errorDetected: 'An error has been detected',
    notFound: 'is not found',
    unknown: 'Unknown process',
    noUndo: 'No undo'
  },
  ja: {
    couldNotRead: 'ログを読めませんでした',
    noHistory: 'アンドゥ履歴はありません',
    errorDetected: 'エラーを検出しました',
    notFound: 'はありません',
    unknown: '不明なプロセス',
    noUndo: '処理なし'
  }
};

export const langMultiCopy = {
  en: {
    subTitle: 'Specify directories separated by spaces',
  },
  ja: {
    subTitle: '空白区切りでディレクトリパスを指定',
  }
};
