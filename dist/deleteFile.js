﻿Array.prototype.includes||(Array.prototype.includes=function(e,t){if(null==this)throw new Error('Array.includes: "this" is null or not defined');var r=Object(this),n=r.length>>>0;if(0===n)return!1;var a=null!=t?t:0,i=Math.max(a>=0?a:n-Math.abs(a),0);function sameValueZero(e,t){return e===t||"number"==typeof e&&"number"==typeof t&&isNaN(e)&&isNaN(t)}for(;i<n;){if(sameValueZero(r[i],e))return!0;i++}return!1});var e=PPx.CreateObject("Scripting.FileSystemObject"),t={ppmName:"ppx-plugin-manager",ppmVersion:.95,language:"ja",encode:"utf16le",nlcode:"\r\n",nltype:"crlf",ppmID:"P",ppmSubID:"Q"},useLanguage=function(){var e=PPx.Extract("%*getcust(S_ppm#global:lang)");return"en"===e||"ja"===e?e:t.language},isEmptyStr=function(e){return""===e},r={TypeToCode:{crlf:"\r\n",cr:"\r",lf:"\n"},CodeToType:{"\r\n":"crlf","\r":"cr","\n":"lf"},Ppx:{lf:"%%bl",cr:"%%br",crlf:"%%bn",unix:"%%bl",mac:"%%br",dos:"%%bn","\n":"%%bl","\r":"%%br","\r\n":"%%bn"},Ascii:{lf:"10",cr:"13",crlf:"-1",unix:"10",mac:"13",dos:"-1","\n":"10","\r":"13","\r\n":"-1"}},isCV8=function(){return"ClearScriptV8"===PPx.ScriptEngineName},_exec=function(e,t){try{var r;return[!1,null!=(r=t())?r:""]}catch(n){return[!0,""]}finally{e.Close()}},writeLines=function(n){var a=n.path,i=n.data,o=n.enc,u=void 0===o?"utf8":o,c=n.append,s=void 0!==c&&c,l=n.overwrite,f=void 0!==l&&l,x=n.linefeed,d=void 0===x?t.nlcode:x;if(!f&&!s&&e.FileExists(a))return[!0,a+" already exists"];var p,P=e.GetParentFolderName(a);if(e.FolderExists(P)||PPx.Execute("*makedir "+P),"utf8"===u){if(isCV8()){var m=i.join(d),h=s?"AppendAllText":"WriteAllText";return[!1,NETAPI.System.IO.File[h](a,m)]}var v=f||s?2:1,E=PPx.CreateObject("ADODB.Stream");p=_exec(E,(function(){E.Open(),E.Charset="UTF-8",E.LineSeparator=Number(r.Ascii[d]),s?(E.LoadFromFile(a),E.Position=E.Size,E.SetEOS):E.Position=0,E.WriteText(i.join(d),1),E.SaveToFile(a,v)}))[0]}else{var b=s?8:f?2:1;e.FileExists(a)||PPx.Execute("%Osq *makefile "+a);var y="utf16le"===u?-1:0,g=e.GetFile(a).OpenAsTextStream(b,y);p=_exec(g,(function(){g.Write(i.join(d)+d)}))[0]}return p?[!0,"Could not write to "+a]:[!1,""]},pathSelf=function(){var e,t,r=PPx.ScriptName;return~r.indexOf("\\")?(e=extractFileName(r),t=PPx.Extract("%*name(DKN,"+r+")")):(e=r,t=PPx.Extract("%FDN")),{scriptName:e,parentDir:t.replace(/\\$/,"")}},extractFileName=function(e,t){return void 0===t&&(t="\\"),"\\"!==t&&"/"!==t&&(t="\\"),e.slice(e.lastIndexOf(t)+1)},n={en:{sameName:"There is a file with the same name",notExist:"Cannot get entry",diffType:"File and directory cannot be renamed",couldNotGetFc:"Could not get the path to the fastcopy.exe\nPlease check the value of S_ppm#user:fo_fcdir",createTrash:"does not exist. Create a trash directory?"},ja:{sameName:"同名のファイルがあります",notExist:"エントリを取得できません",diffType:"ファイルとディレクトリの名前交換はできません",couldNotGetFc:"fastcopy.exeのパスを取得できませんでした\nS_ppm#user:fo_fcdirの値を確認してください",createTrash:"はありません。作成しますか?"}},a={en:{deleted:"Already SafeDeleted",abort:"Abort"},ja:{deleted:"削除済みです",abort:"中止"}},i="ppm-fileoperation",o=t.nlcode,u=useLanguage(),c=n[u];pathSelf();var _dialog=function(e,t){return 0===PPx.Execute('%"'+i+'" %OC %'+e+'"'+t+'"')},_hasTargetId=function(e){return"."!==e},s={echo:function(e,t){var r=t?"("+String(t)+")":"";return _dialog("I",""+e+r)},question:function(e){return _dialog("Q",e)},execute:function(e,t,r){return void 0===r&&(r=!1),isEmptyStr(t)?1:_hasTargetId(e)?r?Number(PPx.Extract("%*extract("+e+',"'+t+'%%:0")')):PPx.Execute("*execute "+e+","+t):PPx.Execute(t)},extract:function(e,t){if(isEmptyStr(t))return[13,""];var r=_hasTargetId(e)?PPx.Extract("%*extract("+e+',"'+t+'")'):PPx.Extract(t);return[Number(PPx.Extract()),r]}},l="PPXUNDO.LOG",undologPath=function(){var e=PPx.Extract("%*getcust(X_save)%\\"+l);return~e.indexOf(":")||(e=PPx.Extract("%0%\\")+e),PPx.Execute('%OC *execute ,*ifmatch "o:e,a:d-","'+e+'"%%:*stop%bn*makefile "'+e+'"%%&'),e},undologWrite=function(e){writeLines({path:undologPath(),data:e,enc:t.encode,linefeed:o,overwrite:!0})},fileOperation=function(e,t,r,n,a){var i=PPx.Entry,o=Math.max(PPx.EntryMarkCount,1),u={success:0,skip:0,error:0,pass:0,undoData:[]};i.FirstMark;do{u=t(r,n,i.Name,a.dir,u)}while(i.NextMark);return u.success>0&&undologWrite(u.undoData),PPx.linemessage(resultMsg(e,o,u)),0===u.error&&"NA"!==a.dirtype},datetime=function(){var e=PPx.Extract("%*getcust(S_ppm#user:fo_datetime)");return isEmptyStr(e)?"":PPx.Extract('%bt%*nowdatetime("'+e+'")')},resultMsg=function(e,t,r){var n=r.success,a=r.skip,i=r.error,o=r.pass,u=e+"\t"+n+"/"+t,c=[];return a>0&&c.push("Skip:"+a),i>0&&c.push("Error:"+i),o>0&&c.push("Pass:"+o),c.length>0&&(u=u+" ["+c.join(",")+"]"),""+u+datetime()},f={getTrash:function(t){var r=PPx.Extract('%*extract(C,"%*getcust(S_ppm#user:fo_trash)")%\\'+t+"\\");if(!e.FolderExists(r)){if(!s.question(r+" "+c.createTrash))return;e.CreateFolder(r)}return r},fileOperation:fileOperation,performSafeDel:function(t,r,n,a,i){var u=i.success,c=i.skip,s=i.error,l=i.pass,f=i.undoData,x=r+"\\"+n,d=":DIR"===PPx.GetFileInformation(n)?"Folder":"File";if(!e[d+"Exists"](x))return{success:u,skip:c,error:s,pass:++l,undoData:f};var p=PPx.Extract(a+"\\%*now(data)");!e.FolderExists(p)&&e.CreateFolder(p);var P=PPx.Extract('%*name(DCUN,"%('+p+"\\"+n+'%)")'),m={message:n};try{e["Move"+d](x,P),f.push("Backup\t"+x+o+" ->\t"+P+o+"Delete\t"+n),u++,m.header="SafeDel"}catch(h){s++,m.header=h,PPx.EntryState=0}return t&&PPx.linemessage(m.header+"\t%("+m.message+"%)"),{success:u,skip:c,error:s,pass:l,undoData:f}},updateWindow:function(e){return e?PPx.Execute('*execute C,%%K"@F5"'):PPx.Execute('*execute C,*unmarkentry path:%%:%%K"@^F5"')}},validArgs=function(){for(var e=[],t=PPx.Arguments;!t.atEnd();t.moveNext())e.push(t.value);return e},safeArgs=function(){for(var e=[],t=validArgs(),r=0,n=arguments.length;r<n;r++)e.push(_valueConverter(r<0||arguments.length<=r?undefined:arguments[r],t[r]));return e},_valueConverter=function(e,t){if(null==t||""===t)return null!=e?e:undefined;switch(typeof e){case"number":var r=Number(t);return isNaN(r)?e:r;case"boolean":return null!=t&&"false"!==t&&"0"!==t;default:return t}},x="deleted$",d=a[u];(function(){var e=safeArgs(!1,!1),t=e[0],r=e[1],n=s.extract("C","%%1")[1];if(~n.indexOf(x))PPx.linemessage('!"'+d.deleted);else{var a=f.getTrash(x);if(a)f.fileOperation("SafeDel",f.performSafeDel,t,n,{dir:a,dirtype:"DIR"})&&f.updateWindow(r);else PPx.linemessage('!"'+d.abort)}})();
