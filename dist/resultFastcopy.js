﻿var e=PPx.CreateObject("Scripting.FileSystemObject"),expandNlCode=function(e){var r="\n",t=e.indexOf("\r");return~t&&(r="\r\n"==e.substring(t,t+2)?"\r\n":"\r"),r},r={ppmName:"ppx-plugin-manager",ppmVersion:.95,language:"ja",nlcode:"\r\n",nltype:"crlf",ppmID:"P",ppmSubID:"Q"},useLanguage=function(){var e=PPx.Extract("%*getcust(S_ppm#global:lang)");return"en"===e||"ja"===e?e:r.language},isEmptyStr=function(e){return""===e},exec=function(e,r){try{var t;return[!1,null!=(t=r())?t:""]}catch(n){return[!0,""]}finally{e.Close()}},read=function(r){var t=r.path,n=r.enc,a=void 0===n?"utf8":n;if(!e.FileExists(t))return[!0,t+" not found"];var u=e.GetFile(t);if(0===u.Size)return[!0,t+" has no data"];var i=!1,l="";if("utf8"===a){var s=PPx.CreateObject("ADODB.Stream"),o=exec(s,(function(){return s.Open(),s.Charset="UTF-8",s.LoadFromFile(t),s.ReadText(-1)}));i=o[0],l=o[1]}else{var c="utf16le"===a?-1:0,f=u.OpenAsTextStream(1,c),p=exec(f,(function(){return f.ReadAll()}));i=p[0],l=p[1]}return i?[!0,"Unable to read "+t]:[!1,l]},readLines=function(e){var r,t=e.path,n=e.enc,a=void 0===n?"utf8":n,u=e.linefeed,i=read({path:t,enc:a}),l=i[0],s=i[1];if(l)return[!0,s];u=null!=(r=u)?r:expandNlCode(s.slice(0,1e3));var o=s.split(u);return isEmptyStr(o[o.length-1])&&o.pop(),[!1,{lines:o,nl:u}]},t={en:{resultNotExist:"Result log does not exist",couldNotRead:"Could not read result log",noProcess:"There was no processing"},ja:{resultNotExist:"ログがありません",couldNotRead:"ログを読めませんでした",noProcess:"処理なし"}};Array.prototype.includes||(Array.prototype.includes=function(e,r){if(null==this)throw new TypeError('Array.includes: "this" is null or not defined');var t=Object(this),n=t.length>>>0;if(0===n)return!1;var a=null!=r?r:0,u=Math.max(a>=0?a:n-Math.abs(a),0);function sameValueZero(e,r){return e===r||"number"==typeof e&&"number"==typeof r&&isNaN(e)&&isNaN(r)}for(;u<n;){if(sameValueZero(t[u],e))return!0;u++}return!1});var pathSelf=function(){var e,r,t=PPx.ScriptName;return~t.indexOf("\\")?(e=t.replace(/^.*\\/,""),r=PPx.Extract("%*name(DKN,"+t+")")):(e=t,r=PPx.Extract("%FDN")),{scriptName:e,parentDir:r.replace(/\\$/,"")}};useLanguage(),pathSelf();var datetime=function(){var e=PPx.Extract("%*getcust(S_ppm#user:fo_datetime)");return isEmptyStr(e)?"":PPx.Extract('%bt%*nowdatetime("'+e+'")')},validArgs=function(){for(var e=[],r=PPx.Arguments;!r.atEnd();r.moveNext())e.push(r.value);return e},safeArgs=function(){for(var e=[],r=validArgs(),t=0,n=arguments.length;t<n;t++)e.push(_valueConverter(t<0||arguments.length<=t?undefined:arguments[t],r[t]));return e},_valueConverter=function(e,r){if(null==r||""===r)return null!=e?e:undefined;switch(typeof e){case"number":var t=Number(r);return isNaN(t)?e:t;case"boolean":return"false"!==r&&"0"!==r&&null!=r;default:return r}},n=t[useLanguage()],a="CopyFC",u="utf8",i="\r\n",main=function(){var r=safeArgs("")[0];if(e.FileExists(r)){var t=readLines({path:r,enc:u,linefeed:i}),l=t[0],s=t[1];l?PPx.linemessage(a+"\t"+n.couldNotRead):PPx.Execute('*execute C,*unmarkentry path:%%:%%K~"@^F5"%%:*linemessage '+resultMsg(s.lines))}else PPx.linemessage(a+"\t"+n.resultNotExist)},resultMsg=function(e){for(var r,t=0,u=0,i=0,l=e.length-1;0<l;l--){if(~(r=e[l]).indexOf("TotalFiles")){var s=r.replace(/^TotalFiles\s+=\s(\d+)\s.*$/,"$1");t=Number(s);break}if(~r.indexOf("SkipFiles")){var o=r.replace(/^SkipFiles\s+=\s(\d+).*$/,"$1");u=Number(o)}else if(~r.indexOf("Result")){var c=r.replace(/^Result\s\D+(\d+)\D+(\d+).+$/,"$1,$2").split(",");i=Number(c[0])+Number(c[1])}}if(null==i)return a+"\t"+n.noProcess;var f=t+i+u,p=[];u>0&&p.push("Skip:"+u),i>0&&p.push("Error:"+i);var d=0===p.length?"":" ["+p.join(",")+"]";return a+"\t"+t+"/"+f+d+datetime()};main();