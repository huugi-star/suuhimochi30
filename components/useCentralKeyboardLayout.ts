'use client';
import { useLayoutEffect, useState, type RefObject } from 'react';

export function useCentralKeyboardLayout(active:boolean, centered:boolean|undefined, room:RefObject<HTMLDivElement|null>, world:RefObject<HTMLDivElement|null>, worldWidth:number) {
  const [layout,setLayout]=useState<{x:number;y:number;left:number;top:number;width:number}|null>(null);
  useLayoutEffect(()=>{
    if(!active){const timer=setTimeout(()=>setLayout(null),260);return()=>clearTimeout(timer);}
    let frame=0, eligible=centered;
    const measure=()=>{
      cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
        const character=world.current?.querySelector<HTMLElement>('.mochi');
        const keyboard=document.querySelector<HTMLElement>('.suuhimochi-keyboard:not(.is-combo-contained)');
        const panel=document.querySelector<HTMLElement>('.face-talk-text-input .face-talk-left, .initial-dialogue-box');
        const bounds=room.current?.getBoundingClientRect(), worldBounds=world.current?.getBoundingClientRect();
        if(!character||!keyboard||!panel||!bounds||!worldBounds)return;
        const viewport=window.visualViewport, left=Math.max(bounds.left,viewport?.offsetLeft??0), right=Math.min(bounds.right,(viewport?.offsetLeft??0)+(viewport?.width??innerWidth));
        const top=Math.max(bounds.top,viewport?.offsetTop??0), bottom=Math.min(bounds.bottom,(viewport?.offsetTop??0)+(viewport?.height??innerHeight));
        const c=character.getBoundingClientRect(), k=keyboard.getBoundingClientRect(), scale=worldBounds.width/worldWidth;
        if(!scale)return;
        // Remove our in-flight offset before measuring the original position.
        // All offsets are presentation-only; walking coordinates stay intact.
        const translation=getComputedStyle(character).translate.split(' ').map(n=>parseFloat(n)||0);
        const baseX=c.left+c.width/2-(translation[0]??0)*scale,baseY=c.top+c.height/2-(translation[1]??0)*scale;
        eligible??=Math.abs(baseX-(left+right)/2)<=Math.max(c.width*.65,(right-left)*.1);
        if(!eligible){setLayout(null);return;}
        // Keep the keyboard's existing side and use only its actual free area.
        const keyboardOnRight=k.left+k.width/2>(left+right)/2;
        const freeLeft=keyboardOnRight?left+12:k.right+12,freeRight=keyboardOnRight?k.left-12:right-12;
        if(freeRight-freeLeft<100)return;
        const panelParent=panel.offsetParent?.getBoundingClientRect()??bounds;
        const panelTop=top+36, panelHeight=Math.min(panel.getBoundingClientRect().height,(bottom-top)*.32,130);
        const minY=panelTop+panelHeight+10+c.height/2,maxY=bottom-52-c.height/2;
        const targetY=minY<=maxY?Math.max(minY,Math.min(maxY,baseY)):(panelTop+panelHeight+bottom-52)/2;
        const next={x:((freeLeft+freeRight)/2-baseX)/scale,y:(targetY-baseY)/scale,left:freeLeft-panelParent.left,top:panelTop-panelParent.top,width:freeRight-freeLeft};
        setLayout(old=>old&&Object.keys(next).every(key=>Math.abs(next[key as keyof typeof next]-old[key as keyof typeof next])<.5)?old:next);
      });
    };
    measure();const observer=new ResizeObserver(measure);
    const keyboard=document.querySelector('.suuhimochi-keyboard:not(.is-combo-contained)'),panel=document.querySelector('.face-talk-text-input .face-talk-left, .initial-dialogue-box');
    if(keyboard)observer.observe(keyboard);if(panel)observer.observe(panel);
    window.addEventListener('resize',measure);window.visualViewport?.addEventListener('resize',measure);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',measure);window.visualViewport?.removeEventListener('resize',measure);};
  },[active,centered,room,world,worldWidth]);
  return layout;
}
