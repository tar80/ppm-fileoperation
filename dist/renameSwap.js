﻿var e={en:{sameName:"There is a file with the same name",notExist:"Cannot get entry",diffType:"File and directory cannot be renamed",couldNotGetFc:"Could not get the path to the fastcopy.exe\nPlease check the value of S_ppm#user:fo_fcdir",createTrash:"does not exist. Create a trash directory?"},ja:{sameName:"同名のファイルがあります",notExist:"エントリを取得できません",diffType:"ファイルとディレクトリの名前交換はできません",couldNotGetFc:"fastcopy.exeのパスを取得できませんでした\nS_ppm#user:fo_fcdirの値を確認してください",createTrash:"はありません。作成しますか?"}},t={en:{fileName:"Swap file names",fileExt:"Swap file extentions",opWindow:"Swap file names for the window opposite",desc:["Cannot get the target","","mark < 2: Opposite window entry and current entry swapping","mark = 2: Swap file names for marked entries"]},ja:{fileName:"ファイル名を入れ替えます",fileExt:"拡張子を入れ替えます",opWindow:"反対窓を対象にファイル名を入れ替えます",desc:["対象を取得できません","","mark < 2: 反対窓を対象にファイル名交換","mark = 2: マークしたエントリのファイル名交換"]}};Array.prototype.includes||(Array.prototype.includes=function(e,t){if(null==this)throw new Error('Array.includes: "this" is null or not defined');var r=Object(this),n=r.length>>>0;if(0===n)return!1;var a=null!=t?t:0,i=Math.max(a>=0?a:n-Math.abs(a),0);function sameValueZero(e,t){return e===t||"number"==typeof e&&"number"==typeof t&&isNaN(e)&&isNaN(t)}for(;i<n;){if(sameValueZero(r[i],e))return!0;i++}return!1});var r=PPx.CreateObject("Scripting.FileSystemObject"),n={ppmName:"ppx-plugin-manager",ppmVersion:.95,language:"ja",encode:"utf16le",nlcode:"\r\n",nltype:"crlf",ppmID:"P",ppmSubID:"Q"},useLanguage=function(){var e=PPx.Extract("%*getcust(S_ppm#global:lang)");return"en"===e||"ja"===e?e:n.language},isEmptyStr=function(e){return""===e},a={TypeToCode:{crlf:"\r\n",cr:"\r",lf:"\n"},CodeToType:{"\r\n":"crlf","\r":"cr","\n":"lf"},Ppx:{lf:"%%bl",cr:"%%br",crlf:"%%bn",unix:"%%bl",mac:"%%br",dos:"%%bn","\n":"%%bl","\r":"%%br","\r\n":"%%bn"},Ascii:{lf:"10",cr:"13",crlf:"-1",unix:"10",mac:"13",dos:"-1","\n":"10","\r":"13","\r\n":"-1"}},isCV8=function(){return"ClearScriptV8"===PPx.ScriptEngineName},_exec=function(e,t){try{var r;return[!1,null!=(r=t())?r:""]}catch(n){return[!0,""]}finally{e.Close()}},writeLines=function(e){var t=e.path,i=e.data,o=e.enc,c=void 0===o?"utf8":o,u=e.append,l=void 0!==u&&u,f=e.overwrite,x=void 0!==f&&f,s=e.linefeed,p=void 0===s?n.nlcode:s;if(!x&&!l&&r.FileExists(t))return[!0,t+" already exists"];var m,d=r.GetParentFolderName(t);if(r.FolderExists(d)||PPx.Execute("*makedir "+d),"utf8"===c){if(isCV8()){var P=i.join(p),h=l?"AppendAllText":"WriteAllText";return[!1,NETAPI.System.IO.File[h](t,P)]}var v=x||l?2:1,y=PPx.CreateObject("ADODB.Stream");m=_exec(y,(function(){y.Open(),y.Charset="UTF-8",y.LineSeparator=Number(a.Ascii[p]),l?(y.LoadFromFile(t),y.Position=y.Size,y.SetEOS):y.Position=0,y.WriteText(i.join(p),1),y.SaveToFile(t,v)}))[0]}else{var E=l?8:x?2:1;r.FileExists(t)||PPx.Execute("%Osq *makefile "+t);var N="utf16le"===c?-1:0,C=r.GetFile(t).OpenAsTextStream(E,N);m=_exec(C,(function(){C.Write(i.join(p)+p)}))[0]}return m?[!0,"Could not write to "+t]:[!1,""]},pathSelf=function(){var e,t,r=PPx.ScriptName;return~r.indexOf("\\")?(e=extractFileName(r),t=PPx.Extract("%*name(DKN,"+r+")")):(e=r,t=PPx.Extract("%FDN")),{scriptName:e,parentDir:t.replace(/\\$/,"")}},extractFileName=function(e,t){return void 0===t&&(t="\\"),"\\"!==t&&"/"!==t&&(t="\\"),e.slice(e.lastIndexOf(t)+1)},i="ppm-fileoperation",o=n.nlcode,c=useLanguage(),u=e[c];pathSelf();var _dialog=function(e,t){return 0===PPx.Execute('%"'+i+'" %OC %'+e+'"'+t+'"')},_hasTargetId=function(e){return"."!==e},l={echo:function(e,t){var r=t?"("+String(t)+")":"";return _dialog("I",""+e+r)},question:function(e){return _dialog("Q",e)},execute:function(e,t,r){return void 0===r&&(r=!1),isEmptyStr(t)?1:_hasTargetId(e)?r?Number(PPx.Extract("%*extract("+e+',"'+t+'%%:0")')):PPx.Execute("*execute "+e+","+t):PPx.Execute(t)},extract:function(e,t){if(isEmptyStr(t))return[13,""];var r=_hasTargetId(e)?PPx.Extract("%*extract("+e+',"'+t+'")'):PPx.Extract(t);return[Number(PPx.Extract()),r]}},f="PPXUNDO.LOG",undologPath=function(){var e=PPx.Extract("%*getcust(X_save)%\\"+f);return~e.indexOf(":")||(e=PPx.Extract("%0%\\")+e),PPx.Execute('%OC *execute ,*ifmatch "o:e,a:d-","'+e+'"%%:*stop%bn*makefile "'+e+'"%%&'),e},undologWrite=function(e){writeLines({path:undologPath(),data:e,enc:n.encode,linefeed:o,overwrite:!0})},_notExist=function(e,t){return!r[t?"FolderExists":"FileExists"](e)},x={entryDetails:function(e){return{filepath:e,name:l.extract("C",'%%*name(XN,""'+e+'"")')[1],ext:l.extract("C",'%%*name(T,""'+e+'"")')[1],type:PPx.GetFileInformation(e)}},checkExistence:function(e,t,n){for(var a=[!1,!1],i=2;i--;){if(":DIR"===n[i]&&(a[i]=!0),_notExist(e[i],a[i]))return[!0,u.notExist];if(r.FileExists(t[i])&&!e.includes(t[i]))return[!0,""+u.sameName+o+o+t[i]]}return a[0]!==a[1]?[!0,u.diffType]:[!1,""]},createUniqName:function(e){for(var t=e.name+"_ren_."+e.ext;r.FileExists(t)||r.FolderExists(t);)t=t.replace("_ren_","__ren__");return t}},s=t[c],main=function(){var e=PPx.EntryMarkCount,t=!1,r=[];if(2===e){var n=handleMarks();t=n[0],r=n[1]}else{if(!(e<2&&PPx.Pane.Count>1))return void l.echo(s.desc.join(o));var a=handlePairs();t=a[0],r=a[1]}t||(l.execute("C","*unmarkentry"),undologWrite(r))},confirm=function(e,t,r){return l.question(""+e+o+o+t+o+r)},handleMarks=function(){var e=PPx.Entry;e.FirstMark;var t=x.entryDetails(e.Name);e.NextMark;var r=x.entryDetails(e.Name),n={"true":[t.name+"."+r.ext,r.name+"."+t.ext,s.fileExt],"false":[r.name+"."+t.ext,t.name+"."+r.ext,s.fileName]}[(t.name===r.name).toString()],a=n[0],i=n[1],o=n[2],c=x.checkExistence([t.filepath,r.filepath],[a,i],[t.type,r.type]),u=c[0],f=c[1];if(u)return l.echo(f),[!0,[]];if(!confirm(o,t.filepath,r.filepath))return[!0,[]];var p=x.createUniqName(t);return l.execute("C","*rename "+t.filepath+","+p+"%%:*rename "+r.filepath+","+i+"%%:*rename "+p+","+a),[!1,[]]},handlePairs=function(){var e=x.entryDetails(l.extract("C","%%FDCN")[1]),t=x.entryDetails(l.extract("C","%%~FDCN")[1]),r=l.extract("C","%%1")[1]+"\\"+t.name+"."+e.ext,n=l.extract("C","%%2")[1]+"\\"+e.name+"."+t.ext,a=x.checkExistence([e.filepath,t.filepath],[r,n],[e.type,t.type]),i=a[0],o=a[1];return i?(l.echo(o),[!0,[]]):confirm(s.opWindow,e.filepath,t.filepath)?(l.execute("C","*rename "+e.filepath+","+r+'%%:*jumppath -update -entry:"'+t.name+"."+e.ext+'"'),l.execute("~","*rename "+t.filepath+","+n+'%%:*jumppath -update -entry:"'+e.name+"."+t.ext+'"'),[!1,["Move\t"+e.filepath," ->\t"+r,"Move\t"+t.filepath," ->\t"+n]]):[!0,[]]};main();
