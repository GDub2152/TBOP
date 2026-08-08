
window.BLOWTORCH_LIVE = (() => {
  const ZIP = {lat:41.42472, lon:-81.82135, label:"44135"};

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${ZIP.lat}&longitude=${ZIP.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day` +
    `&hourly=temperature_2m,temperature_80m,relative_humidity_2m,wind_speed_10m,precipitation_probability` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=7`;

  const endpoints = {
    kp:"https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
    flux:"https://services.swpc.noaa.gov/products/summary/10cm-flux.json",
    wind:"https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json",
    mag:"https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json",
    xray:"https://services.swpc.noaa.gov/json/goes/primary/xray-background-7-day.json",
    aindex:"https://services.swpc.noaa.gov/json/predicted_fredericksburg_a_index.json",
    alerts:"https://services.swpc.noaa.gov/products/alerts.json"
  };

  const n = v => {
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
  };

  function findNumeric(obj, preferred=[]) {
    if (obj == null) return null;
    if (Array.isArray(obj)) {
      for (let i=obj.length-1;i>=0;i--) {
        const v=findNumeric(obj[i], preferred);
        if(v!==null) return v;
      }
      return null;
    }
    if (typeof obj==="number") return Number.isFinite(obj)?obj:null;
    if (typeof obj==="string") {
      const x=Number(obj);
      return Number.isFinite(x)?x:null;
    }
    if (typeof obj==="object") {
      for (const key of preferred) {
        if (key in obj) {
          const x=n(obj[key]);
          if(x!==null) return x;
        }
      }
      for (const [k,v] of Object.entries(obj)) {
        if (/time|date|timestamp|satellite|energy/i.test(k)) continue;
        const x=n(v);
        if(x!==null) return x;
      }
    }
    return null;
  }

  function summaryValue(obj, preferred=[]) {
    if (Array.isArray(obj) && obj.length && Array.isArray(obj[0])) {
      const last=obj[obj.length-1];
      for(let i=last.length-1;i>=0;i--){
        const x=n(last[i]);
        if(x!==null) return x;
      }
    }
    if (Array.isArray(obj) && obj.length) {
      for(let i=obj.length-1;i>=0;i--){
        const x=findNumeric(obj[i], preferred);
        if(x!==null) return x;
      }
    }
    return findNumeric(obj, preferred);
  }

  function kpValue(rows){
    if(!Array.isArray(rows)||rows.length<2) return null;
    const hdr=rows[0].map(x=>String(x).toLowerCase());
    let idx=hdr.findIndex(x=>x.includes("kp"));
    if(idx<0) idx=1;
    for(let i=rows.length-1;i>=1;i--){
      const x=n(rows[i][idx]);
      if(x!==null) return x;
    }
    return null;
  }

  function latestXray(rows){
    if(!Array.isArray(rows)||!rows.length) return null;
    for(let i=rows.length-1;i>=0;i--){
      const r=rows[i];
      const candidates=["flux","observed_flux","xray_flux"];
      for(const k of candidates){
        if(r && k in r){
          const x=n(r[k]); if(x!==null) return x;
        }
      }
    }
    return null;
  }

  function xrayClass(flux){
    if(flux===null) return "--";
    if(flux>=1e-4) return "X";
    if(flux>=1e-5) return "M";
    if(flux>=1e-6) return "C";
    if(flux>=1e-7) return "B";
    return "A";
  }

  async function fetchJson(url){
    const r=await fetch(url,{cache:"no-store"});
    if(!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
  }

  async function getWeather(){
    return fetchJson(weatherUrl);
  }

  async function getSolar(){
    const keys=Object.keys(endpoints).filter(k=>k!=="alerts");
    const settled=await Promise.allSettled(keys.map(k=>fetchJson(endpoints[k])));
    const raw={};
    settled.forEach((r,i)=>{if(r.status==="fulfilled") raw[keys[i]]=r.value;});
    return {
      kp: kpValue(raw.kp),
      sfi: summaryValue(raw.flux,["Value","value","flux"]),
      solarWind: summaryValue(raw.wind,["Value","value","speed"]),
      bt: summaryValue(raw.mag,["Bt","bt","Value","value"]),
      bz: (() => {
        const m=raw.mag;
        if(m && !Array.isArray(m) && typeof m==="object"){
          for(const k of ["Bz","bz"]) if(k in m && n(m[k])!==null) return n(m[k]);
        }
        if(Array.isArray(m)){
          for(let i=m.length-1;i>=0;i--){
            const r=m[i];
            if(r && typeof r==="object"){
              for(const k of ["Bz","bz"]) if(k in r && n(r[k])!==null) return n(r[k]);
            }
          }
        }
        return null;
      })(),
      aIndex: summaryValue(raw.aindex,["a_index","A_INDEX","predicted_a_index","value"]),
      xrayFlux: latestXray(raw.xray),
      xrayClass: xrayClass(latestXray(raw.xray)),
      raw
    };
  }

  function grade(label, score){
    if(score>=2) return {label:"Excellent", cls:"good"};
    if(score>=1) return {label:"Good", cls:"good"};
    if(score>=0) return {label:"Fair", cls:"fair"};
    return {label:"Poor", cls:"poor"};
  }

  function hfBands(solar, weather){
    const kp=solar.kp ?? 4;
    const sfi=solar.sfi ?? 100;
    const isDay=weather?.current?.is_day===1;
    const stormPenalty=kp>=6?-3:kp>=5?-2:kp>=4?-1:0;
    const fluxBoost=sfi>=180?2:sfi>=140?1:sfi<90?-1:0;
    const bands=[
      ["160m",-1,2],["80m",0,2],["60m",0,1],["40m",1,2],["30m",1,1],
      ["20m",2,1],["17m",2,0],["15m",1,-1],["12m",1,-1],["10m",0,-2],["6m",-1,-2]
    ];
    return bands.map(([band,dayBase,nightBase])=>{
      let score=(isDay?dayBase:nightBase)+stormPenalty;
      if(["20m","17m","15m","12m","10m","6m"].includes(band)) score+=fluxBoost;
      if(["160m","80m","60m","40m"].includes(band) && kp<=2) score+=1;
      const current=grade(band,score);
      const day=grade(band,dayBase+stormPenalty+(["20m","17m","15m","12m","10m","6m"].includes(band)?fluxBoost:0));
      const night=grade(band,nightBase+stormPenalty+(["20m","17m","15m","12m","10m","6m"].includes(band)?fluxBoost:0));
      return {band,current,day,night,trend:stormPenalty<0?"Declining":fluxBoost>0?"Improving":"Stable"};
    });
  }

  function vhfBands(solar, weather){
    const c=weather?.current||{};
    const humidity=n(c.relative_humidity_2m) ?? 50;
    const wind=n(c.wind_speed_10m) ?? 10;
    const kp=solar.kp ?? 3;
    const hourly=weather?.hourly||{};
    const nowIndex=Array.isArray(hourly.time) ? Math.max(0,hourly.time.findIndex(t=>t>=c.time)) : 0;
    const t2=n(hourly.temperature_2m?.[nowIndex]);
    const t80=n(hourly.temperature_80m?.[nowIndex]);
    const inversion=(t2!==null&&t80!==null) ? t80-t2 : 0;
    let tropo=0;
    if(humidity>=75) tropo++;
    if(wind<=8) tropo++;
    if(inversion>=1.5) tropo+=2;
    if(inversion>=3) tropo++;
    const tropoGrade=tropo>=4?{label:"Enhanced",cls:"good"}:tropo>=2?{label:"Possible",cls:"fair"}:{label:"Normal",cls:"neutral"};
    const aurora=kp>=6?{label:"Aurora possible",cls:"good"}:kp>=5?{label:"Watch",cls:"fair"}:{label:"Quiet",cls:"neutral"};
    return [
      {band:"6m", current: solar.sfi>=150 && kp<=3 ? {label:"Es/HF potential",cls:"fair"}:{label:"Check openings",cls:"neutral"}, enhancement:"Sporadic-E / Tropo / Aurora"},
      {band:"2m", current:tropoGrade, enhancement:`Tropo ${tropoGrade.label}; ${aurora.label}`},
      {band:"1.25m", current:tropoGrade, enhancement:`Tropo ${tropoGrade.label}`},
      {band:"70cm", current:tropoGrade, enhancement:`Tropo ${tropoGrade.label}`},
      {band:"33cm", current:tropoGrade, enhancement:`Tropo ${tropoGrade.label}`},
      {band:"23cm", current:tropoGrade, enhancement:`Tropo ${tropoGrade.label}; rain scatter may matter`}
    ];
  }

  return {ZIP,endpoints,getWeather,getSolar,hfBands,vhfBands,xrayClass};
})();
