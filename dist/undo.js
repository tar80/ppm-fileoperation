﻿var e=PPx.CreateObject("Scripting.FileSystemObject"),r={ppmName:"ppx-plugin-manager",ppmVersion:.95,language:"ja",nlcode:"\r\n",nltype:"crlf",ppmID:"P",ppmSubID:"Q"},useLanguage=function(){var e=PPx.Extract("%*getcust(S_ppm#global:lang)");return"en"===e||"ja"===e?e:r.language};Array.prototype.includes||(Array.prototype.includes=function(e,r){if(null==this)throw new TypeError('Array.includes: "this" is null or not defined');var t=Object(this),n=t.length>>>0;if(0===n)return!1;var o=null!=r?r:0,i=Math.max(o>=0?o:n-Math.abs(o),0);function sameValueZero(e,r){return e===r||"number"==typeof e&&"number"==typeof r&&isNaN(e)&&isNaN(r)}for(;i<n;){if(sameValueZero(t[i],e))return!0;i++}return!1});var expandNlCode=function(e){var r="\n",t=e.indexOf("\r");return~t&&(r="\r\n"==e.substring(t,t+2)?"\r\n":"\r"),r},isCV8=function(){return"ClearScriptV8"===PPx.ScriptEngineName},isEmptyStr=function(e){return""===e},t={TypeToCode:{crlf:"\r\n",cr:"\r",lf:"\n"},CodeToType:{"\r\n":"crlf","\r":"cr","\n":"lf"},Ppx:{lf:"%%bl",cr:"%%br",crlf:"%%bn",unix:"%%bl",mac:"%%br",dos:"%%bn","\n":"%%bl","\r":"%%br","\r\n":"%%bn"},Ascii:{lf:"10",cr:"13",crlf:"-1",unix:"10",mac:"13",dos:"-1","\n":"10","\r":"13","\r\n":"-1"}},exec=function(e,r){try{var t;return[!1,null!=(t=r())?t:""]}catch(n){return[!0,""]}finally{e.Close()}},read=function(r){var t=r.path,n=r.enc,o=void 0===n?"utf8":n;if(!e.FileExists(t))return[!0,t+" not found"];var i=e.GetFile(t);if(0===i.Size)return[!0,t+" has no data"];var a=!1,u="";if("utf8"===o){var c=PPx.CreateObject("ADODB.Stream"),l=exec(c,(function(){return c.Open(),c.Charset="UTF-8",c.LoadFromFile(t),c.ReadText(-1)}));a=l[0],u=l[1]}else{var s="utf16le"===o?-1:0,d=i.OpenAsTextStream(1,s),f=exec(d,(function(){return d.ReadAll()}));a=f[0],u=f[1]}return a?[!0,"Unable to read "+t]:[!1,u]},readLines=function(e){var r,t=e.path,n=e.enc,o=void 0===n?"utf8":n,i=e.linefeed,a=read({path:t,enc:o}),u=a[0],c=a[1];if(u)return[!0,c];i=null!=(r=i)?r:expandNlCode(c.slice(0,1e3));var l=c.split(i);return isEmptyStr(l[l.length-1])&&l.pop(),[!1,{lines:l,nl:i}]},writeLines=function(n){var o=n.path,i=n.data,a=n.enc,u=void 0===a?"utf8":a,c=n.append,l=void 0!==c&&c,s=n.overwrite,d=void 0!==s&&s,f=n.linefeed,p=void 0===f?r.nlcode:f;if(!d&&!l&&e.FileExists(o))return[!0,o+" already exists"];var x,P=e.GetParentFolderName(o);if(e.FolderExists(P)||PPx.Execute("*makedir "+P),"utf8"===u){if(isCV8()){var v=i.join(p),m=l?"AppendAllText":"WriteAllText";return[!1,NETAPI.System.IO.File[m](o,v)]}var E=d||l?2:1,h=PPx.CreateObject("ADODB.Stream");x=exec(h,(function(){h.Open(),h.Charset="UTF-8",h.LineSeparator=Number(t.Ascii[p]),l?(h.LoadFromFile(o),h.Position=h.Size,h.SetEOS):h.Position=0,h.WriteText(i.join(p),1),h.SaveToFile(o,E)}))[0]}else{var b=l?8:d?2:1;e.FileExists(o)||PPx.Execute("%Osq *makefile "+o);var g="utf16le"===u?-1:0,y=e.GetFile(o).OpenAsTextStream(b,g);x=exec(y,(function(){y.Write(i.join(p)+p)}))[0]}return x?[!0,"Could not write to "+o]:[!1,""]},pathSelf=function(){var e,r,t=PPx.ScriptName;return~t.indexOf("\\")?(e=t.replace(/^.*\\/,""),r=PPx.Extract("%*name(DKN,"+t+")")):(e=t,r=PPx.Extract("%FDN")),{scriptName:e,parentDir:r.replace(/\\$/,"")}},n={en:{couldNotRead:"Could not read result log",noHistory:"No undo history",errorDetected:"An error has been detected",notFound:"is not found",unknown:"Unknown process",noUndo:"No undo"},ja:{couldNotRead:"ログを読めませんでした",noHistory:"アンドゥ履歴はありません",errorDetected:"エラーを検出しました",notFound:"はありません",unknown:"不明なプロセス",noUndo:"処理なし"}},o="ppm-fileoperation",i=r.nlcode,a=useLanguage();pathSelf();var _dialog=function(e,r){return 0===PPx.Execute('%"'+o+'" %OC %'+e+'"'+r+'"')},_hasTargetId=function(e){return"."!==e},u={echo:function(e,r){var t=r?"("+String(r)+")":"";return _dialog("I",""+e+t)},question:function(e){return _dialog("Q",e)},execute:function(e,r,t){return void 0===t&&(t=!1),isEmptyStr(r)?1:_hasTargetId(e)?t?Number(PPx.Extract("%*extract("+e+',"'+r+'%%:0")')):PPx.Execute("*execute "+e+","+r):PPx.Execute(r)},extract:function(e,r){if(isEmptyStr(r))return[13,""];var t=_hasTargetId(e)?PPx.Extract("%*extract("+e+',"'+r+'")'):PPx.Extract(r);return[Number(PPx.Extract()),t]}},c="PPXUNDO.LOG",l="utf16le",undologPath=function(){var e=PPx.Extract("%*getcust(X_save)%\\"+c);return~e.indexOf(":")||(e=PPx.Extract("%0%\\")+e),PPx.Execute('%OC *execute ,*ifmatch "o:e,a:d-","'+e+'"%%:*stop%bn*makefile "'+e+'"%%&'),e},s={undologRead:function(){return readLines({path:undologPath(),enc:l,linefeed:i})},undologWrite:function(e){writeLines({path:undologPath(),data:e,enc:l,linefeed:i,overwrite:!0})},updatePairWindow:function(){return PPx.Execute('*ifmatch C*,%~n%:%K~"@^F5"')}},d=n[a],main=function(){var e=undo(),r=e[0],t=e[1];r?u.echo(t):""!==u.extract("C","%%2")[1]&&s.updatePairWindow()},undo=function(){var t=s.undologRead(),n=t[0],o=t[1];if(n)return[!0,d.couldNotRead];if(0===o.lines.length)return[!0,d.noHistory];var i=["[Undo]"],a=[d.errorDetected,""],c=!1,l=0;do{var f=o.lines[l],p=f.split("\t"),x=p[0],P=p[1];if(l++,"Skip"!==x&&"MakeDir"!==x){var v=o.lines[l].split("\t")[1];switch(l++,x){case"MoveError":case"Copy AutoRetryError":case"Error SkipError":a.push(f);continue;case"Move":case"MoveDir":c=!0;break;case"Backup":if(!e.FileExists(v)&&!e.FolderExists(v))return[!0,v+" "+d.notFound];l++,c=!0;break;default:return[!0,d.unknown+' "'+x+'"']}i.push("Send "+P,"Dest -> "+v)}}while(o.lines[l]);return c?(a.length>2&&(u.question(a.join("%%bn"))&&PPx.Quit(1),overwrite("skip")),PPx.Execute("*wait 0,1"),PPx.linemessage(i.join(r.nlcode)),"1"!==PPx.Extract("*file !undo -min -nocount -log:off%:1")&&PPx.Quit(1),overwrite("redo"),[!1,""]):[!0,d.noUndo]},overwrite=function(e){var t=s.undologRead(),n=t[0],o=t[1];if(!n){for(var i=[],a=0;o.lines[a];){var u=o.lines[a].split("\t"),c=u[0],l=u[1];if(a++,"Skip"!==c)if("MoveError"!==c&&"Copy AutoRetryError"!==c&&"Error SkipError"!==c)if("Backup"!==c){var d=o.lines[a].split("\t")[1],f={skip:{send:l,dest:d},redo:{send:d,dest:l}}[e];i.push("Move\t"+f.send+r.nlcode+" ->\t"+f.dest),a++}else a+=2;else a++}s.undologWrite(i)}};main();