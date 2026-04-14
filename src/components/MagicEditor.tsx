import { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import { defineBlocks, calculateTotalMP } from '../blocks/magicBlocks';
import { toolbox } from '../blocks/toolbox';
import { Wand2 } from 'lucide-react';
import './MagicEditor.css'; // 【追加】エラー表示・スライダー補助スタイル

defineBlocks();

const MagicEditor = () => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspace = useRef<Blockly.WorkspaceSvg | null>(null);
  const [totalMP, setTotalMP] = useState(0);

  useEffect(() => {
    if (blocklyDiv.current && !workspace.current) {
      workspace.current = Blockly.inject(blocklyDiv.current, {
        toolbox: toolbox,
        grid: {
          spacing: 20,
          length: 3,
          colour: '#ccc',
          snap: true,
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2,
        },
        trashcan: true,
      });

setTimeout(() => {
  if (workspace.current) {
    Blockly.svgResize(workspace.current);
  }
}, 0);

      // 🔥 修正版リスナー
      workspace.current.addChangeListener((event: Blockly.Events.Abstract) => {
        if (
          event.type === Blockly.Events.BLOCK_CHANGE ||
          event.type === Blockly.Events.BLOCK_MOVE ||
          event.type === Blockly.Events.BLOCK_CREATE ||
          event.type === Blockly.Events.BLOCK_DELETE
        ) {
          const mp = calculateTotalMP(workspace.current!);
          setTotalMP(mp);
        }
      });
    }

    return () => {
      if (workspace.current) {
        workspace.current.dispose();
        workspace.current = null;
      }
    };
  }, []);


    useEffect(() => {
  const resize = () => {
    if (workspace.current) {
      Blockly.svgResize(workspace.current);
    }
  };

  window.addEventListener('resize', resize);
  resize();

  return () => {
    window.removeEventListener('resize', resize);
  };
}, []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/30 border-b border-purple-500/30 px-6 py-4 flex justify-between">
        <div className="flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">魔法作成エディタ</h1>
        </div>
        <div className="bg-purple-600 px-6 py-3 rounded-lg">
          <div className="text-sm text-white/80">合計MP</div>
          <div className="text-3xl text-white">{totalMP}</div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden" ref={blocklyDiv} />
    </div>
  );
};
export default MagicEditor;