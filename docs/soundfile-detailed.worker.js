!function(t){var e={};function r(n){if(e[n])return e[n].exports;var a=e[n]={i:n,l:!1,exports:{}};return t[n].call(a.exports,a,a.exports,r),a.l=!0,a.exports}r.m=t,r.c=e,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var a in t)r.d(n,a,function(e){return t[e]}.bind(null,a));return n},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=0)}([function(t,e,r){"use strict";r.r(e);var n={legendformatterTime:function(t,e){return n.round(e/t,5)},tickerLabelformatterTime:function(t,e){return n.round(e/t,3)},tickerValuePreFormatter:function(t,e){return e/t},tickerValuePostFormatter:function(t,e){return e*t},tickerAmplitude:function(t,e,r){function a(t){return n.round(t,2)}var o=r-e;return[{value:e,label:a(e)},{value:e+.25*o,label:a(e+.25*o)},{value:e+.5*o,label:a(e+.5*o)},{value:e+.75*o,label:a(e+.75*o)},{value:r,label:a(r)}]},toDb:function(t,e){return e||(e=2),t=20*n.log10(t),n.round(t,e)},round:function(t,e){var r=Math.pow(10,e);return Math.round(t*r)/r},getColor:function(t){return t>=o.length?"#000000":o[t]},getName:function(t){return t>=u.length?"Ch"+t:u[t]},getShortName:function(t){return i>=i.length?"Ch"+t:i[t]},getTitle:function(t){return{label:t,align:"left",size:17,padding:0}},getBorder:function(){return{width:"1px"}},log10:function(t){return Math.log(t)/Math.LN10}},a=n,o=["#000000","#0000FF","#FF0000","#800080","#00FF00","#8080FF","#FF8080","#FF00FF","#00FFFF"],u=["Time(S)","Left","Right","Center","LFE","Surr left","Surr right","Surr back left","Surr back right"],i=["S","L","R","C","LFE","SL","SR","SBL","SBR"],l={};function c(t,e){if(!(this instanceof c))return new c(t);var r=Math.floor(Math.log(t)/Math.LN2);if(Math.pow(2,r)===t){this._bufferSize=t,this._bandwidth=c.calculateBandwidth(t,e);for(var n=new Float32Array(t/2),a=new Float32Array(t/2),o=0;o<t/2;o++)n[o]=Math.cos(2*Math.PI*o/t),a[o]=Math.sin(2*Math.PI*o/t);this._cosTable=n,this._sinTable=a,this._real=new Float32Array(t),this._imag=new Float32Array(t);for(var u,i=new Uint32Array(t),l=1,f=t>>1;l<t;){for(u=0;u<l;u++)i[u+l]=i[u]+f;l<<=1,f>>=1}this._reverseTable=i}else console.error("Invalid buffer size, must be a power of 2.")}function f(t,e){if(this._func=t,e){var r=new Float32Array(e);this._data=r;for(var n=0;n<e;++n)r[n]=this._func(e,n);this.process=function(t,e){var n=t.length;if(e)for(var a=0;a<n;++a)e[a]=t[a]*r[a];else for(var o=0;o<n;++o)t[o]*=r[o]}}else this.process=function(e,r){var n=e.length;if(r)for(var a=0;a<n;++a)r[a]=e[a]*t(n,a);else for(var o=0;o<n;++o)e[o]*=t(n,o)}}c.prototype.fft=function(t){if(t.length===this._bufferSize){for(var e=this._bufferSize,r=this._cosTable,n=this._sinTable,a=this._reverseTable,o=this._real,u=this._imag,i=0;i<e;++i)o[i]=t[a[i]],u[i]=0;for(var l=2;l<=e;l*=2)for(var c=l/2,f=e/l,s=0;s<e;s+=l)for(var h=s,p=0;h<s+c;++h,p+=f){var g=o[h+c]*r[p]+u[h+c]*n[p],m=-o[h+c]*n[p]+u[h+c]*r[p];o[h+c]=o[h]-g,u[h+c]=u[h]-m,o[h]+=g,u[h]+=m}}else console.error("Given buffer has size other than expected. Expected: "+this._bufferSize+" found: "+t.length)},c.prototype.getReal=function(){return this._real},c.prototype.getImaginary=function(){return this._imag},c.prototype.getBandFrequency=function(t){return this._bandwidth*t+this._bandwidth/2},c.prototype.calculateSpectrum=function(t){var e=this._bufferSize/2;t||(t=new Float32Array(e));for(var r=1/this._bufferSize,n=this._real,a=this._imag,o=Math.sqrt,u=0;u<e;++u)t[u]=r*o(n[u]*n[u]+a[u]*a[u]);return t},c.prototype.calculateSpectrumDb=function(t){var e=this._bufferSize/2;t||(t=new Float32Array(e));for(var r,n=1/this._bufferSize,a=this._real,o=this._imag,u=Math.sqrt,i=0;i<e;++i)t[i]=20*(r=n*u(a[i]*a[i]+o[i]*o[i]),Math.log(r)/Math.LN10);return t},c.calculatePow2Size=function(t){return Math.pow(2,Math.ceil(Math.log(t)/Math.log(2)))},c.calculateBandwidth=function(t,e){return 2/t*e/2},c.binIndexToFreq=function(t,e){return e*t+e/2},c.freqToBinIndex=function(t,e){return(t-e/2)/e},l.FFT=c,f.prototype.getData=function(){return this._data};var s=2*Math.PI,h={Bartlett:function(t){return new f((function(t,e){return 2/(t-1)*((t-1)/2-Math.abs(e-(t-1)/2))}),t)},BartlettHann:function(t){return new f((function(t,e){return.62-.48*Math.abs(e/(t-1)-.5)-.38*Math.cos(s*e/(t-1))}),t)},Blackman:function(t,e){var r=(1-(e=e||.16))/2,n=e/2;return new f((function(t,e){return r-.5*Math.cos(s*e/(t-1))+n*Math.cos(4*Math.PI*e/(t-1))}),t)},Cosine:function(t){return new f((function(t,e){return Math.cos(Math.PI*e/(t-1)-Math.PI/2)}),t)},Gauss:function(t,e){e=e||.25;return new f((function(t,r){return Math.pow(Math.E,-.5*Math.pow((r-(t-1)/2)/(e*(t-1)/2),2))}),t)},Hamming:function(t){return new f((function(t,e){return.54-.46*Math.cos(s*e/(t-1))}),t)},Hann:function(t){return new f((function(t,e){return.5*(1-Math.cos(s*e/(t-1)))}),t)},Lanczos:function(t){return new f((function(t,e){var r=2*e/(t-1)-1;return Math.sin(Math.PI*r)/(Math.PI*r)}),t)},Rectangular:function(){return new f((function(){return 1}),length)},Triangular:function(t){return new f((function(t,e){return 2/t*(t/2-Math.abs(e-(t-1)/2))}),t)}};l.windowFunctions=h,l.biquad=function(t,e,r,n,a,o){var u=0,i=0;this.processBuffer=function(n,l){l||(l=n);for(var c=0;c<n.length;++c){var f=n[c]*t+u;u=n[c]*e-f*a+i,i=n[c]*r-f*o,l[c]=f}},this.processSample=function(n){var l=n*t+u;return u=n*e-l*a+i,i=n*r-l*o,l}},l.allpass=function(t,e){t>e/2.0001&&(t=e/2.0001);var r=Math.tan(Math.PI*t/e),n=(1-r)/(1+r),a=n,o=-n;return new l.biquad(a,-1,0,1,o,0)};var p=l;onmessage=function(t){var e=t.data,r={channels:e.channels};!function(t,e){console.time("calculateLoudestPart");for(var r,n,a=.95*t.peak,o=.02*t.sampleRate,u=0,i=0;i<e.channels.length;++i){for(var l=e.channels[i].graph,c=0,f=0,s=0,h=-1,p=0,g=Math.min(o,l.length)-1;h<g;)Math.abs(l[++h])>a&&++p;for(c=s,f=p,g=l.length-1;h<g;)Math.abs(l[s++])>a&&--p,Math.abs(l[++h])>a&&++p,p>f&&(f=p,c=s);f>u&&(u=f,n=c,r=i)}e.channels[r].loudestPart={count:u,index:n+o/2},console.timeEnd("calculateLoudestPart")}(e,r),function(t,e){console.time("calculateAvgSpectrum");var r=Math.ceil(t.numSamples/t.sampleRate),n=p.FFT.calculatePow2Size(t.sampleRate),o=n/2,u=p.windowFunctions.Blackman(t.sampleRate).getData(),i=new p.FFT(n,t.sampleRate),l=new Float32Array(n);e.channels.forEach((function(e){for(var c=e.graph,f=new Float32Array(o),s=c.length,h=0;h<s;){for(var p=Math.min(h+t.sampleRate,s),g=0;h<p;++h,++g)l[g]=c[h]*u[g];for(;g<n;++g)l[g]=0;i.fft(l);for(var m=i.getReal(),v=i.getImaginary(),M=0;M<o;++M)f[M]+=m[M]*m[M]+v[M]*v[M]}for(var b=e.rms,d=t.sampleRate*t.sampleRate*r,w=0;w<o;++w)f[w]=20*a.log10(Math.sqrt(f[w]/d)/b);e.avgSpectrum=f.subarray(0,o)})),console.timeEnd("calculateAvgSpectrum")}(e,r),function(t,e){console.time("calculateAllpass");var r=[20,60,200,600,2e3,6e3,2e4],n=0;e.channels.forEach((function(e){e.allpass=[],r.forEach((function(r){for(var a=e.graph,o=new p.allpass(r,t.sampleRate),u=0,i=0,l=0,c=0;c<a.length;++c){var f=o.processSample(a[c]);u+=f*f,f>i?i=f:f<l&&(l=f)}var s=Math.max(i,Math.abs(l))/Math.sqrt(u/t.numSamples);n=Math.max(n,s),e.allpass.push(s)}))})),e.allpass={freqs:r,maxCrest:n},console.timeEnd("calculateAllpass")}(e,r),function(t){console.time("calculateHistogram");var e=Math.pow(2,t.bitDepth-1)-1;t.channels.forEach((function(r){for(var n=new Float32Array(Math.pow(2,t.bitDepth)),a=r.graph,o=0;o<a.length;++o)++n[Math.round((a[o]+1)*e)];for(var u={},i=0,l=0,c=0;c<n.length;++c)n[c]&&!u[c]&&(u[c]=!0,++l,i=Math.max(i,n[c]));r.histogram={graph:n,bits:Math.log2(l),peak:i}})),console.timeEnd("calculateHistogram")}(e);for(var n=[],o=0;o<r.channels.length;++o)n.push(r.channels[o].graph.buffer),n.push(r.channels[o].avgSpectrum.buffer),n.push(r.channels[o].histogram.graph.buffer);postMessage(r,n)}}]);