﻿String.prototype.trim||(String.prototype.trim=function(){return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/,"")});var isEmptyStr=function(t){return""===t},withinRange=function(t,e){return 0<=t&&t<=Number(e)},pathSelf=function(){var t,e,r=PPx.ScriptName;return~r.indexOf("\\")?(t=extractFileName(r),e=PPx.Extract("%*name(DKN,"+r+")")):(t=r,e=PPx.Extract("%FDN")),{scriptName:t,parentDir:e.replace(/\\$/,"")}},extractFileName=function(t,e){return void 0===e&&(e="\\"),"\\"!==e&&"/"!==e&&(e="\\"),t.slice(t.lastIndexOf(e)+1)},validArgs=function(){for(var t=[],e=PPx.Arguments;!e.atEnd();e.moveNext())t.push(e.value);return t},safeArgs=function(){for(var t=[],e=validArgs(),r=0,n=arguments.length;r<n;r++)t.push(_valueConverter(r<0||arguments.length<=r?undefined:arguments[r],e[r]));return t},_valueConverter=function(t,e){if(null==e||""===e)return null!=t?t:undefined;switch(typeof t){case"number":var r=Number(e);return isNaN(r)?t:r;case"boolean":return null!=e&&"false"!==e&&"0"!==e;default:return e}},t={en:{subTitle:"Specify directories separated by spaces"},ja:{subTitle:"空白区切りでディレクトリパスを指定"}};Array.prototype.includes||(Array.prototype.includes=function(t,e){if(null==this)throw new Error('Array.includes: "this" is null or not defined');var r=Object(this),n=r.length>>>0;if(0===n)return!1;var i=null!=e?e:0,u=Math.max(i>=0?i:n-Math.abs(i),0);function sameValueZero(t,e){return t===e||"number"==typeof t&&"number"==typeof e&&isNaN(t)&&isNaN(e)}for(;u<n;){if(sameValueZero(r[u],t))return!0;u++}return!1});var e=PPx.CreateObject("Scripting.FileSystemObject"),r={ppmName:"ppx-plugin-manager",ppmVersion:.95,language:"ja",encode:"utf16le",nlcode:"\r\n",nltype:"crlf",ppmID:"P",ppmSubID:"Q"},useLanguage=function(){var t=PPx.Extract("%*getcust(S_ppm#global:lang)");return"en"===t||"ja"===t?t:r.language},n="ppm-fileoperation",i=r.nlcode,u=useLanguage();pathSelf();var _dialog=function(t,e){return 0===PPx.Execute('%"'+n+'" %OC %'+t+'"'+e+'"')},_hasTargetId=function(t){return"."!==t},a={echo:function(t,e){var r=e?"("+String(e)+")":"";return _dialog("I",""+t+r)},question:function(t){return _dialog("Q",t)},execute:function(t,e,r){return void 0===r&&(r=!1),isEmptyStr(e)?1:_hasTargetId(t)?r?Number(PPx.Extract("%*extract("+t+',"'+e+'%%:0")')):PPx.Execute("*execute "+t+","+e):PPx.Execute(e)},extract:function(t,e){if(isEmptyStr(e))return[13,""];var r=_hasTargetId(t)?PPx.Extract("%*extract("+t+',"'+e+'")'):PPx.Extract(e);return[Number(PPx.Extract()),r]}},elevatePPb=function(t){return PPx.Execute("%Obnq *ppb -c schtasks /run /tn "+t+"%:*wait 1000,2"),""},c={symlinkCmdline:function(t,r){void 0===r&&(r=[]);var n=a.extract("C","%%#;FDCSN")[1].split(";"),i=a.extract("C","%%#;FCN")[1].replace(/ /g,"_").split(";");e.FolderExists(t)||a.execute("C","*makedir "+t);for(var u,c,o,l=0;l<i.length;l++){var p=[n[l],i[l]];u=p[0],c=p[1],o=":DIR"===PPx.GetFileInformation(u)?"/D ":"",r.push('"'+o+t+"\\"+c+" "+u+'"')}return r},symlink:function(t,e){var r=isEmptyStr(e)?"%Obdq ":elevatePPb(e);a.execute("C","%("+r+"FOR %%i IN ("+t.join(",")+') DO mklink %%~i>nul%&%K~"@^F5"%)')},getFcPath:function(){var t=PPx.Extract("%*getcust(S_ppm#user:fo_fcdir)\\fastcopy.exe");return e.FileExists(t)&&t}},o='%sgu"ppmcache"\\complist\\multipath.txt',l=t[u],main=function(){var t=safeArgs(0,0,"",""),e=t[0],r=t[1],n=t[2],u=t[3],f=getOptions(e,r,n),s=f[0],x=f[1];if(s){var m=pathSelf(),P=m.scriptName,d=m.parentDir;PPx.Execute('*script "%sgu\'ppmlib\'\\errors.js",arg,"'+d+"\\"+P+'"'),PPx.Quit(-1)}var v=["Copy","FastCopy","Link"][e],g="'title':'Multiple "+v+" / "+l.subTitle+"','mode':'h','list':'off','module':'off','detail':'1user1 path','leavecancel':false,'file':'"+o+"'",y=PPx.Extract('%*script("%sgu\'ppmlib\'\\input.js","{'+g+'}")');("[error]"===y||isEmptyStr(y))&&PPx.Quit(-1);var h=PPx.Extract(y).trim().split(" ");if(a.question("[Multiple "+v+"]"+i+h.join(i))){for(var b=[],E=p[v],N=0,F=h.length;N<F;N++){var C=h[N];isEmptyStr(C)||E(C,x,b)}"Link"===v&&b.length>0&&c.symlink(b,u)}},getOptions=function(t,e,r){var n="";if(!withinRange(t,2)||!withinRange(e,2))return[!0,n];if(t<2){var i={0:{ppc:"3",fc:"noexist_only"},1:{ppc:"0",fc:"update"},2:{ppc:"2",fc:"force_copy"}}[e];n=1===t?"/cmd="+i.fc+" "+r:"-sameall -same:"+i.ppc+" "+r}return[!1,n]},p={Copy:function(t,e){a.execute("C","*wait 100,2%%:*ppcfile !copy -log:off -undolog:off -querycreatedirectory:off -dest:"+t+" "+e)},FastCopy:function(t,e){var r=c.getFcPath();if(r){var n=a.extract("C","%%#FDCSN")[1],i=e+" /filelog="+PPx.Extract('%*name(DCU,"%*temp()%\\fastcopy.log")')+" /postproc=false "+n+" /to="+t+"%\\";a.execute("C",r+" %("+i+"%)")}},Link:function(t,e,r){c.symlinkCmdline(t,r)}};main();
