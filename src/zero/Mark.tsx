import { useId } from 'react'

/** A hand-drawn emblem, assembled from paths so every line can respond to the page. */
export function Mark() {
 const id=useId().replaceAll(':','')
 return <svg viewBox="0 0 720 780" role="img" aria-label="An illustrated spider lily entwined with a pocket watch, katana and butterflies">
  <defs>
   <linearGradient id={`${id}metal`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fbfbf3"/><stop offset=".17" stopColor="#777b78"/><stop offset=".33" stopColor="#f1f2ec"/><stop offset=".49" stopColor="#555b5a"/><stop offset=".67" stopColor="#d9dbd4"/><stop offset=".83" stopColor="#777b76"/><stop offset="1" stopColor="#f5f5ed"/></linearGradient>
   <pattern id={`${id}dots`} width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#d6d6cf"/></pattern>
   <filter id={`${id}rough`} x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".17" numOctaves="3" seed="9" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4"/></filter>
   <path id={`${id}petal`} d="M0 0C-14-42-29-101-18-152C-11-184 8-210 28-218C9-188 3-159 11-126C20-80 12-28 0 0Z"/>
  </defs>
  <g className="art-back" fill="none" stroke="#979b91" strokeWidth=".65" opacity=".55"><circle cx="360" cy="365" r="277"/><circle cx="360" cy="365" r="300"/><path d="M20 362H700M360 20V715M103 89L617 644M617 89L103 644"/><ellipse cx="360" cy="365" rx="340" ry="198" transform="rotate(-35 360 365)"/><ellipse cx="360" cy="365" rx="320" ry="155" transform="rotate(40 360 365)"/></g>
  <circle cx="360" cy="365" r="253" fill={`url(#${id}dots)`} opacity=".2"/>
  <g className="watch" transform="translate(365 355) rotate(-13)">
   <circle r="223" fill="#141513" stroke={`url(#${id}metal)`} strokeWidth="12"/><circle r="207" fill="none" stroke="#c5c6be" strokeWidth="1.2"/><circle r="196" fill="none" stroke="#777d75" strokeWidth="1"/><circle r="169" fill="none" stroke="#959991" strokeWidth=".8"/>
   {Array.from({length:60},(_,i)=><path key={i} d={`M0 -195V-${i%5===0?176:187}`} transform={`rotate(${i*6})`} stroke={i%5===0?'#f3f4ec':'#888d84'} strokeWidth={i%5===0?2:1}/>)}
   <g fill="#daddd4" fontSize="15" fontFamily="monospace" textAnchor="middle"><text y="-146">XII</text><text x="145" y="5">III</text><text y="155">VI</text><text x="-145" y="5">IX</text></g>
   <path d="M-20-224v-21h40v21M-12-245v-19h24v19" stroke="#c4c8be" strokeWidth="5" fill="none"/><circle cy="-277" r="17" stroke="#d1d4cb" strokeWidth="5" fill="none"/>
   <g stroke="#d5d8ce" fill="none" opacity=".65"><circle r="88"/><circle r="76"/><path d="M0-85V85M-85 0H85"/></g>
   <g className="watch-hand" stroke="#e9eae1" strokeLinecap="round"><path d="M0 12V-151" strokeWidth="3"/><path d="M-8 7L89 65" strokeWidth="5"/><circle r="9" fill="#e9eae1"/></g>
  </g>
  <g className="blade" transform="translate(365 365) rotate(40)"><path d="M-11-327L0-359 11-327 8 257 0 280-8 257Z" fill={`url(#${id}metal)`} stroke="#f4f5ec" strokeWidth="1"/><path d="M0-343V260M-6-270L-5 250" stroke="#353a38" opacity=".6"/><path d="M-31 220H31L35 231H-35Z" fill="#242622" stroke="#e3e5dc" strokeWidth="3"/><path d="M-10 232H10L8 325Q0 337-8 325Z" fill="#151613" stroke="#e6e7df" strokeWidth="2"/>{Array.from({length:8},(_,i)=><path key={i} d={`M-9 ${240+i*10}L9 ${250+i*10}M9 ${240+i*10}L-9 ${250+i*10}`} stroke="#9a9d94" strokeWidth="1"/>)}</g>
  <g className="lily" transform="translate(362 385) rotate(-8)" filter={`url(#${id}rough)`}>
   <path d="M3 2C-7 110 21 235 8 359M9 247C-35 213-81 218-114 214M9 309C50 269 100 269 125 258" fill="none" stroke="#d5d8cf" strokeWidth="3"/>
   {[-86,-52,-18,20,56,94].map((a,i)=><g key={a} transform={`rotate(${a})`}><use href={`#${id}petal`} fill={i%2?'#e5e7de':'#aaaea4'} stroke="#f2f3ea" strokeWidth="1"/><path d="M0-8C-5-65-23-122-7-223M-5-17C-10-55-29-110-24-145M5-27C11-68 11-110 3-145" fill="none" stroke="#4e534b" strokeWidth="1" opacity=".7"/><path d={`M0 0C${35+i*2} -94 ${74+i*3} -147 ${56+i*4} -290`} stroke="#e7e8de" strokeWidth="1.5" fill="none"/><ellipse cx={56+i*4} cy="-290" rx="7" ry="3" transform={`rotate(-26 ${56+i*4} -290)`} fill="#e8e9df"/></g>)}
   <circle r="13" fill="#151613" stroke="#e9ebe0" strokeWidth="2"/><circle r="4" fill="#e9ebe0"/>
  </g>
  <g className="butterfly butterfly-a" transform="translate(138 165) rotate(-22)" fill="none" stroke="#e1e4db"><path d="M0 0C-16-49-52-67-61-49C-67-34-50-9-13 3C-55-1-57 25-43 29C-29 34-13 20 0 4M0 0C16-49 52-67 61-49C67-34 50-9 13 3C55-1 57 25 43 29C29 34 13 20 0 4M0-12V20M-3-12l-9-10M3-12l9-10" strokeWidth="2"/><path d="M-14-7l-30-29M14-7l30-29M-14 8l-27 12M14 8l27 12" strokeWidth=".8"/></g>
  <g className="butterfly butterfly-b" transform="translate(576 566) rotate(25) scale(.65)" fill="none" stroke="#d9ddd3"><path d="M0 0C-16-49-52-67-61-49C-67-34-50-9-13 3C-55-1-57 25-43 29C-29 34-13 20 0 4M0 0C16-49 52-67 61-49C67-34 50-9 13 3C55-1 57 25 43 29C29 34 13 20 0 4M0-12V20M-3-12l-9-10M3-12l9-10" strokeWidth="2"/></g>
  <g fill="#ef4a42"><circle cx="85" cy="400" r="3"/><circle cx="624" cy="248" r="3"/><path d="M85 329l3 14 14 3-14 3-3 14-3-14-14-3 14-3zM614 440l3 17 17 3-17 3-3 17-3-17-17-3 17-3z"/></g>
 </svg>
}
