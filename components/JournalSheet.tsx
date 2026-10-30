'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import styles from './JournalSheet.module.css';

export function JournalSheet({ title, children, onClose, fitVisualViewport = false }: { title: string; children: ReactNode; onClose: () => void; fitVisualViewport?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog?.open) dialog?.showModal();
    return () => { dialog?.close(); };
  }, []);
  useEffect(()=>{
    if(!fitVisualViewport)return;
    const dialog=ref.current,viewport=window.visualViewport;if(!dialog)return;
    const previousStyle=dialog.getAttribute('style');
    let frame=0;
    const fit=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
      const height=viewport?.height??window.innerHeight,top=viewport?.offsetTop??0;
      Object.assign(dialog.style,{position:'fixed',maxHeight:`${Math.max(48,height-16)}px`,top:`${top+8}px`,bottom:'auto',left:'0',right:'0',margin:'0 auto'});
      const active=document.activeElement;if(active instanceof HTMLElement&&dialog.contains(active))active.scrollIntoView({block:'nearest'});
    })};fit();viewport?.addEventListener('resize',fit);viewport?.addEventListener('scroll',fit);window.addEventListener('resize',fit);
    return()=>{cancelAnimationFrame(frame);viewport?.removeEventListener('resize',fit);viewport?.removeEventListener('scroll',fit);window.removeEventListener('resize',fit);if(previousStyle===null)dialog.removeAttribute('style');else dialog.setAttribute('style',previousStyle)};
  },[fitVisualViewport]);
  return <dialog ref={ref} className={styles.sheet} aria-label={title} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label={`${title}を閉じる`}><X size={20} /></button></header>
    <div className={styles.body}>{children}</div>
  </dialog>;
}
