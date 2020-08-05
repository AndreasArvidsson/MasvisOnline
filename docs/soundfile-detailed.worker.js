!function(t){var e={};function r(a){if(e[a])return e[a].exports;var n=e[a]={i:a,l:!1,exports:{}};return t[a].call(n.exports,n,n.exports,r),n.l=!0,n.exports}r.m=t,r.c=e,r.d=function(t,e,a){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:a})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var a=Object.create(null);if(r.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)r.d(a,n,function(e){return t[e]}.bind(null,n));return a},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=0)}([function(t,e,r){"use strict";r.r(e);var a={tickerLabelformatterTime:function(t,e,r){return r(e/t)},tickerValuePreFormatter:function(t,e){return e/t},tickerValuePostFormatter:function(t,e){return e*t},toDb:function(t,e){return e?a.round(20*o(t),e):20*o(t)},round:function(t,e){var r=Math.pow(10,e);return Math.round(t*r)/r},getColor:function(t){return t>=u.length?"#000000":u[t]},getName:function(t){return t>=i.length?"Ch"+t:i[t]},getShortName:function(t){return c>=c.length?"Ch"+t:c[t]},getTitle:function(t){return{label:t,align:"left",size:17,padding:0}},getBorder:function(){return{width:"1px"}}},n=a,o=function(t){return Math.log(t)/Math.LN10},u=["#000000","#0000FF","#FF0000","#800080","#00FF00","#8080FF","#FF8080","#FF00FF","#00FFFF"],i=["Time(S)","Left","Right","Center","LFE","Surr left","Surr right","Surr back left","Surr back right"],c=["S","L","R","C","LFE","SL","SR","SBL","SBR"],s={};function l(t,e){if(!(this instanceof l))return new l(t);var r=Math.floor(Math.log(t)/Math.LN2);if(Math.pow(2,r)===t){this._bufferSize=t,this._bandwidth=l.calculateBandwidth(t,e);for(var a=new Float32Array(t/2),n=new Float32Array(t/2),o=0;o<t/2;o++)a[o]=Math.cos(2*Math.PI*o/t),n[o]=Math.sin(2*Math.PI*o/t);this._cosTable=a,this._sinTable=n,this._real=new Float32Array(t),this._imag=new Float32Array(t);for(var u,i=new Uint32Array(t),c=1,s=t>>1;c<t;){for(u=0;u<c;u++)i[u+c]=i[u]+s;c<<=1,s>>=1}this._reverseTable=i}else console.error("Invalid buffer size, must be a power of 2.")}function f(t,e){if(this._func=t,e){var r=new Float32Array(e);this._data=r;for(var a=0;a<e;++a)r[a]=this._func(e,a);this.process=function(t,e){var a=t.length;if(e)for(var n=0;n<a;++n)e[n]=t[n]*r[n];else for(var o=0;o<a;++o)t[o]*=r[o]}}else this.process=function(e,r){var a=e.length;if(r)for(var n=0;n<a;++n)r[n]=e[n]*t(a,n);else for(var o=0;o<a;++o)e[o]*=t(a,o)}}l.prototype.fft=function(t){if(t.length===this._bufferSize){for(var e=this._bufferSize,r=this._cosTable,a=this._sinTable,n=this._reverseTable,o=this._real,u=this._imag,i=0;i<e;++i)o[i]=t[n[i]],u[i]=0;for(var c=2;c<=e;c*=2)for(var s=c/2,l=e/c,f=0;f<e;f+=c)for(var h=f,p=0;h<f+s;++h,p+=l){var m=o[h+s]*r[p]+u[h+s]*a[p],g=-o[h+s]*a[p]+u[h+s]*r[p];o[h+s]=o[h]-m,u[h+s]=u[h]-g,o[h]+=m,u[h]+=g}}else console.error("Given buffer has size other than expected. Expected: "+this._bufferSize+" found: "+t.length)},l.prototype.getReal=function(){return this._real},l.prototype.getImaginary=function(){return this._imag},l.prototype.getBandFrequency=function(t){return this._bandwidth*t+this._bandwidth/2},l.prototype.calculateSpectrum=function(t){var e=this._bufferSize/2;t||(t=new Float32Array(e));for(var r=1/this._bufferSize,a=this._real,n=this._imag,o=Math.sqrt,u=0;u<e;++u)t[u]=r*o(a[u]*a[u]+n[u]*n[u]);return t},l.prototype.calculateSpectrumDb=function(t){var e=this._bufferSize/2;t||(t=new Float32Array(e));for(var r,a=1/this._bufferSize,n=this._real,o=this._imag,u=Math.sqrt,i=0;i<e;++i)t[i]=20*(r=a*u(n[i]*n[i]+o[i]*o[i]),Math.log(r)/Math.LN10);return t},l.calculatePow2Size=function(t){return Math.pow(2,Math.ceil(Math.log(t)/Math.log(2)))},l.calculateBandwidth=function(t,e){return 2/t*e/2},l.binIndexToFreq=function(t,e){return e*t+e/2},l.freqToBinIndex=function(t,e){return(t-e/2)/e},s.FFT=l,f.prototype.getData=function(){return this._data};var h=2*Math.PI,p={Bartlett:function(t){return new f((function(t,e){return 2/(t-1)*((t-1)/2-Math.abs(e-(t-1)/2))}),t)},BartlettHann:function(t){return new f((function(t,e){return.62-.48*Math.abs(e/(t-1)-.5)-.38*Math.cos(h*e/(t-1))}),t)},Blackman:function(t,e){var r=(1-(e=e||.16))/2,a=e/2;return new f((function(t,e){return r-.5*Math.cos(h*e/(t-1))+a*Math.cos(4*Math.PI*e/(t-1))}),t)},Cosine:function(t){return new f((function(t,e){return Math.cos(Math.PI*e/(t-1)-Math.PI/2)}),t)},Gauss:function(t,e){e=e||.25;return new f((function(t,r){return Math.pow(Math.E,-.5*Math.pow((r-(t-1)/2)/(e*(t-1)/2),2))}),t)},Hamming:function(t){return new f((function(t,e){return.54-.46*Math.cos(h*e/(t-1))}),t)},Hann:function(t){return new f((function(t,e){return.5*(1-Math.cos(h*e/(t-1)))}),t)},Lanczos:function(t){return new f((function(t,e){var r=2*e/(t-1)-1;return Math.sin(Math.PI*r)/(Math.PI*r)}),t)},Rectangular:function(){return new f((function(){return 1}),length)},Triangular:function(t){return new f((function(t,e){return 2/t*(t/2-Math.abs(e-(t-1)/2))}),t)}};s.windowFunctions=p,s.biquad=function(t,e,r,a,n,o){var u=0,i=0;this.processBuffer=function(a,c){c||(c=a);for(var s=0;s<a.length;++s){var l=a[s]*t+u;u=a[s]*e-l*n+i,i=a[s]*r-l*o,c[s]=l}},this.processSample=function(a){var c=a*t+u;return u=a*e-c*n+i,i=a*r-c*o,c}},s.allpass=function(t,e){t>e/2.0001&&(t=e/2.0001);var r=Math.tan(Math.PI*t/e),a=(1-r)/(1+r),n=a,o=-a;return new s.biquad(n,-1,0,1,o,0)};var m=s;onmessage=function(t){var e=t.data,r={channels:e.channels};!function(t,e){console.time("calculateLoudestPart");for(var r,a,n=.95*t.peak,o=.02*t.sampleRate,u=0,i=0;i<e.channels.length;++i){for(var c=e.channels[i].graph,s=0,l=0,f=0,h=-1,p=0,m=Math.min(o,c.length)-1;h<m;)Math.abs(c[++h])>n&&++p;for(s=f,l=p,m=c.length-1;h<m;)Math.abs(c[f++])>n&&--p,Math.abs(c[++h])>n&&++p,p>l&&(l=p,s=f);l>u&&(u=l,a=s,r=i)}e.channels[r].loudestPart={count:u,index:a+o/2},console.timeEnd("calculateLoudestPart")}(e,r),function(t,e){console.time("calculateAvgSpectrum");var r=m.FFT.calculatePow2Size(t.sampleRate),a=r/2,o=m.windowFunctions.Blackman(t.sampleRate).getData(),u=new m.FFT(r,t.sampleRate),i=new Float32Array(r);e.channels.forEach((function(e){for(var c=e.graph,s=new Float32Array(a),l=c.length,f=0;f<l;){for(var h=Math.min(f+t.sampleRate,l),p=0;f<h;++f,++p)i[p]=c[f]*o[p];for(;p<r;++p)i[p]=0;u.fft(i);for(var m=u.getReal(),g=u.getImaginary(),M=0;M<a;++M)s[M]+=m[M]*m[M]+g[M]*g[M]}for(var v=e.rms,b=t.sampleRate*l,d=0;d<a;++d)s[d]=n.toDb(Math.sqrt(s[d]/b)/v);e.avgSpectrum=s})),console.timeEnd("calculateAvgSpectrum")}(e,r),function(t,e){console.time("calculateAllpass");var r=[20,60,200,600,2e3,6e3,2e4];e.channels.forEach((function(e){e.allpass=[],r.forEach((function(r){for(var a=e.graph,n=new m.allpass(r,t.sampleRate),o=0,u=0,i=0,c=0;c<a.length;++c){var s=n.processSample(a[c]);o+=s*s,s>u?u=s:s<i&&(i=s)}var l=Math.max(u,Math.abs(i)),f=Math.sqrt(o/t.numSamples);e.allpass.push(l/f)}))})),e.allpass={freqs:r},console.timeEnd("calculateAllpass")}(e,r),function(t){console.time("calculateHistogram");var e=Math.pow(2,t.bitDepth-1)-1;t.channels.forEach((function(r){for(var a=new Float32Array(Math.pow(2,t.bitDepth)),n=r.graph,o=0;o<n.length;++o)++a[Math.round((n[o]+1)*e)];for(var u={},i=0,c=0,s=0;s<a.length;++s)a[s]&&!u[s]&&(u[s]=!0,++c,i=Math.max(i,a[s]));r.histogram={graph:a,bits:Math.log2(c),peak:i}})),console.timeEnd("calculateHistogram")}(e),function(t,e){console.time("calculatePeakVsRms");var r=0,a=Math.pow(2,t.bitDepth-1)-1,o=-(Math.pow(2,t.bitDepth-1)-1);e.channels.forEach((function(e){for(var u=e.graph,i=Math.ceil(t.numSamples/t.sampleRate),c=new Float32Array(i),s=new Float32Array(i),l=new Float32Array(i),f=u.length,h=0,p=0;p<f;++h){for(var m=Math.min(t.sampleRate,f-p),g=p+m,M=0,v=0,b=0;p<g;++p){var d=u[p];M+=d*d,d<0?(r+=Math.pow(Math.ceil(d*o),2),d<b&&(b=d)):(r+=Math.pow(Math.ceil(d*a),2),d>v&&(v=d))}var w=Math.max(v,Math.abs(b)),F=Math.sqrt(M/m);c[h]=n.toDb(F),s[h]=n.toDb(w),l[h]=n.toDb(w/F)}e.peakVsRms={peak:s,rms:c,crest:l}})),e.checksum=r,console.timeEnd("calculatePeakVsRms")}(e,r);var a=[];r.channels.forEach((function(t){a.push(t.graph.buffer),a.push(t.avgSpectrum.buffer),a.push(t.histogram.graph.buffer),a.push(t.peakVsRms.peak.buffer),a.push(t.peakVsRms.rms.buffer),a.push(t.peakVsRms.crest.buffer)})),postMessage(r,a)}}]);