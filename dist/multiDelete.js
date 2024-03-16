﻿String.prototype.trim||(String.prototype.trim=function(){return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,"")});var validArgs=function(){for(var e=[],t=PPx.Arguments;!t.atEnd();t.moveNext())e.push(t.value);return e},e={ppmName:"ppx-plugin-manager",ppmVersion:.95,language:"ja",nlcode:"\r\n",nltype:"crlf",ppmID:"P",ppmSubID:"Q"},useLanguage=function(){var t=PPx.Extract("%*getcust(S_ppm#global:lang)");return"en"===t||"ja"===t?t:e.language},tmp=function(){var e=PPx.Extract('%*extract(C,"%%*temp()")');return{dir:e,file:e+"_ppmtemp",lf:e+"_temp.xlf",stdout:e+"_stdout",stderr:e+"_stderr",ppmDir:function(){var e=PPx.Extract("%'temp'%\\ppm");return PPx.Execute("*makedir "+e),e}}},isEmptyStr=function(e){return""===e},t=PPx.CreateObject("Scripting.FileSystemObject"),isCV8=function(){return"ClearScriptV8"===PPx.ScriptEngineName},r={TypeToCode:{crlf:"\r\n",cr:"\r",lf:"\n"},CodeToType:{"\r\n":"crlf","\r":"cr","\n":"lf"},Ppx:{lf:"%%bl",cr:"%%br",crlf:"%%bn",unix:"%%bl",mac:"%%br",dos:"%%bn","\n":"%%bl","\r":"%%br","\r\n":"%%bn"},Ascii:{lf:"10",cr:"13",crlf:"-1",unix:"10",mac:"13",dos:"-1","\n":"10","\r":"13","\r\n":"-1"}},exec=function(e,t){try{var r;return[!1,null!=(r=t())?r:""]}catch(n){return[!0,""]}finally{e.Close()}},writeLines=function(n){var i=n.path,a=n.data,u=n.enc,c=void 0===u?"utf8":u,o=n.append,l=void 0!==o&&o,p=n.overwrite,f=void 0!==p&&p,s=n.linefeed,x=void 0===s?e.nlcode:s;if(!f&&!l&&t.FileExists(i))return[!0,i+" already exists"];var P,m=t.GetParentFolderName(i);if(t.FolderExists(m)||PPx.Execute("*makedir "+m),"utf8"===c){if(isCV8()){var d=a.join(x),v=l?"AppendAllText":"WriteAllText";return[!1,NETAPI.System.IO.File[v](i,d)]}var E=f||l?2:1,b=PPx.CreateObject("ADODB.Stream");P=exec(b,(function(){b.Open(),b.Charset="UTF-8",b.LineSeparator=Number(r.Ascii[x]),l?(b.LoadFromFile(i),b.Position=b.Size,b.SetEOS):b.Position=0,b.WriteText(a.join(x),1),b.SaveToFile(i,E)}))[0]}else{var g=l?8:f?2:1;t.FileExists(i)||PPx.Execute("%Osq *makefile "+i);var y="utf16le"===c?-1:0,h=t.GetFile(i).OpenAsTextStream(g,y);P=exec(h,(function(){h.Write(a.join(x)+x)}))[0]}return P?[!0,"Could not write to "+i]:[!1,""]},n={en:{subTitle:"Specify directories separated by spaces"},ja:{subTitle:"空白区切りでディレクトリパスを指定"}};Array.prototype.includes||(Array.prototype.includes=function(e,t){if(null==this)throw new TypeError('Array.includes: "this" is null or not defined');var r=Object(this),n=r.length>>>0;if(0===n)return!1;var i=null!=t?t:0,a=Math.max(i>=0?i:n-Math.abs(i),0);function sameValueZero(e,t){return e===t||"number"==typeof e&&"number"==typeof t&&isNaN(e)&&isNaN(t)}for(;a<n;){if(sameValueZero(r[a],e))return!0;a++}return!1});var pathSelf=function(){var e,t,r=PPx.ScriptName;return~r.indexOf("\\")?(e=r.replace(/^.*\\/,""),t=PPx.Extract("%*name(DKN,"+r+")")):(e=r,t=PPx.Extract("%FDN")),{scriptName:e,parentDir:t.replace(/\\$/,"")}},i="ppm-fileoperation",a=e.nlcode,u=useLanguage();pathSelf();var _dialog=function(e,t){return 0===PPx.Execute('%"'+i+'" %OC %'+e+'"'+t+'"')},_hasTargetId=function(e){return"."!==e},c={echo:function(e,t){var r=t?"("+String(t)+")":"";return _dialog("I",""+e+r)},question:function(e){return _dialog("Q",e)},execute:function(e,t,r){return void 0===r&&(r=!1),isEmptyStr(t)?1:_hasTargetId(e)?r?Number(PPx.Extract("%*extract("+e+',"'+t+'%%:0")')):PPx.Execute("*execute "+e+","+t):PPx.Execute(t)},extract:function(e,t){if(isEmptyStr(t))return[13,""];var r=_hasTargetId(e)?PPx.Extract("%*extract("+e+',"'+t+'")'):PPx.Extract(t);return[Number(PPx.Extract()),r]}},o='%sgu"ppmcache"\\list\\multipath.txt',l="-min -log:off -undolog:off -querycreatedirectory:off -checkexistfirst -nocount -symdel:sym",p=tmp().file,f=n[u],main=function(){var e=validArgs()[0],t=[l,e].join(" "),r="'title':'Multiple Delete / "+f.subTitle+"','mode':'h','leavecancel':true,'list':false,'module':false,'detail':'1user1 path','file':'"+o+"'",n=PPx.Extract('%*script("%sgu\'ppmlib\'\\input.js","{'+r+'}")');("[error]"===n||isEmptyStr(n))&&PPx.Quit(-1);var i=extractPaths(PPx.Extract(n).trim().split(" ")),u=i[0],s=i[1];u&&(c.echo(s),PPx.Quit(-1)),c.question("[Multiple Delete]"+a+s.join(a))&&c.execute("C","*ppcfile !delete "+t+' -src:"@'+p+'" -compcmd *focus')},extractPaths=function(t){for(var r=c.extract("C","%%#;FCN")[1].split(";"),n=[],i=0;i<t.length;i++){var a=t[i];if(!isEmptyStr(a))for(var u=0;u<r.length;u++){var o=r[u];n.push((a+"\\"+o).replace(/ /g,"_"))}}var l=writeLines({path:p,data:n,enc:"utf16le",overwrite:!0,linefeed:e.nlcode}),f=l[0],s=l[1];return f?[!0,s]:[!1,n]};main();