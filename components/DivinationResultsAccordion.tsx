'use client';

import { useId, useState, type ReactNode } from 'react';
import {
  TAMAMO_SILHOUETTES,
  type AsteriaResult,
  type DaVinciResult,
  type DivinationMasterId,
  type IChingResult,
  type SeimeiResult,
  type SaintGermainResult,
  type SixDivinationResults,
  type TamamoResult,
} from '@/lib/potenoSixDivination';

type DivinationResultsAccordionProps = {
  results: SixDivinationResults;
  divinerArt: Record<DivinationMasterId, string>;
  asteriaDetail?: ReactNode;
  davinciDetail?: ReactNode;
};

type SummaryItem = {
  id: string;
  seal: string;
  title: string;
  subtitle: string;
  detail: ReactNode;
};

const orientationLabel = (orientation: 'upright' | 'reversed') => orientation === 'upright' ? '正位置' : '逆位置';

function seimeiSummary(result: SeimeiResult) {
  return result.calculationVersion === 'seimei-calendar-v1'
    ? `${result.calendar.label} / ${result.direction.trigram} / ${result.direction.conditionLabel}`
    : `${result.calendarMark} / ${result.direction}`;
}

function asteriaSummary(result: AsteriaResult) {
  return result.calculationVersion === 'asteria-lunar-solar-v1'
    ? `${result.moonPhase.label} / ${result.moonSign.label} / ${result.personalAspect.label} / ${result.solarCycle.label}`
    : `${result.sunSign} / ${result.starMarker}`;
}

function davinciSummary(result: DaVinciResult) {
  return result.calculationVersion === 'davinci-structure-v1'
    ? `CORE ${result.core.number} / STYLE ${result.style.number} / ${result.relation.label}`
    : `${result.lifePathNumber} / ${result.geometry}`;
}

function isTaikoboV1(result: IChingResult): result is Extract<IChingResult, { calculationVersion: 'taikobo-iching-v1' }> {
  return 'calculationVersion' in result && result.calculationVersion === 'taikobo-iching-v1';
}

function taikoboSummary(result: IChingResult) {
  if (!isTaikoboV1(result)) return `${result.baseHexagram} → ${result.resultingHexagram}`;
  const position = result.movingLines.length ? ` / ${result.movingLines.map((line) => `${line.position}爻`).join('・')}` : '';
  return `${result.baseHexagram.fullName} → ${result.resultingHexagram.fullName} / ${result.changeState.label}${position}`;
}

function isTamamoV1(result: TamamoResult): result is Extract<TamamoResult, { calculationVersion: 'tamamo-crossroads-v1' }> {
  return 'calculationVersion' in result && result.calculationVersion === 'tamamo-crossroads-v1';
}

function tamamoSummary(result: TamamoResult) {
  if (isTamamoV1(result)) return `「${result.kotodama.word}」 / ${result.kotodama.themeLabel}`;
  const silhouette = TAMAMO_SILHOUETTES.find((item) => item.id === result.silhouetteId);
  return `${silhouette?.label ?? result.silhouetteId} 「${result.phrase}」`;
}

function isSaintGermainV1(result: SaintGermainResult): result is Extract<SaintGermainResult, { calculationVersion: 'saint-germain-three-card-v1' }> {
  return 'calculationVersion' in result && result.calculationVersion === 'saint-germain-three-card-v1';
}

function SeimeiDetail({ result }: { result: SeimeiResult }) {
  if (result.calculationVersion !== 'seimei-calendar-v1') {
    return <dl className="divination-detail-list"><div><dt>暦</dt><dd>{result.calendarMark}</dd></div><div><dt>方位</dt><dd>{result.direction}</dd></div></dl>;
  }
  return <div className="divination-detail-copy">
    <dl className="divination-detail-list">
      <div><dt>出生干支</dt><dd>{result.birthKanshi.label}</dd></div>
      <div><dt>対象日干支</dt><dd>{result.targetKanshi.label}</dd></div>
      <div><dt>暦</dt><dd>{result.calendar.label}</dd></div>
      <div><dt>方位</dt><dd>{result.direction.trigram}・{result.direction.label}</dd></div>
      <div><dt>関係</dt><dd>{result.direction.conditionLabel}</dd></div>
    </dl>
    <p>「{result.fixedReading}」</p>
  </div>;
}

function TaikoboDetail({ results }: Pick<DivinationResultsAccordionProps, 'results'>) {
  const { taikobo } = results;
  if (!isTaikoboV1(taikobo)) return <dl className="divination-detail-list"><div><dt>本卦</dt><dd>{taikobo.baseHexagram}</dd></div><div><dt>動爻</dt><dd>{taikobo.movingLines.length ? taikobo.movingLines.join('・') : 'なし'}</dd></div><div><dt>之卦</dt><dd>{taikobo.resultingHexagram}</dd></div></dl>;
  return <div className="divination-detail-copy"><dl className="divination-detail-list">
    <div><dt>現在の盤面</dt><dd>{taikobo.baseHexagram.fullName}「{taikobo.baseHexagram.theme}」</dd></div>
    <div><dt>変化</dt><dd>{taikobo.changeState.label}</dd></div>
    <div><dt>動爻</dt><dd>{taikobo.movingLines.length ? taikobo.movingLines.map((line) => `${line.position}爻 ${line.directionLabel}「${line.positionLabel}」`).join('・') : 'なし'}</dd></div>
    <div><dt>移行先</dt><dd>{taikobo.resultingHexagram.fullName}「{taikobo.resultingHexagram.theme}」</dd></div>
    {taikobo.stableAnchor && <div><dt>残る軸</dt><dd>{taikobo.stableAnchor.position}爻「{taikobo.stableAnchor.label}」</dd></div>}
  </dl><p>「{taikobo.characterReading}」</p></div>;
}

function TamamoDetail({ results }: Pick<DivinationResultsAccordionProps, 'results'>) {
  const { tamamo } = results;
  if (isTamamoV1(tamamo)) return <div className="divination-detail-copy"><dl className="divination-detail-list"><div><dt>選んだ影</dt><dd>{tamamo.passer.label}</dd></div><div><dt>通りすがりの声</dt><dd>「{tamamo.overheardVoice.text}」</dd></div><div><dt>拾った言霊</dt><dd>「{tamamo.kotodama.word}」</dd></div></dl><p>玉藻の前「{tamamo.characterReading}」</p></div>;
  const silhouette = TAMAMO_SILHOUETTES.find((item) => item.id === tamamo.silhouetteId);
  return <div className="divination-detail-copy"><dl className="divination-detail-list"><div><dt>拾った気配</dt><dd>{silhouette?.label ?? tamamo.silhouetteId}</dd></div></dl><p>「{tamamo.phrase}」</p></div>;
}

function SaintGermainDetail({ results }: Pick<DivinationResultsAccordionProps, 'results'>) {
  const { saintGermain } = results;
  if (!isSaintGermainV1(saintGermain)) return <dl className="divination-detail-list">{saintGermain.cards.map((card) => <div key={`${card.role}-${card.id}`}><dt>{card.role}</dt><dd>{card.name} {orientationLabel(card.orientation)}</dd></div>)}</dl>;
  return <div className="divination-detail-copy"><dl className="divination-detail-list">{saintGermain.cards.map((card) => <div key={`${card.role}-${card.id}`}><dt>{card.role}</dt><dd>{card.name} {orientationLabel(card.orientation)}<br />{card.orientationMeaning}</dd></div>)}</dl><p>伯爵「{saintGermain.characterReading}」</p></div>;
}

function DivinerDetailFrame({ diviner, title, subtitle, portrait, tone, children }: { diviner: string; title: string; subtitle: string; portrait: string; tone: 'seimei' | 'taikobo' | 'tamamo' | 'saint-germain'; children: ReactNode }) {
  return <section className={`diviner-result-detail is-${tone}`} aria-label={`${diviner}の結果詳細`}>
    <header><span className="diviner-result-portrait"><img src={portrait} alt="" /></span><div><small>{diviner}</small><h3>{title}</h3><p>{subtitle}</p></div></header>
    {children}
  </section>;
}

function AccordionItem({ item }: { item: SummaryItem }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  return <article className={`divination-summary-row${open ? ' is-open' : ''}`}>
    <button className="divination-summary-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={detailId}>
      <span className="divination-summary-seal" aria-hidden="true">{item.seal}</span>
      <span className="divination-summary-heading"><b>{item.title}</b><small>{item.subtitle}</small></span>
      <span className="divination-summary-toggle">{open ? '詳細を閉じる' : '詳細を見る'}</span>
    </button>
    {open && <div className="divination-summary-detail" id={detailId}>{item.detail}</div>}
  </article>;
}

export function DivinationResultsAccordion({ results, divinerArt, asteriaDetail, davinciDetail }: DivinationResultsAccordionProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const items: SummaryItem[] = [
    { id: 'seimei', seal: '暦', title: '安倍晴明', subtitle: seimeiSummary(results.seimei), detail: <DivinerDetailFrame tone="seimei" diviner="安倍晴明・暦方位" title="暦と方位の兆し" subtitle={seimeiSummary(results.seimei)} portrait={divinerArt.seimei}><SeimeiDetail result={results.seimei} /></DivinerDetailFrame> },
    { id: 'taikobo', seal: '卦', title: '太公望', subtitle: taikoboSummary(results.taikobo), detail: <DivinerDetailFrame tone="taikobo" diviner="太公望・易占" title="卦の変わり目" subtitle={taikoboSummary(results.taikobo)} portrait={divinerArt.taikobo}><TaikoboDetail results={results} /></DivinerDetailFrame> },
    { id: 'tamamo', seal: '縁', title: '玉藻の前', subtitle: tamamoSummary(results.tamamo), detail: <DivinerDetailFrame tone="tamamo" diviner="玉藻の前・辻占" title="辻で拾った言葉" subtitle={tamamoSummary(results.tamamo)} portrait={divinerArt.tamamo}><TamamoDetail results={results} /></DivinerDetailFrame> },
    { id: 'saint-germain', seal: '札', title: 'サンジェルマン伯爵', subtitle: results.saintGermain.cards.map((card) => card.name).join(' / '), detail: <DivinerDetailFrame tone="saint-germain" diviner="サンジェルマン伯爵・タロット" title="選ばれた三枚" subtitle="表層・深層・鍵" portrait={divinerArt['saint-germain']}><SaintGermainDetail results={results} /></DivinerDetailFrame> },
    { id: 'asteria', seal: '星', title: 'アステリア', subtitle: asteriaSummary(results.asteria), detail: asteriaDetail ?? <p className="divination-detail-fallback">この記録には詳細な星の結果がありません。</p> },
    { id: 'davinci', seal: '数', title: 'ダ・ヴィンチ', subtitle: davinciSummary(results.davinci), detail: davinciDetail ?? <p className="divination-detail-fallback">この記録には詳細な数の設計図がありません。</p> },
  ];

  return <section className="six-results-accordion" aria-label="六占の計算結果">
    <button className="six-results-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={contentId}>
      <span aria-hidden="true">{open ? '▼' : '▶'}</span> 六占の計算結果を見る
    </button>
    {open && <div className="divination-summary-list" id={contentId}>{items.map((item) => <AccordionItem key={item.id} item={item} />)}</div>}
  </section>;
}
