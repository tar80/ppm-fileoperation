﻿var e=PPx.CreateObject("Scripting.FileSystemObject"),t={ppmName:"ppx-plugin-manager",ppmVersion:.95,language:"ja",encode:"utf16le",nlcode:"\r\n",nltype:"crlf",ppmID:"P",ppmSubID:"Q"},useLanguage=function(){var e=PPx.Extract("%*getcust(S_ppm#global:lang)");return"en"===e||"ja"===e?e:t.language},tmp=function(){var e=PPx.Extract('%*extract(C,"%%*temp()")');return{dir:e,file:e+"_ppmtemp",lf:e+"_temp.xlf",stdout:e+"_stdout",stderr:e+"_stderr",ppmDir:function(){var e=PPx.Extract("%'temp'%\\ppm");return PPx.Execute("*makedir "+e),e}}},r={en:{notExistList:"cleanup.txt does not exist",question:"Start clenup",complete:"Completed",remaining:"There are files that failed to cleanup",test:"**Test Execution**\nPaths below are subject to deletion\n"},ja:{notExistList:"cleanup.txtがありません",question:"不要ファイルを消去します",complete:"完了",remaining:"消去に失敗したファイルがあります",test:"**テスト実行**\n以下のパスが消去対象です\n"}},validArgs=function(){for(var e=[],t=PPx.Arguments;!t.atEnd();t.moveNext())e.push(t.value);return e},safeArgs=function(){for(var e=[],t=validArgs(),r=0,n=arguments.length;r<n;r++)e.push(_valueConverter(r<0||arguments.length<=r?undefined:arguments[r],t[r]));return e},_valueConverter=function(e,t){if(null==t||""===t)return null!=e?e:undefined;switch(typeof e){case"number":var r=Number(t);return isNaN(r)?e:r;case"boolean":return null!=t&&"false"!==t&&"0"!==t;default:return t}};Array.prototype.includes||(Array.prototype.includes=function(e,t){if(null==this)throw new Error('Array.includes: "this" is null or not defined');var r=Object(this),n=r.length>>>0;if(0===n)return!1;var u=null!=t?t:0,a=Math.max(u>=0?u:n-Math.abs(u),0);function sameValueZero(e,t){return e===t||"number"==typeof e&&"number"==typeof t&&isNaN(e)&&isNaN(t)}for(;a<n;){if(sameValueZero(r[a],e))return!0;a++}return!1});var isEmptyStr=function(e){return""===e},pathSelf=function(){var e,t,r=PPx.ScriptName;return~r.indexOf("\\")?(e=extractFileName(r),t=PPx.Extract("%*name(DKN,"+r+")")):(e=r,t=PPx.Extract("%FDN")),{scriptName:e,parentDir:t.replace(/\\$/,"")}},extractFileName=function(e,t){return void 0===t&&(t="\\"),"\\"!==t&&"/"!==t&&(t="\\"),e.slice(e.lastIndexOf(t)+1)},n="ppm-fileoperation",u=useLanguage();pathSelf();var _dialog=function(e,t){return 0===PPx.Execute('%"'+n+'" %OC %'+e+'"'+t+'"')},_hasTargetId=function(e){return"."!==e},a={echo:function(e,t){var r=t?"("+String(t)+")":"";return _dialog("I",""+e+r)},question:function(e){return _dialog("Q",e)},execute:function(e,t,r){return void 0===r&&(r=!1),isEmptyStr(t)?1:_hasTargetId(e)?r?Number(PPx.Extract("%*extract("+e+',"'+t+'%%:0")')):PPx.Execute("*execute "+e+","+t):PPx.Execute(t)},extract:function(e,t){if(isEmptyStr(t))return[13,""];var r=_hasTargetId(e)?PPx.Extract("%*extract("+e+',"'+t+'")'):PPx.Extract(t);return[Number(PPx.Extract()),r]}},ignoreValidTempDir=function(){for(var e=PPx.Extract("%*ppxlist(-C)").split(","),t=[],r=0;r<e.length;r++){var n=e[r],u=PPx.Extract("%*extract("+n+',"!%%*name(C,""%%*temp()"")")');t.includes(u)||t.push(u)}return t.join(";").replace(/\./g,"*")},i=r[u];(function(){var t=safeArgs(!1)[0],r=PPx.Extract("%sgu'ppmcache'\\list\\cleanup.txt");if(e.FileExists(r)){!a.question(i.question)&&PPx.Quit(-1);var n=["-min","-qstart","-error:ignore","-symdel:sym","-undolog:off","-nocount"].join(" "),u=tmp().dir+"\\cleanup.txt",c=PPx.Extract("%OC %*extract(\"%*insertSource(%sgu'ppmcache'\\list\\cleanup.txt)\")").replace(/,/g,";");PPx.Execute('%Os *whereis -path:"'+c+'" -dir:on -subdir:off -name -listfile:'+u),PPx.Execute('%Os *ppcfile !delete -src:"@'+u+'" '+n),t&&(PPx.Execute('%Os *whereis -path:%\'temp\' -mask1:"PPX*TMP" -mask2:"'+ignoreValidTempDir()+'" -dir:on -subdir:off -name -listfile:'+u),PPx.Execute('*ppcfile !delete -src:"@'+u+'" '+n))}else a.echo(i.notExistList)})();
