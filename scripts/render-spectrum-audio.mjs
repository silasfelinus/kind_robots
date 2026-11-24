import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  SPECTRUM_THEMES,
  SPECTRUM_BOSS_MUSIC,
  SPECTRUM_CLASSIC_MUSIC,
  SPECTRUM_MENU_MUSIC,
} from '../utils/arcade/superkateSpectrum/music.ts'

function renderWave(loop) {
  const rate=16000
  const tracks=loop.tracks.map(track=>({...track,tokens:track.steps.trim().split(/\s+/)}))
  const steps=Math.max(...tracks.map(track=>track.tokens.length))
  const repeats=steps<32?2:1
  const stepDur=60/loop.bpm/(loop.stepsPerBeat??2)
  const length=Math.round(repeats*steps*stepDur*rate)
  const mix=new Float64Array(length)
  const pitches={C:-9,D:-7,E:-5,F:-4,G:-2,A:0,B:2}
  let seed=0x51a7e
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1}
  for(let repeat=0;repeat<repeats;repeat++)for(const track of tracks)for(let i=0;i<track.tokens.length;i++){
    const token=track.tokens[i]
    if(token==="."||token==="-")continue
    let hold=1
    while(track.tokens[i+hold]==="-")hold++
    const start=Math.round((repeat*steps+i)*stepDur*rate)
    const duration=Math.max(1,Math.round(hold*stepDur*rate*0.94))
    const match=/^([A-G])(#|b)?(\d)$/.exec(token)
    if(!track.noise&&!match)throw Error("invalid note "+token)
    if(track.noise&&token!=="x")throw Error("invalid drum "+token)
    const freq=match?440*2**((pitches[match[1]]+(match[2]==="#"?1:match[2]==="b"?-1:0)+(Number(match[3])-4)*12)/12):0
    let filtered=0
    for(let n=0;n<duration&&start+n<length;n++){
      const t=n/rate,p=2*Math.PI*freq*t
      const attack=Math.min(1,t/0.008),release=Math.min(1,(duration-n)/(rate*0.025))
      let voice=0
      if(track.noise){filtered=0.55*filtered+0.45*random();voice=filtered*Math.exp(-t*24)}
      else if(track.type==="square")voice=(Math.sin(p)+Math.sin(3*p)/3+Math.sin(5*p)/5)*0.74
      else if(track.type==="sawtooth")voice=(Math.sin(p)-Math.sin(2*p)/2+Math.sin(3*p)/3-Math.sin(4*p)/4)*0.78
      else if(track.type==="triangle")voice=(Math.sin(p)-Math.sin(3*p)/9+Math.sin(5*p)/25)*0.9
      else voice=Math.sin(p)
      mix[start+n]+=voice*attack*release*Math.exp(-t*1.6)*(track.vol??0.04)
    }
  }
  const echo=Math.round(rate*0.12)
  const wet=Float64Array.from(mix,(v,i)=>v+0.13*mix[(i+length-echo)%length]+0.055*mix[(i+length-echo*2)%length])
  let peak=0,sum=0
  for(const v of wet){peak=Math.max(peak,Math.abs(v));sum+=v*v}
  const gain=Math.min(0.54/Math.max(peak,0.00001),0.145/Math.max(Math.sqrt(sum/length),0.00001))
  const bytes=new Uint8Array(44+length*2),view=new DataView(bytes.buffer)
  const ascii=(offset,str)=>{for(let j=0;j<str.length;j++)bytes[offset+j]=str.charCodeAt(j)}
  ascii(0,"RIFF");view.setUint32(4,bytes.length-8,true);ascii(8,"WAVE");ascii(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);ascii(36,"data");view.setUint32(40,length*2,true)
  let masteredPeak=0,masteredSum=0
  for(let i=0;i<length;i++){const edge=Math.min(1,i/128,(length-1-i)/128);const sample=Math.round(wet[i]*gain*edge*32767);view.setInt16(44+i*2,sample,true);masteredPeak=Math.max(masteredPeak,Math.abs(sample)/32767);masteredSum+=(sample/32767)**2}
  return {bytes,seconds:length/rate,peak:masteredPeak,rms:Math.sqrt(masteredSum/length)}
}

const loops = [...SPECTRUM_THEMES, ...SPECTRUM_BOSS_MUSIC, SPECTRUM_CLASSIC_MUSIC, SPECTRUM_MENU_MUSIC]
const output = 'public/audio/arcade/superkate-spectrum'
mkdirSync(output, { recursive: true })
for (const loop of loops) {
  const name = loop.recorded.src.split('/').at(-1)
  const wave = renderWave(loop)
  if (wave.peak > 0.55 || wave.rms < 0.02 || wave.rms > 0.15) throw new Error(`Invalid master: ${name}`)
  writeFileSync(join(output, name), wave.bytes)
  console.log(name, wave.seconds, wave.peak, wave.rms)
}
