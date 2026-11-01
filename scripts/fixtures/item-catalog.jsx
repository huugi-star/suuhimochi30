import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ItemCatalog } from '../../components/ItemCatalog';
import { MissionPostPreview } from '../../components/DailyMissionBoard';
const furniture = [
  ['bookshelf', '本棚', 'wooden-bookshelf-with-plant-and-mushroom.png'],
  ['vase', '青い花瓶', 'blue-ceramic-vase.png'],
  ['plant', '鉢植え', 'potted-plant.png'],
  ['cushion', '花形クッション', 'flower-cushion.png'],
  ['low-table', '丸いローテーブル', 'round-wooden-low-table.png'],
  ['floor-lamp', 'フロアランプ', 'wooden-floor-lamp.png'],
];
function App() {
  const [tab, setTab] = useState('placed'),
    [selected, select] = useState(null),
    [closed, close] = useState(false),
    [moved, move] = useState(false),
    [moving, setMoving] = useState(false),
    [stored, store] = useState(Array.from({ length: 18 }, (_, i) => 'f' + i));
  const items = [
    {
      id: 'post',
      name: 'ミッションポスト',
      fixed: true,
      stored: false,
      preview: <MissionPostPreview catalog />,
    },
    ...Array.from({ length: 18 }, (_, i) => ({
      id: 'f' + i,
      name: furniture[i % 6][1],
      stored: stored.includes('f' + i),
      preview: (
        <img
          src={'/assets/items/' + furniture[i % 6][2]}
          alt=""
          draggable={false}
        />
      ),
    })),
  ];
  return (
    <div className="game-shell" style={{ height: '100dvh' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100dvh',
          background: '#c39b6a',
        }}
      >
        {!closed && !moving && (
          <ItemCatalog
            items={items}
            tab={tab}
            selected={selected}
            left={3}
            onTab={setTab}
            onSelect={select}
            onPlace={(id) => {
              store((s) => s.filter((x) => x !== id));
              select(id);
              setTab('placed');
              setMoving(true);
            }}
            onStore={(id) => {
              store((s) => [...s, id]);
              select(null);
            }}
            onClose={() => close(true)}
            onMoveInRoom={() => move(true)}
          />
        )}
        {!closed && moving && (
          <div className="item-mini-toolbar">
            <span>配置位置を調整中</span>
            <button type="button" onClick={() => close(true)}>
              配置を終える
            </button>
          </div>
        )}
        <output hidden id="result">
          {JSON.stringify({ stored, selected, moved, closed })}
        </output>
      </div>
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App />);
