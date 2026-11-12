import { useEffect, useRef } from 'react'

export function AsciiArt({ variant = 'riot' }: { variant?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const buffer = document.createElement('canvas')
    const ink = buffer.getContext('2d')!
    let frame = 0, raf = 0, width = 0, height = 0
    let mouseX = 0, mouseY = 0
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    function resize() {
      if (!canvas || !ctx) return
      const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2)
      width = r.width; height = r.height; canvas.width = width*dpr; canvas.height = height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0)
      buffer.width = Math.max(36, Math.floor(width/8)); buffer.height = Math.max(30, Math.floor(height/13))
    }
    function draw() {
      if (!canvas || !ctx) return
      const w=buffer.width,h=buffer.height,cx=w*.53+mouseX*2,cy=h*.49+mouseY*2, unit=Math.min(w,h*1.5)*.31, tick=frame*.003
      ink.clearRect(0,0,w,h); ink.strokeStyle='white'; ink.lineWidth=.75
      // An engraved watch: the motion belongs to the hands, not the visitor's scroll.
      ink.save(); ink.translate(cx,cy); ink.scale(1,.62)
      for(let r=unit*.87;r<unit;r+=2){ink.beginPath();ink.arc(0,0,r,0,Math.PI*2);ink.stroke()}
      for(let i=0;i<60;i++){const a=i*Math.PI/30;ink.beginPath();ink.moveTo(Math.cos(a)*unit*.78,Math.sin(a)*unit*.78);ink.lineTo(Math.cos(a)*unit*(i%5===0?.68:.74),Math.sin(a)*unit*(i%5===0?.68:.74));ink.stroke()}
      ink.beginPath();ink.moveTo(0,0);ink.lineTo(Math.cos(tick)*unit*.49,Math.sin(tick)*unit*.49);ink.moveTo(0,0);ink.lineTo(-unit*.25,-unit*.35);ink.stroke();ink.restore()
      // Six sweeping petals and long, imperfect spider-lily filaments.
      ink.save(); ink.translate(cx,cy); ink.scale(1,.68); ink.rotate(-.25+mouseX*.035)
      for(let i=0;i<6;i++){const a=i*Math.PI/3+tick*.08;ink.save();ink.rotate(a);ink.beginPath();ink.moveTo(0,0);ink.bezierCurveTo(unit*.18,-unit*.31,unit*.82,-unit*.45,unit*.79,-unit*.85);ink.bezierCurveTo(unit*1.04,-unit*.49,unit*.42,-unit*.06,0,0);ink.stroke();for(let j=0;j<3;j++){ink.beginPath();ink.moveTo(0,0);ink.bezierCurveTo(unit*.24,-unit*(.2+j*.08),unit*.9,-unit*(.2+j*.1),unit*(1.03+j*.06),-unit*(.6+j*.08));ink.stroke();ink.fillStyle='white';ink.fillRect(unit*(1.03+j*.06),-unit*(.6+j*.08),1.5,1.5)}ink.restore()}
      ink.beginPath();ink.moveTo(0,0);ink.bezierCurveTo(-unit*.1,unit*.5,unit*.2,unit*.8,unit*.15,unit*1.3);ink.stroke();ink.restore()
      // Katana / signal lines, as if scratched into a record sleeve.
      ink.lineWidth=.5;ink.beginPath();ink.moveTo(cx-unit*1.25,cy+unit*.65);ink.lineTo(cx+unit*1.45,cy-unit*.73);ink.moveTo(cx-unit*1.23,cy+unit*.68);ink.lineTo(cx+unit*1.47,cy-unit*.7);ink.stroke()
      const pixels=ink.getImageData(0,0,w,h).data, chars=' .,:;irsXA253hMHGS#9B&@';ctx.clearRect(0,0,width,height);ctx.font='11px monospace';ctx.textBaseline='top'
      for(let y=0;y<h;y++){for(let x=0;x<w;x++){const n=pixels[(y*w+x)*4+3]; const dust=Math.sin(x*117.2+y*53.7)*43758.5;const grain=dust-Math.floor(dust); if(n>12){ctx.fillStyle=variant==='wildcard'?'#f1eee4':variant==='afterhours'?'#c4d0d6':'#e5e0d5';ctx.fillText(chars[Math.min(chars.length-1,Math.floor(n/256*chars.length))],x*8,y*13)} else if(grain>.996){ctx.fillStyle=variant==='wildcard'?'#ed4b42':'#666960';ctx.fillText(grain>.999?'*':'.',x*8,y*13)}}}
      frame++; if(!reduced) raf=requestAnimationFrame(draw)
    }
    const pointer=(e:PointerEvent)=>{const r=canvas.getBoundingClientRect();mouseX=(e.clientX-r.left)/r.width-.5;mouseY=(e.clientY-r.top)/r.height-.5}
    const ro=new ResizeObserver(()=>{resize();if(reduced)draw()});ro.observe(canvas);canvas.addEventListener('pointermove',pointer);resize();draw()
    return ()=>{cancelAnimationFrame(raf);ro.disconnect();canvas.removeEventListener('pointermove',pointer)}
  }, [variant])
  return <canvas ref={ref} className="ascii-art" aria-label="Animated ASCII drawing of a spider lily, pocket watch and katana" role="img" />
}
