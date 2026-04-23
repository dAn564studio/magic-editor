//このファイルの名前はmagicBlocks.ts

import type { FieldConfig } from 'blockly/core';
import * as Blockly from 'blockly';

let blocksDefined = false;

const TYPE_MULTIPLIER: Record<string, number> = {
  CONTROL: 1.0,
  TRANSFORM: 1.5,
  CONVERT: 2.0,
  SUMMON: 3.0,
};

export interface MagicModifierPayload {
  effectType: string;
  multiplier: number;
  chargeTime: number;
  cooldown: number;
  behavior: 'AUTO' | 'MAINTAIN';
  hasMaintainCost: boolean;
  maintainCostSec: number;
  mpStartPct: number;
  mpEndPct: number;
  mpChargePct: number;
  rangeOrigin: string;
  rangeRadius: number;
  rangeCondition: string;
  transShape: string;
  transQuantity: number;
  transHardness: number;
  transWeight: number;
  transWidth: number;
  transLength: number;
  summonFrom: string;
  summonMethod: string;
  summonDistance: number;
  summonDirectionRef: string;
  summonAngleV: number;
  summonAngleH: number;
  resummonMp: number;
  /** ツールボックス内で「詳細版（開始ブロック接続済み）」として描画するためのフラグ。保存対象外。 */
  isDetailed?: boolean;
}

const defaultModifierPayload = (): MagicModifierPayload => ({
  effectType: 'CONTROL',
  multiplier: 0.1,
  chargeTime: 0.1,
  cooldown: 1.0,
  behavior: 'AUTO',
  hasMaintainCost: false,
  maintainCostSec: 0.1,
  mpStartPct: 34,
  mpEndPct: 33,
  mpChargePct: 33,
  rangeOrigin: 'SELF',
  rangeRadius: 5,
  rangeCondition: 'INSIDE',
  transShape: 'NEEDLE',
  transQuantity: 1,
  transHardness: 0,
  transWeight: 0,
  transWidth: 1,
  transLength: 1,
  summonFrom: 'SELF',
  summonMethod: 'LOOK',
  summonDistance: 1,
  summonDirectionRef: 'AHEAD',
  summonAngleV: 0,
  summonAngleH: 0,
  resummonMp: 0,
});

// =============================================================
// FieldSlider（変更なし）
// =============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _FieldBase = Blockly.Field as unknown as new (...a: any[]) => Blockly.Field;

export class FieldSlider extends _FieldBase {
  static readonly TRACK_W = 80;
  static readonly TRACK_H = 8;
  static readonly THUMB_R = 8;
  static readonly FIELD_H = 24;
  static readonly NUM_W   = 28;

  SERIALIZABLE = true;

  private readonly minVal: number;
  private readonly maxVal: number;
  private trackBg  : SVGRectElement   | null = null;
  private trackFill: SVGRectElement   | null = null;
  private thumb    : SVGCircleElement | null = null;
  private numLabel : SVGTextElement   | null = null;

  constructor(value: number, minVal = 0, maxVal = 100) {
    super(String(Math.round(value)));
    this.minVal = minVal;
    this.maxVal = maxVal;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).value_ = String(Math.max(minVal, Math.min(maxVal, Math.round(value))));
  }

  static fromJson(options: FieldConfig): FieldSlider {
    const opt = options as { value?: number; min?: number; max?: number };
    return new FieldSlider(opt.value ?? 0, opt.min ?? 0, opt.max ?? 100);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doClassValidation_(newValue: any): string | null {
    const n = Number(newValue);
    if (!Number.isFinite(n)) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const min = (this as any).minVal ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const max = (this as any).maxVal ?? 100;
    return String(Math.max(min, Math.min(max, Math.round(n))));
  }

  getNumericValue(): number {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Number((this as any).getValue() ?? '0');
  }

  protected showEditor_(): void { /* no-op */ }

  protected initView(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fg = (this as any).fieldGroup_ as SVGGElement | null;
    if (!fg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const halfH  = FieldSlider.FIELD_H / 2;
    const trackY = halfH - FieldSlider.TRACK_H / 2;
    const mkEl = <T extends SVGElement>(tag: string, attrs: Record<string, string | number>, parent: SVGElement): T => {
      const el = document.createElementNS(NS, tag) as T;
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
      parent.appendChild(el);
      return el;
    };
    this.trackBg   = mkEl<SVGRectElement>('rect', { x: FieldSlider.THUMB_R, y: trackY, width: FieldSlider.TRACK_W, height: FieldSlider.TRACK_H, rx: FieldSlider.TRACK_H / 2, fill: '#cccccc' }, fg);
    this.trackFill = mkEl<SVGRectElement>('rect', { x: FieldSlider.THUMB_R, y: trackY, width: 0, height: FieldSlider.TRACK_H, rx: FieldSlider.TRACK_H / 2, fill: '#7c3aed' }, fg);
    this.thumb     = mkEl<SVGCircleElement>('circle', { cx: FieldSlider.THUMB_R, cy: halfH, r: FieldSlider.THUMB_R, fill: '#5b21b6', stroke: 'white', 'stroke-width': 2 }, fg);
    this.numLabel  = mkEl<SVGTextElement>('text', { x: FieldSlider.THUMB_R * 2 + FieldSlider.TRACK_W + 6, y: halfH, 'dominant-baseline': 'central', 'text-anchor': 'start', 'font-size': '12', 'font-family': 'sans-serif', fill: '#000000' }, fg);
    fg.style.cursor = 'ew-resize';
    this.renderSlider_();
    this.bindDragEvents_();
  }

  private renderSlider_(): void {
    const val = this.getNumericValue();
    const pct = (this.maxVal - this.minVal) > 0 ? (val - this.minVal) / (this.maxVal - this.minVal) : 0;
    this.thumb    ?.setAttribute('cx', String(FieldSlider.THUMB_R + pct * FieldSlider.TRACK_W));
    this.trackFill?.setAttribute('width', String(Math.max(0, pct * FieldSlider.TRACK_W)));
    if (this.numLabel) this.numLabel.textContent = String(val);
  }

  private bindDragEvents_(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fg = (this as any).fieldGroup_ as SVGGElement | null;
    if (!fg) return;
    fg.addEventListener('pointerdown', (e: PointerEvent) => {
      e.stopImmediatePropagation(); e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const block = (this as any).getSourceBlock() as Blockly.Block | null;
      if (!block) return;
      if ((block.workspace as Blockly.WorkspaceSvg)?.isFlyout) return;
      try { fg.setPointerCapture(e.pointerId); } catch { /**/ }
      Blockly.Events.setGroup(true);
      const getVal = (cx: number): string => {
        const rect = this.trackBg?.getBoundingClientRect();
        if (!rect || rect.width === 0) return String(this.getNumericValue());
        return String(Math.round(this.minVal + Math.max(0, Math.min(1, (cx - rect.left) / rect.width)) * (this.maxVal - this.minVal)));
      };
      const doUpdate = (cx: number) => {
        const nv = getVal(cx);
        if (nv === String(this.getNumericValue())) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any).setValue(nv);
        this.renderSlider_();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = block as any;
        if (typeof m.updateMpPctWarning_ === 'function' && !m.layoutBusy_) m.updateMpPctWarning_();
      };
      doUpdate(e.clientX);
      const onMove = (e2: PointerEvent) => { if (e2.pointerId === e.pointerId) doUpdate(e2.clientX); };
      const onUp   = (e2: PointerEvent) => {
        if (e2.pointerId !== e.pointerId) return;
        try { fg.releasePointerCapture(e2.pointerId); } catch { /**/ }
        fg.removeEventListener('pointermove',   onMove);
        fg.removeEventListener('pointerup',     onUp);
        fg.removeEventListener('pointercancel', onUp);
        Blockly.Events.setGroup(false);
      };
      fg.addEventListener('pointermove',   onMove);
      fg.addEventListener('pointerup',     onUp);
      fg.addEventListener('pointercancel', onUp);
    });
  }

  protected render_(): void { this.renderSlider_(); this.updateSize_(); }
  protected updateSize_(): void {
    const w = FieldSlider.THUMB_R * 2 + FieldSlider.TRACK_W + 6 + FieldSlider.NUM_W;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).size_.width  = w;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).size_.height = FieldSlider.FIELD_H;
  }

  applyErrorStyle(isError: boolean): void {
    this.trackBg  ?.setAttribute('fill', isError ? '#ffaaaa' : '#cccccc');
    this.trackFill?.setAttribute('fill', isError ? '#ff5555' : '#7c3aed');
    this.thumb    ?.setAttribute('fill', isError ? '#cc0000' : '#5b21b6');
    if (this.numLabel) this.numLabel.setAttribute('fill', isError ? '#cc0000' : '#000000');
  }

  applyColour(): void { /* no-op */ }
}

Blockly.fieldRegistry.register('field_slider', FieldSlider);

// =============================================================
// 共有定数
// =============================================================

const DIRECTION_OPTIONS: [string, string][] = [
  ['視線誘導','LOOK'],['直進','STRAIGHT'],['自動追尾','TRACK'],['全方位','OMNI'],
];
const TRANSFORM_DIR_OPTIONS: [string, string][] = [
  ['視線誘導','LOOK'],['直線','STRAIGHT'],['自動追尾','TRACK'],['全方位','OMNI'],
];
const CONVERT_ORDER_OPTIONS: [string, string][] = [
  ['視界内','VISIBLE'],['自動追尾','TRACK'],['全方位','OMNI'],
];
const SHAPE_OPTIONS: [string, string][] = [
  ['針','NEEDLE'],['手','HAND'],['刃','BLADE'],['壁','WALL'],
  ['網','NET'],['人','PERSON'],['ヒレ','FIN'],['鱗','SCALE'],
  ['ロープ','ROPE'],['羽','WING'],['バネ','SPRING'],['大砲','CANNON'],['鎖','CHAIN'],
];
const DIR_REF_OPTIONS: [string, string][] = [
  ['先','AHEAD'],['後ろ','BEHIND'],['右','RIGHT'],['左','LEFT'],['上','UP'],['下','DOWN'],
];
const SUMMON_ENTITY_OPTIONS: [string, string][] = [
  ['召喚物１','SUMMON_1'],['召喚物２','SUMMON_2'],['召喚物３','SUMMON_3'],
  ['召喚物４','SUMMON_4'],['召喚物５','SUMMON_5'],['召喚物６','SUMMON_6'],
  ['召喚物７','SUMMON_7'],['召喚物８','SUMMON_8'],
];

// =============================================================
// 共有ヘルパー関数群
// =============================================================

function appendTransformFields(block: Blockly.Block): void {
  block.appendDummyInput('EFF_SPEED').appendField('変形速度').appendField(new Blockly.FieldNumber(1,0),'SPEED').appendField('km/h');
  block.appendDummyInput('EFF_TRANS_DIR').appendField('変形方向').appendField(new Blockly.FieldDropdown(TRANSFORM_DIR_OPTIONS),'TRANS_DIR');
  block.appendDummyInput('EFF_SHAPE').appendField('形').appendField(new Blockly.FieldDropdown(SHAPE_OPTIONS),'SHAPE');
  block.appendDummyInput('EFF_QUANTITY').appendField('変形生成個数').appendField(new Blockly.FieldNumber(1,1),'QUANTITY').appendField('個');
  block.appendDummyInput('EFF_HARDNESS').appendField('硬度').appendField(new Blockly.FieldNumber(0),'HARDNESS');
  block.appendDummyInput('EFF_WEIGHT').appendField('重さ').appendField(new Blockly.FieldNumber(0,undefined,undefined,1),'WEIGHT').appendField('kg');
  block.appendDummyInput('EFF_WIDTH').appendField('横幅 ×').appendField(new Blockly.FieldNumber(1,0,undefined,0.1),'WIDTH').appendField('倍');
  block.appendDummyInput('EFF_LENGTH').appendField('長さ ×').appendField(new Blockly.FieldNumber(1,0,undefined,0.1),'LENGTH').appendField('倍');
}

function appendSummonMethodSpecificFields(block: Blockly.Block, method: string, distance = 1, angleV = 0, angleH = 0): void {
  if (method === 'AXIS') {
    block.appendDummyInput('EFF_SUMMON_AXIS')
      .appendField('縦軸').appendField(new Blockly.FieldNumber(angleV,-180,180,1),'ANGLE_V')
      .appendField('°  横軸').appendField(new Blockly.FieldNumber(angleH,-180,180,1),'ANGLE_H')
      .appendField('° の').appendField(new Blockly.FieldNumber(distance,0),'DISTANCE')
      .appendField('m').appendField(new Blockly.FieldDropdown(DIR_REF_OPTIONS),'DIRECTION_REF');
  } else {
    block.appendDummyInput('EFF_SUMMON_LOOK')
      .appendField(new Blockly.FieldNumber(distance,0),'DISTANCE')
      .appendField('m').appendField(new Blockly.FieldDropdown(DIR_REF_OPTIONS),'DIRECTION_REF');
  }
}

function appendSummonFields(block: Blockly.Block, method = 'LOOK', distance = 1, angleV = 0, angleH = 0): void {
  block.appendStatementInput('ENTITY').setCheck('TARGET').appendField('選択');
  block.appendDummyInput('EFF_SPEED').appendField('召喚速度').appendField(new Blockly.FieldNumber(1,0),'SPEED').appendField('km/h');
  block.appendDummyInput('EFF_SUMMON_FROM').appendField('起点').appendField(new Blockly.FieldDropdown([['自身','SELF'],['敵','ENEMY'],['召喚物','SUMMON']]),'SUMMON_FROM').appendField('から');
  block.appendDummyInput('EFF_SUMMON_METHOD').appendField('方式').appendField(new Blockly.FieldDropdown([['視線誘導','LOOK'],['縦横軸設定','AXIS']]),'SUMMON_METHOD').appendField('で');
  appendSummonMethodSpecificFields(block, method, distance, angleV, angleH);
  block.appendDummyInput('EFF_RESUMMON_MP').appendField('再召喚時消費').appendField(new Blockly.FieldNumber(0,0),'RESUMMON_MP').appendField('MP');
}

function rebuildSummonMethodInputs(block: Blockly.Block, method: string): void {
  const sd = block.getField('DISTANCE')      ? Number(block.getFieldValue('DISTANCE'))    : 1;
  const av = block.getField('ANGLE_V')       ? Number(block.getFieldValue('ANGLE_V'))     : 0;
  const ah = block.getField('ANGLE_H')       ? Number(block.getFieldValue('ANGLE_H'))     : 0;
  const dr = block.getField('DIRECTION_REF') ? block.getFieldValue('DIRECTION_REF')       : 'AHEAD';
  const rm = block.getField('RESUMMON_MP')   ? Number(block.getFieldValue('RESUMMON_MP')) : 0;
  if (block.getInput('EFF_SUMMON_LOOK')) block.removeInput('EFF_SUMMON_LOOK');
  if (block.getInput('EFF_SUMMON_AXIS')) block.removeInput('EFF_SUMMON_AXIS');
  if (block.getInput('EFF_RESUMMON_MP')) block.removeInput('EFF_RESUMMON_MP');
  appendSummonMethodSpecificFields(block, method, sd, av, ah);
  block.appendDummyInput('EFF_RESUMMON_MP').appendField('再召喚時消費').appendField(new Blockly.FieldNumber(rm,0),'RESUMMON_MP').appendField('MP');
  if (block.getField('DIRECTION_REF')) block.setFieldValue(dr,        'DIRECTION_REF');
  if (block.getField('RESUMMON_MP'))   block.setFieldValue(String(rm), 'RESUMMON_MP');
}

function getConnectedInputName(block: Blockly.Block): string {
  const parent = block.getParent();
  if (!parent) return 'TARGET';
  for (const inp of parent.inputList) {
    if (inp.connection && inp.connection.targetBlock() === block) return inp.name;
  }
  return 'TARGET';
}

function rebuildTargetExtras(block: Blockly.Block, initialPlaceNum?: number): void {
  const saved = block.getField('PLACE_NUM') ? Number(block.getFieldValue('PLACE_NUM')) : (initialPlaceNum ?? undefined);
  if (block.getInput('PLACE_EXTRA'))   block.removeInput('PLACE_EXTRA');
  if (block.getInput('DETAIL_TARGET')) block.removeInput('DETAIL_TARGET');
  const subject = block.getFieldValue('SUBJECT') || 'SELF';
  const place   = block.getFieldValue('PLACE')   || 'SELF';
  if (place === 'RANGE_IN' || place === 'RANGE_OUT') {
    block.appendDummyInput('PLACE_EXTRA').appendField('半径').appendField(new Blockly.FieldNumber(saved ?? 5,0),'PLACE_NUM').appendField(place === 'RANGE_IN' ? 'm 以内' : 'm の外');
  } else if (place === 'TIME_IN' || place === 'TIME_AFTER') {
    block.appendDummyInput('PLACE_EXTRA').appendField(new Blockly.FieldNumber(saved ?? 1,0),'PLACE_NUM').appendField(place === 'TIME_IN' ? '秒以内' : '秒後');
  }
  if (subject === 'DETAIL') block.appendStatementInput('DETAIL_TARGET').setCheck('TARGET').appendField('詳細対象');
}

// =============================================================
// ModifierBlock ユーティリティ
// =============================================================

type ModifierBlock = Blockly.Block & {
  modifierPayload_      : MagicModifierPayload;
  layoutBusy_           : boolean;
  updateLayout_         : (forceRebuild?: boolean) => void;
  updateMpPctWarning_   : () => void;
  syncFromVisibleFields_: () => void;
  applyPayloadToFields_ : () => void;
};

function asModifierBlock(b: Blockly.Block): ModifierBlock { return b as ModifierBlock; }

function magicFieldNumber(value: number, min: number, max: number | undefined, precision: number): Blockly.FieldNumber {
  return new Blockly.FieldNumber(value, min, max ?? undefined, precision, undefined, { min, max, precision });
}

function modifierHostConnectionChanged(move: Blockly.Events.BlockMove): boolean {
  return move.oldParentId !== move.newParentId || move.oldInputName !== move.newInputName;
}

const MODIFIER_LAYOUT_INPUTS: Record<string, readonly string[]> = {
  'start:AUTO'         : ['S1','S2','S3','S4','S_MP0','S_MP1','S_MP2','S_MP3'],
  'start:MAINTAIN:0'   : ['S1','S2','S3','S4','S5','S_MP0','S_MP1','S_MP2','S_MP3'],
  'start:MAINTAIN:1'   : ['S1','S2','S3','S4','S5','S6','S_MP0','S_MP1','S_MP2','S_MP3'],
  'effect:CONTROL'     : ['E1','TARGET','EFF_SPEED','EFF_DIR','EFF_RANGE','E2'],
  'effect:TRANSFORM'   : ['E1','TARGET','EFF_SPEED','EFF_TRANS_DIR','EFF_SHAPE','EFF_QUANTITY','EFF_HARDNESS','EFF_WEIGHT','EFF_WIDTH','EFF_LENGTH','E2'],
  'effect:CONVERT'     : ['E1','TARGET','EFF_SPEED','EFF_CONV_DIR','OUTPUT','E2'],
  'effect:SUMMON:LOOK' : ['E1','ENTITY','EFF_SPEED','EFF_SUMMON_FROM','EFF_SUMMON_METHOD','EFF_SUMMON_LOOK','EFF_RESUMMON_MP','E2'],
  'effect:SUMMON:AXIS' : ['E1','ENTITY','EFF_SPEED','EFF_SUMMON_FROM','EFF_SUMMON_METHOD','EFF_SUMMON_AXIS','EFF_RESUMMON_MP','E2'],
};

function getModifierLayoutKey(block: ModifierBlock): keyof typeof MODIFIER_LAYOUT_INPUTS {
  const parent = block.getParent();
  const isStartMode = parent?.type === 'magic_start' || !!block.modifierPayload_.isDetailed;
  if (!isStartMode) {
    const et = block.modifierPayload_.effectType;
    if (et === 'SUMMON') {
      return (block.modifierPayload_.summonMethod || 'LOOK') === 'AXIS' ? 'effect:SUMMON:AXIS' : 'effect:SUMMON:LOOK';
    }
    const key = `effect:${et}` as keyof typeof MODIFIER_LAYOUT_INPUTS;
    return key in MODIFIER_LAYOUT_INPUTS ? key : 'effect:CONTROL';
  }
  const p = block.modifierPayload_;
  if (p.behavior !== 'MAINTAIN') return 'start:AUTO';
  return p.hasMaintainCost ? 'start:MAINTAIN:1' : 'start:MAINTAIN:0';
}

function modifierInputOrderMatches(block: ModifierBlock, key: keyof typeof MODIFIER_LAYOUT_INPUTS): boolean {
  const expected = MODIFIER_LAYOUT_INPUTS[key];
  if (block.inputList.length !== expected.length) return false;
  return block.inputList.every((inp, i) => inp.name === expected[i]);
}

function normalizeMutationFieldValue(name: string | undefined, v: unknown): string {
  if (name === 'HAS_MAINTAIN_COST') {
    if (v === true  || v === 'TRUE' ) return '1';
    if (v === false || v === 'FALSE') return '0';
  }
  return v == null ? '' : String(v);
}

function blockChangeFieldValueChanged(ce: Blockly.Events.BlockChange): boolean {
  return normalizeMutationFieldValue(ce.name, ce.oldValue) !== normalizeMutationFieldValue(ce.name, ce.newValue);
}

const MP_PCT_FIELD_NAMES = ['MP_START_PCT', 'MP_END_PCT', 'MP_CHARGE_PCT'] as const;
type FieldInternals = { isBeingEdited_?: boolean; };

/**
 * CSS クラス付与でフィールド背景矩形を薄赤強調。
 * MagicEditor.css の .field-error-bg rect.blocklyFieldRect { !important } で反映。
 */
function applyMpPctNumberFieldHighlight(field: Blockly.Field | null, error: boolean): void {
  if (!field) return;
  const root = field.getSvgRoot();
  if (!root) return;
  if (error) {
    Blockly.utils.dom.addClass(root, 'field-error-bg');
  } else {
    Blockly.utils.dom.removeClass(root, 'field-error-bg');
    field.applyColour();
  }
  if (!Boolean((field as unknown as FieldInternals).isBeingEdited_)) field.forceRerender();
}

/**
 * CSS クラス付与でヒントラベル文字を赤強調。
 * MagicEditor.css の .field-error-text text.blocklyText { !important } で反映。
 */
function applyMpPctHintLabel(field: Blockly.Field | null, error: boolean): void {
  if (!field) return;
  const root = field.getSvgRoot();
  if (!root) return;
  if (error) {
    Blockly.utils.dom.addClass(root, 'field-error-text');
  } else {
    Blockly.utils.dom.removeClass(root, 'field-error-text');
    field.applyColour();
  }
  if (!Boolean((field as unknown as FieldInternals).isBeingEdited_)) field.forceRerender();
}

function sumMpAllocationPct(block: Blockly.Block): number {
  let s = 0;
  for (const name of MP_PCT_FIELD_NAMES) {
    const f = block.getField(name);
    const v = f instanceof FieldSlider ? f.getNumericValue() : Number(block.getFieldValue(name));
    s += Number.isFinite(v) ? v : 0;
  }
  return s;
}

function isMpAllocationSumValid(block: Blockly.Block): boolean {
  return Math.abs(sumMpAllocationPct(block) - 100) < 0.5;
}

// =============================================================
// ブロック定義
// =============================================================

export const defineBlocks = () => {
  if (blocksDefined) return;
  blocksDefined = true;

  // =========================
  // 🟣 開始ブロック
  // =========================
  Blockly.Blocks['magic_start'] = {
    init: function (this: Blockly.Block) {
      this.appendDummyInput().appendField('魔法開始').appendField(new Blockly.FieldTextInput('新しい魔法'),'NAME');
      this.appendStatementInput('START_MODIFIER').setCheck('MODIFIER').appendField('節約');
      this.appendDummyInput('MP_DISPLAY').appendField('消費MP: 0');
      this.setNextStatement(true, 'TRIGGER');
      this.setColour(270);
    },
  };

  // =========================
  // 🟡 トリガーブロック【完全版・無限再帰修正済み】
  //
  // ■ NORMAL モード（スタンドアロン or TRIGGER チェーン）
  //   発動方式 [AND/OR▼]  [□ 自動発動]
  //   [□ ボタン入力]  → HAS_BUTTON=TRUE 時のみ [A▼]  ← AUTO_CAST=FALSE 時のみ表示
  //   条件 〔CONDITION〕  ← magic_trigger のみ
  //   実行 〔EXECUTE〕
  //
  // ■ CONDITION モード（他 trigger の CONDITION スロット内）
  //   [かつ/または/空] [対象▼] が [所有▼] の [場所▼] において [状態▼] 時 [判定▼]
  //
  // ──────────────────────────────────────────────────────────
  // 【無限再帰防止の設計】
  //   自動挿入は setTimeout（10ms）で遅延し、かつ実行時に
  //   this.getParent() !== null（親がいる）をチェックする。
  //   フライアウト内・デシリアライズ時（_tInited_=true）も挿入しない。
  //   子ブロックは newBlock() で生成されるが、生成直後は親がいないため
  //   setTimeout のコールバック時点で getParent() は null のまま。
  //   しかし connect() 後に BLOCK_MOVE が発火し isInConditionSlot() が
  //   true になるため CONDITION モードに切り替わる。
  //   CONDITION モード時は _tInited_ が true のままなので
  //   さらなる挿入は起きない。
  // =========================
  // ─── magic_trigger ＋／ー ボタン用インライン SVG（base64 データ URI） ──────
  // ＋ボタン：20×20px グレー円に白い十字
  const TRIGGER_PLUS_SVG = 'data:image/svg+xml;base64,' + btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">' +
    '<circle cx="10" cy="10" r="9" fill="#666"/>' +
    '<rect x="4" y="9" width="12" height="2" fill="#fff"/>' +
    '<rect x="9" y="4" width="2" height="12" fill="#fff"/>' +
    '</svg>'
  );
  // ーボタン：20×20px グレー円に白い横棒
  const TRIGGER_MINUS_SVG = 'data:image/svg+xml;base64,' + btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">' +
    '<circle cx="10" cy="10" r="9" fill="#666"/>' +
    '<rect x="4" y="9" width="12" height="2" fill="#fff"/>' +
    '</svg>'
  );

  Blockly.Blocks['magic_trigger'] = {
    init: function (this: Blockly.Block) {
      // ブロック固有フラグ
      (this as any)._tBusy_           = false; // updateShape_ の再入防止
      (this as any)._condCount_       = 1;     // 動的条件行数（初期値 1）
      (this as any)._pendingCondRows_ = null;  // 行追加・削除・デシリアライズ時の一時データ

      this.setPreviousStatement(true, 'TRIGGER');
      this.setNextStatement(true, 'TRIGGER');
      this.setColour(60);

      // 初期レイアウトを構築
      (this as Blockly.Block & { updateShape_: () => void }).updateShape_();

      // フィールド変化検知
      this.setOnChange((e: Blockly.Events.Abstract) => {
        if ((this as any)._tBusy_) return;
        if (!e || e.isUiEvent)     return;
        if (!this.workspace)       return;

        if (e.type === Blockly.Events.BLOCK_CHANGE) {
          const ce = e as Blockly.Events.BlockChange;
          if (ce.blockId !== this.id) return;
          if (ce.element !== 'field') return;

          // HAS_BUTTON の切り替えで BUTTON_SELECT を出し入れ
          if (ce.name === 'HAS_BUTTON') {
            (this as Blockly.Block & { updateShape_: () => void }).updateShape_();
            return;
          }
          // LOGIC_TYPE の変更で 2行目以降の「かつ/または」ラベルを即時更新
          if (ce.name === 'LOGIC_TYPE') {
            const lt = this.getFieldValue('LOGIC_TYPE') || 'AND';
            const newLabel = lt === 'OR' ? 'または' : 'かつ';
            const cnt = (this as any)._condCount_ as number;
            Blockly.Events.disable();
            try {
              for (let i = 1; i < cnt; i++) {
                const lf = this.getField(`COND_LABEL_${i}`);
                if (lf) lf.setValue(newLabel);
              }
            } finally {
              Blockly.Events.enable();
            }
            const svgBlk = this as unknown as Blockly.BlockSvg;
            if (svgBlk.rendered && typeof svgBlk.render === 'function') svgBlk.render();
            return;
          }
          // COND_PLACE_i の切り替えでサブ行（範囲・時間指定入力）を出し入れ
          if (ce.name && ce.name.startsWith('COND_PLACE_')) {
            (this as Blockly.Block & { updateShape_: () => void }).updateShape_();
          }
        }
      });
    },

    updateShape_: function (this: Blockly.Block) {
      if ((this as any)._tBusy_) return;
      (this as any)._tBusy_ = true;

      // 条件行データの型定義（connector は廃止。発動方式 LOGIC_TYPE でグローバル管理）
      type CondRow = {
        subject: string; owner: string; place: string; state: string;
        verdict: string; radius: number; time: number;
      };

      // ── 上部固定フィールドの現在値を保存 ────────────────────────────────
      const sv = {
        logicType : this.getField('LOGIC_TYPE')  ? this.getFieldValue('LOGIC_TYPE')  : 'AND',
        autoCast  : this.getField('AUTO_CAST')   ? this.getFieldValue('AUTO_CAST')   : 'FALSE',
        hasButton : this.getField('HAS_BUTTON')  ? this.getFieldValue('HAS_BUTTON')  : 'FALSE',
        buttonType: this.getField('BUTTON_TYPE') ? this.getFieldValue('BUTTON_TYPE') : 'A',
      };

      // ── 条件行データを決定 ──────────────────────────────────────────────
      let condRows: CondRow[];
      if ((this as any)._pendingCondRows_) {
        // add / remove / loadExtraState から渡された確定データを使い condCount と同期
        condRows = (this as any)._pendingCondRows_ as CondRow[];
        (this as any)._pendingCondRows_ = null;
        (this as any)._condCount_ = condRows.length;
      } else {
        // 現在のフィールド値から収集
        const count = (this as any)._condCount_ as number;
        condRows = [];
        for (let i = 0; i < count; i++) {
          condRows.push({
            subject: this.getField(`COND_SUBJECT_${i}`) ? this.getFieldValue(`COND_SUBJECT_${i}`) : 'SELF',
            owner  : this.getField(`COND_OWNER_${i}`)   ? this.getFieldValue(`COND_OWNER_${i}`)   : 'SELF',
            place  : this.getField(`COND_PLACE_${i}`)   ? this.getFieldValue(`COND_PLACE_${i}`)   : 'SELF',
            state  : this.getField(`COND_STATE_${i}`)   ? this.getFieldValue(`COND_STATE_${i}`)   : 'EXIST',
            verdict: this.getField(`COND_VERDICT_${i}`) ? this.getFieldValue(`COND_VERDICT_${i}`) : 'POSSIBLE',
            radius : this.getField(`COND_RADIUS_${i}`)  ? Number(this.getFieldValue(`COND_RADIUS_${i}`)) : 5,
            time   : this.getField(`COND_TIME_${i}`)    ? Number(this.getFieldValue(`COND_TIME_${i}`))   : 5,
          });
        }
      }

      // ── EXECUTE スロットの接続先を退避（removeInput 前に unplug して絶対座標を確定）──
      let execBlock: Blockly.Block | null = null;
      const execInput = this.getInput('EXECUTE');
      if (execInput?.connection) {
        const eb = execInput.connection.targetBlock();
        if (eb) {
          execBlock = eb;
          execBlock.unplug(false);
          const eSvg = execBlock as unknown as Blockly.BlockSvg;
          if (eSvg.rendered && typeof eSvg.render === 'function') {
            try { eSvg.render(); } catch { /* 無視 */ }
          }
        }
      }

      // ── 全入力を削除 ────────────────────────────────────────────────────
      while (this.inputList.length) this.removeInput(this.inputList[0].name);

      try {
        // ─────── 上部固定セクション ──────────────────────────────────────────

        // 発動方式 [AND/OR▼]
        this.appendDummyInput('LOGIC_ROW')
          .appendField('発動方式')
          .appendField(new Blockly.FieldDropdown([['AND','AND'],['OR','OR']]), 'LOGIC_TYPE');

        // 自動発動 [checkbox]
        this.appendDummyInput('AUTO_CAST_ROW')
          .appendField('自動発動')
          .appendField(new Blockly.FieldCheckbox('FALSE'), 'AUTO_CAST');

        // ボタン入力 [checkbox]
        this.appendDummyInput('BUTTON_ROW')
          .appendField('ボタン入力')
          .appendField(new Blockly.FieldCheckbox('FALSE'), 'HAS_BUTTON');

        // ボタン種類（HAS_BUTTON=TRUE 時のみ）
        if (sv.hasButton === 'TRUE') {
          this.appendDummyInput('BUTTON_SELECT')
            .appendField(new Blockly.FieldDropdown([
              ['A','A'],['B','B'],['X','X'],['Y','Y'],['L','L'],['R','R'],
            ]), 'BUTTON_TYPE');
        }

        // ─────── 動的条件行セクション ─────────────────────────────────────────
        // block をクロージャで束縛してボタンハンドラ内から参照できるようにする
        const block = this;
        // 2行目以降の「かつ/または」ラベルを LOGIC_TYPE から決定
        const condLabel = sv.logicType === 'OR' ? 'または' : 'かつ';

        for (let i = 0; i < condRows.length; i++) {
          const row = condRows[i];

          // 「ー」削除ボタンのハンドラ（removeIdx で i を確実に束縛）
          // 全行（1行目も含む）に配置し、0行まで削除可能
          const removeIdx = i;
          const minusHandler = () => {
            if ((block as any)._tBusy_) return;
            const currentCount = (block as any)._condCount_ as number;
            if (currentCount <= 0) return;
            const newRows: CondRow[] = [];
            for (let j = 0; j < currentCount; j++) {
              if (j === removeIdx) continue;
              newRows.push({
                subject: block.getField(`COND_SUBJECT_${j}`) ? block.getFieldValue(`COND_SUBJECT_${j}`) : 'SELF',
                owner  : block.getField(`COND_OWNER_${j}`)   ? block.getFieldValue(`COND_OWNER_${j}`)   : 'SELF',
                place  : block.getField(`COND_PLACE_${j}`)   ? block.getFieldValue(`COND_PLACE_${j}`)   : 'SELF',
                state  : block.getField(`COND_STATE_${j}`)   ? block.getFieldValue(`COND_STATE_${j}`)   : 'EXIST',
                verdict: block.getField(`COND_VERDICT_${j}`) ? block.getFieldValue(`COND_VERDICT_${j}`) : 'POSSIBLE',
                radius : block.getField(`COND_RADIUS_${j}`)  ? Number(block.getFieldValue(`COND_RADIUS_${j}`)) : 5,
                time   : block.getField(`COND_TIME_${j}`)    ? Number(block.getFieldValue(`COND_TIME_${j}`))   : 5,
              });
            }
            (block as any)._pendingCondRows_ = newRows;
            (block as Blockly.Block & { updateShape_: () => void }).updateShape_();
          };

          // 条件行本体（2行目以降は先頭に「かつ/または」ラベル COND_LABEL_i を付加）
          const rowInput = this.appendDummyInput(`COND_ROW_${i}`);
          if (i > 0) {
            rowInput.appendField(new Blockly.FieldLabel(condLabel), `COND_LABEL_${i}`);
          }
          rowInput
            .appendField(new Blockly.FieldDropdown([
              ['自分','SELF'],     ['味方','ALLY'],['敵','ENEMY'],
              ['床面','GROUND'], ['天井','CEILING'],['召喚物','SUMMON'],
              ['空気','AIR'],    ['肺','LUNG'],
              ['手','HAND'],     ['足','FOOT'],     ['頭','HEAD'],
              ['胴','BODY'],     ['腰','WAIST'],    ['腕','ARM'],
              ['目','EYE'],      ['耳','EAR'],      ['口','MOUTH'],
              ['尾','TAIL'],     ['光','LIGHT'],    ['太陽光','SUN'],
              ['月光','MOON'],   ['魔力','MANA'],   ['体力','HP'],
            ]), `COND_SUBJECT_${i}`)
            .appendField('が')
            .appendField(new Blockly.FieldDropdown([
              ['自分','SELF'],     ['敵','ENEMY'],        ['味方','ALLY'],
              ['野生','WILD'],     ['所有者なし','NO_OWNER'],
              ['召喚物','SUMMON'], ['魔術','MAGIC'],      ['なし','NONE'],
            ]), `COND_OWNER_${i}`)
            .appendField('の')
            .appendField(new Blockly.FieldDropdown([
              ['自分','SELF'],   ['敵','ENEMY'],    ['味方','ALLY'],
              ['床面','GROUND'], ['天井','CEILING'],['召喚物','SUMMON'],
              ['空気','AIR'],    ['肺','LUNG'],
              ['手','HAND'],     ['足','FOOT'],     ['頭','HEAD'],
              ['胴','BODY'],     ['腰','WAIST'],    ['腕','ARM'],
              ['目','EYE'],      ['耳','EAR'],      ['口','MOUTH'],
              ['尾','TAIL'],     ['植物','PLANT'],  ['光','LIGHT'],
              ['太陽光','SUN'],  ['月光','MOON'],   ['魔力','MANA'],
              ['体力','HP'],
              ['範囲指定(半径○m以内)','RANGE_IN'],
              ['範囲指定(半径○mの外)','RANGE_OUT'],
              ['時間指定(○秒以内)','TIME_IN'],
              ['時間指定(○秒後)','TIME_AFTER'],
            ]), `COND_PLACE_${i}`)
            .appendField('において')
            .appendField(new Blockly.FieldDropdown([
              ['存在する','EXIST'],       ['存在しない','NOT_EXIST'],
              ['接触している','TOUCH'],   ['接触していない','NOT_TOUCH'],
              ['動いている','MOVE'],      ['止まっている','STOP'],
              ['見えている','SEE'],       ['見えていない','NOT_SEE'],
              ['増えている','INC'],       ['減っている','DEC'],
              ['攻撃した','ATK'],         ['攻撃された','ATKED'],
              ['防御した','DEF'],         ['防御された','DEFED'],
              ['回復した','HEAL'],        ['回復された','HEALED'],
              ['消費した','USED'],        ['召喚した','SUMMON'],
              ['発動した','CAST'],        ['停止した','STOPPED'],
              ['囲んだ','SURROUND'],      ['囲まれた','SURROUNDED'],
              ['乗せた','LOAD'],          ['降ろした','UNLOAD'],
              ['上回った','EXCEED'],      ['下回った','BELOW'],
            ]), `COND_STATE_${i}`)
            .appendField('時')
            .appendField(new Blockly.FieldDropdown([
              ['発動可能','POSSIBLE'],
              ['発動不可','IMPOSSIBLE'],
            ]), `COND_VERDICT_${i}`)
            .appendField(new (Blockly.FieldImage as any)(TRIGGER_MINUS_SVG, 20, 20, '－', minusHandler));

          // 範囲・時間指定のサブ行（COND_PLACE_i の値に応じて表示）
          if (row.place === 'RANGE_IN') {
            this.appendDummyInput(`COND_SUB_${i}`)
              .appendField('半径')
              .appendField(new Blockly.FieldNumber(row.radius, 0), `COND_RADIUS_${i}`)
              .appendField('m以内');
          } else if (row.place === 'RANGE_OUT') {
            this.appendDummyInput(`COND_SUB_${i}`)
              .appendField('半径')
              .appendField(new Blockly.FieldNumber(row.radius, 0), `COND_RADIUS_${i}`)
              .appendField('の外');
          } else if (row.place === 'TIME_IN') {
            this.appendDummyInput(`COND_SUB_${i}`)
              .appendField(new Blockly.FieldNumber(row.time, 0), `COND_TIME_${i}`)
              .appendField('秒以内');
          } else if (row.place === 'TIME_AFTER') {
            this.appendDummyInput(`COND_SUB_${i}`)
              .appendField(new Blockly.FieldNumber(row.time, 0), `COND_TIME_${i}`)
              .appendField('秒後');
          }
        }

        // 「⊕ 追加」ボタン行
        const addHandler = () => {
          if ((block as any)._tBusy_) return;
          const currentCount = (block as any)._condCount_ as number;
          const newRows: CondRow[] = [];
          for (let j = 0; j < currentCount; j++) {
            newRows.push({
              subject: block.getField(`COND_SUBJECT_${j}`) ? block.getFieldValue(`COND_SUBJECT_${j}`) : 'SELF',
              owner  : block.getField(`COND_OWNER_${j}`)   ? block.getFieldValue(`COND_OWNER_${j}`)   : 'SELF',
              place  : block.getField(`COND_PLACE_${j}`)   ? block.getFieldValue(`COND_PLACE_${j}`)   : 'SELF',
              state  : block.getField(`COND_STATE_${j}`)   ? block.getFieldValue(`COND_STATE_${j}`)   : 'EXIST',
              verdict: block.getField(`COND_VERDICT_${j}`) ? block.getFieldValue(`COND_VERDICT_${j}`) : 'POSSIBLE',
              radius : block.getField(`COND_RADIUS_${j}`)  ? Number(block.getFieldValue(`COND_RADIUS_${j}`)) : 5,
              time   : block.getField(`COND_TIME_${j}`)    ? Number(block.getFieldValue(`COND_TIME_${j}`))   : 5,
            });
          }
          // デフォルト値の新規行を末尾に追加
          newRows.push({
            subject: 'SELF', owner: 'SELF', place: 'SELF',
            state: 'EXIST', verdict: 'POSSIBLE', radius: 5, time: 5,
          });
          (block as any)._pendingCondRows_ = newRows;
          (block as Blockly.Block & { updateShape_: () => void }).updateShape_();
        };

        this.appendDummyInput('COND_ADD_ROW')
          .appendField(new (Blockly.FieldImage as any)(TRIGGER_PLUS_SVG, 20, 20, '⊕', addHandler))
          .appendField('追加');

        // ─────── 実行スロット ──────────────────────────────────────────────────
        this.appendStatementInput('EXECUTE').setCheck('EFFECT').appendField('実行');

        // ── フィールド値を復元（BLOCK_CHANGE 発火を抑制） ──────────────────────
        Blockly.Events.disable();
        try {
          this.setFieldValue(sv.logicType,  'LOGIC_TYPE');
          this.setFieldValue(sv.autoCast,   'AUTO_CAST');
          this.setFieldValue(sv.hasButton,  'HAS_BUTTON');
          if (this.getField('BUTTON_TYPE')) this.setFieldValue(sv.buttonType, 'BUTTON_TYPE');
          for (let i = 0; i < condRows.length; i++) {
            const row = condRows[i];
            this.setFieldValue(row.subject, `COND_SUBJECT_${i}`);
            this.setFieldValue(row.owner,   `COND_OWNER_${i}`);
            this.setFieldValue(row.place,   `COND_PLACE_${i}`);
            this.setFieldValue(row.state,   `COND_STATE_${i}`);
            this.setFieldValue(row.verdict, `COND_VERDICT_${i}`);
            if (this.getField(`COND_RADIUS_${i}`)) this.setFieldValue(String(row.radius), `COND_RADIUS_${i}`);
            if (this.getField(`COND_TIME_${i}`))   this.setFieldValue(String(row.time),   `COND_TIME_${i}`);
          }
        } finally {
          Blockly.Events.enable();
        }

        // ── EXECUTE スロットの接続を復元 ────────────────────────────────────
        if (execBlock?.previousConnection) {
          try {
            this.getInput('EXECUTE')?.connection?.connect(execBlock.previousConnection);
          } catch { /* 接続失敗は無視 */ }
        }

        // ── 同期再描画（ドロップダウン座標を確定）──────────────────────────────
        const svgBlock = this as unknown as Blockly.BlockSvg;
        if (svgBlock.rendered && typeof svgBlock.render === 'function') svgBlock.render();

      } finally {
        (this as any)._tBusy_ = false;
      }
    },

    saveExtraState(this: Blockly.Block) {
      // 構造復元に必要な全条件行データ（行数・各行の全フィールド値）を保存する
      // condCount = 0 の場合もそのまま保存する（|| 0 で null/undefined のみ 0 にフォールバック）
      const condCount = ((this as any)._condCount_ as number) ?? 0;
      const condRows: Array<{
        subject: string; owner: string; place: string; state: string;
        verdict: string; radius: number; time: number;
      }> = [];
      for (let i = 0; i < condCount; i++) {
        condRows.push({
          subject: this.getField(`COND_SUBJECT_${i}`) ? this.getFieldValue(`COND_SUBJECT_${i}`) : 'SELF',
          owner  : this.getField(`COND_OWNER_${i}`)   ? this.getFieldValue(`COND_OWNER_${i}`)   : 'SELF',
          place  : this.getField(`COND_PLACE_${i}`)   ? this.getFieldValue(`COND_PLACE_${i}`)   : 'SELF',
          state  : this.getField(`COND_STATE_${i}`)   ? this.getFieldValue(`COND_STATE_${i}`)   : 'EXIST',
          verdict: this.getField(`COND_VERDICT_${i}`) ? this.getFieldValue(`COND_VERDICT_${i}`) : 'POSSIBLE',
          radius : this.getField(`COND_RADIUS_${i}`)  ? Number(this.getFieldValue(`COND_RADIUS_${i}`)) : 5,
          time   : this.getField(`COND_TIME_${i}`)    ? Number(this.getFieldValue(`COND_TIME_${i}`))   : 5,
        });
      }
      return { condCount, condRows };
    },

    loadExtraState(this: Blockly.Block, state: { condCount?: number; condRows?: any[] }) {
      // 行数・全フィールド値を _pendingCondRows_ 経由で updateShape_ に渡す
      // place に依存するサブ行の有無も含めて構造を正確に復元するため全データを保持する
      // state.condCount が未定義（旧セーブデータ）の場合は 1 行にフォールバック
      const condCount = state.condCount !== undefined ? state.condCount : 1;
      let rows: any[];
      if (state.condRows && state.condRows.length > 0) {
        rows = state.condRows.slice(0, condCount);
      } else {
        rows = [];
        for (let i = 0; i < condCount; i++) {
          rows.push({
            subject: 'SELF', owner: 'SELF', place: 'SELF',
            state: 'EXIST', verdict: 'POSSIBLE', radius: 5, time: 5,
          });
        }
      }
      (this as any)._pendingCondRows_ = rows;
      (this as Blockly.Block & { updateShape_: () => void }).updateShape_();
    },
  };

  // =========================
  // 🔴 事象ブロック
  // =========================
  Blockly.Blocks['magic_effect'] = {
    init: function (this: Blockly.Block) {
      this.appendDummyInput('EFF_TYPE_ROW')
        .appendField('事象')
        .appendField(new Blockly.FieldDropdown(
          [['操作','CONTROL'],['変形','TRANSFORM'],['変換','CONVERT'],['召喚','SUMMON']],
          (type) => { (this as Blockly.Block & { updateShape_:(t:string)=>void }).updateShape_(type); return type; }
        ), 'TYPE');
      this.setPreviousStatement(true, 'EFFECT');
      this.setNextStatement(true, 'EFFECT');
      this.setColour(0);
      (this as Blockly.Block & { updateShape_:(t:string)=>void }).updateShape_('CONTROL');
      this.setOnChange((e: Blockly.Events.Abstract) => {
        if (!e || e.isUiEvent || e.type !== Blockly.Events.BLOCK_CHANGE) return;
        const ce = e as Blockly.Events.BlockChange;
        if (ce.blockId !== this.id || ce.element !== 'field') return;
        if (ce.name === 'SUMMON_METHOD' && blockChangeFieldValueChanged(ce))
          rebuildSummonMethodInputs(this, ce.newValue as string);
      });
    },
    updateShape_: function (this: Blockly.Block, type: string) {
      [...this.inputList].forEach(inp => { if (inp.name !== 'EFF_TYPE_ROW') this.removeInput(inp.name); });
      this.appendStatementInput('TARGET').setCheck('TARGET').appendField('対象');
      if (type === 'CONTROL') {
        this.appendDummyInput('EFF_SPEED').appendField('速度').appendField(new Blockly.FieldNumber(1,0),'SPEED').appendField('km/h');
        this.appendDummyInput('EFF_DIR').appendField('方向').appendField(new Blockly.FieldDropdown(DIRECTION_OPTIONS),'DIRECTION');
        this.appendDummyInput('EFF_RANGE').appendField('操作可能範囲')
          .appendField(new Blockly.FieldDropdown([
            ['自分','SELF'],['敵','ENEMY'],['味方','ALLY'],['床面','GROUND'],['天井','CEILING'],
            ['召喚物','SUMMON'],['空気','AIR'],['手','HAND'],['足','FOOT'],['頭','HEAD'],
            ['胴','BODY'],['腰','WAIST'],['腕','ARM'],['目','EYE'],['耳','EAR'],['口','MOUTH'],
            ['尾','TAIL'],['植物','PLANT'],['光','LIGHT'],['魔力','MANA'],['体力','HP'],
          ]), 'RANGE_ORIGIN')
          .appendField('から半径').appendField(new Blockly.FieldNumber(5,0),'RANGE_RADIUS').appendField('m')
          .appendField(new Blockly.FieldDropdown([['以内','INSIDE'],['以外','OUTSIDE']]),'RANGE_CONDITION');
      } else if (type === 'TRANSFORM') {
        appendTransformFields(this);
      } else if (type === 'CONVERT') {
        this.appendDummyInput('EFF_SPEED').appendField('変換速度').appendField(new Blockly.FieldNumber(1,0),'SPEED').appendField('km/h');
        this.appendDummyInput('EFF_CONV_DIR').appendField('変換順序').appendField(new Blockly.FieldDropdown(CONVERT_ORDER_OPTIONS),'CONV_ORDER');
        this.appendStatementInput('OUTPUT').setCheck('TARGET').appendField('出力指定');
      } else if (type === 'SUMMON') {
        if (this.getInput('TARGET')) this.removeInput('TARGET');
        appendSummonFields(this);
      }
      this.appendStatementInput('MOD').setCheck('MODIFIER').appendField('節約');
    },
  };

  // =========================
  // 🔵 節約ブロック
  // =========================
  Blockly.Blocks['magic_modifier'] = {
    init: function (this: Blockly.Block) {
      const self = asModifierBlock(this);
      self.modifierPayload_ = defaultModifierPayload();
      self.layoutBusy_ = false;
      this.setPreviousStatement(true, 'MODIFIER');
      this.setNextStatement(true, 'MODIFIER');
      this.setColour(210);
      this.setEditable(true);

      self.updateMpPctWarning_ = function (this: ModifierBlock) {
        if (!this.getField('MP_START_PCT')) return;
        const sum = sumMpAllocationPct(this);
        const error = !isMpAllocationSumValid(this);
        const hint = this.getField('MP_PCT_HINT');
        if (hint) {
          hint.setValue(error ? `（合計 ${Math.round(sum)}% → ちょうど100%にしてください）` : '');
          applyMpPctHintLabel(hint, error);
        }
        for (const name of MP_PCT_FIELD_NAMES) {
          const f = this.getField(name);
          if (f instanceof FieldSlider) f.applyErrorStyle(error);
          else applyMpPctNumberFieldHighlight(f, error);
        }
        const svg = this as unknown as Blockly.BlockSvg;
        if (svg.rendered && typeof svg.queueRender === 'function') svg.queueRender();
      };

      self.updateLayout_ = function (this: ModifierBlock, forceRebuild?: boolean) {
        if (this.layoutBusy_) return;
        this.layoutBusy_ = true;
        try {
          this.syncFromVisibleFields_();
          const layoutKey = getModifierLayoutKey(this);
          if (!forceRebuild && modifierInputOrderMatches(this, layoutKey)) {
            this.updateMpPctWarning_(); return;
          }
          while (this.inputList.length) this.removeInput(this.inputList[0].name);
          const parent    = this.getParent();
          const startMode = parent?.type === 'magic_start' || !!this.modifierPayload_.isDetailed;
          if (startMode) {
            this.appendDummyInput('S1').appendField('節約');
            this.appendDummyInput('S2').appendField('チャージ時間').appendField(magicFieldNumber(0.1,0.1,undefined,0.05),'CHARGE_TIME').appendField('秒');
            this.appendDummyInput('S3').appendField('クールタイム').appendField(magicFieldNumber(1.0,0.1,undefined,0.05),'COOLDOWN').appendField('秒');
            this.appendDummyInput('S4').appendField('チャージ完了後の挙動').appendField(new Blockly.FieldDropdown([['自動で発動','AUTO'],['維持する','MAINTAIN']]),'BEHAVIOR');
            if (this.modifierPayload_.behavior === 'MAINTAIN') {
              this.appendDummyInput('S5').appendField('維持中の消費').appendField(new Blockly.FieldCheckbox(this.modifierPayload_.hasMaintainCost?'TRUE':'FALSE'),'HAS_MAINTAIN_COST');
              if (this.modifierPayload_.hasMaintainCost)
                this.appendDummyInput('S6').appendField('維持消費').appendField(magicFieldNumber(0.1,0.1,undefined,0.05),'MAINTAIN_COST_SEC').appendField('MP/s');
            }
            this.appendDummyInput('S_MP0').appendField('MP消費タイミング分配：').appendField(new Blockly.FieldLabel(''),'MP_PCT_HINT');
            this.appendDummyInput('S_MP1').appendField('チャージ開始時').appendField(new FieldSlider(34,0,100),'MP_START_PCT').appendField('%');
            this.appendDummyInput('S_MP2').appendField('チャージ完了時').appendField(new FieldSlider(33,0,100),'MP_END_PCT').appendField('%');
            this.appendDummyInput('S_MP3').appendField('チャージ継続中').appendField(new FieldSlider(33,0,100),'MP_CHARGE_PCT').appendField('%');
          } else {
            const effType = this.modifierPayload_.effectType;
            this.appendDummyInput('E1').appendField('節約').appendField(new Blockly.FieldDropdown(
              [['操作','CONTROL'],['変形','TRANSFORM'],['変換','CONVERT'],['召喚','SUMMON']],
              function (this: Blockly.FieldDropdown, type: string) {
                (this.getSourceBlock() as ModifierBlock).modifierPayload_.effectType = type; return type;
              }
            ),'TYPE');
            if (effType === 'SUMMON') {
              this.appendStatementInput('ENTITY').setCheck('TARGET').appendField('選択');
              this.appendDummyInput('EFF_SPEED').appendField('召喚速度').appendField(new Blockly.FieldNumber(1,0),'SPEED').appendField('km/h');
              this.appendDummyInput('EFF_SUMMON_FROM').appendField('起点').appendField(new Blockly.FieldDropdown([['自身','SELF'],['敵','ENEMY'],['召喚物','SUMMON']]),'SUMMON_FROM').appendField('から');
              this.appendDummyInput('EFF_SUMMON_METHOD').appendField('方式').appendField(new Blockly.FieldDropdown([['視線誘導','LOOK'],['縦横軸設定','AXIS']]),'SUMMON_METHOD').appendField('で');
              const sm = this.modifierPayload_.summonMethod || 'LOOK';
              appendSummonMethodSpecificFields(this, sm, this.modifierPayload_.summonDistance, this.modifierPayload_.summonAngleV, this.modifierPayload_.summonAngleH);
              this.appendDummyInput('EFF_RESUMMON_MP').appendField('再召喚時消費').appendField(new Blockly.FieldNumber(this.modifierPayload_.resummonMp,0),'RESUMMON_MP').appendField('MP');
            } else {
              this.appendStatementInput('TARGET').setCheck('TARGET').appendField('対象');
              if (effType === 'CONTROL') {
                this.appendDummyInput('EFF_SPEED').appendField('速度').appendField(new Blockly.FieldNumber(1,0),'SPEED').appendField('km/h');
                this.appendDummyInput('EFF_DIR').appendField('方向').appendField(new Blockly.FieldDropdown(DIRECTION_OPTIONS),'DIRECTION');
                this.appendDummyInput('EFF_RANGE').appendField('操作可能範囲')
                  .appendField(new Blockly.FieldDropdown([
                    ['自分','SELF'],['敵','ENEMY'],['味方','ALLY'],['床面','GROUND'],['天井','CEILING'],
                    ['召喚物','SUMMON'],['空気','AIR'],['手','HAND'],['足','FOOT'],['頭','HEAD'],
                    ['胴','BODY'],['腰','WAIST'],['腕','ARM'],['目','EYE'],['耳','EAR'],['口','MOUTH'],
                    ['尾','TAIL'],['植物','PLANT'],['光','LIGHT'],['魔力','MANA'],['体力','HP'],
                  ]),'RANGE_ORIGIN')
                  .appendField('から半径').appendField(new Blockly.FieldNumber(5,0),'RANGE_RADIUS').appendField('m')
                  .appendField(new Blockly.FieldDropdown([['以内','INSIDE'],['以外','OUTSIDE']]),'RANGE_CONDITION');
              } else if (effType === 'TRANSFORM') {
                appendTransformFields(this);
              } else if (effType === 'CONVERT') {
                this.appendDummyInput('EFF_SPEED').appendField('変換速度').appendField(new Blockly.FieldNumber(1,0),'SPEED').appendField('km/h');
                this.appendDummyInput('EFF_CONV_DIR').appendField('変換順序').appendField(new Blockly.FieldDropdown(CONVERT_ORDER_OPTIONS),'CONV_ORDER');
                this.appendStatementInput('OUTPUT').setCheck('TARGET').appendField('出力指定');
              }
            }
            this.appendDummyInput('E2').appendField('倍率').appendField(magicFieldNumber(0.1,0.1,2.0,0.05),'MULTIPLIER');
          }
          this.applyPayloadToFields_();
          this.updateMpPctWarning_();
        } finally {
          this.layoutBusy_ = false;
        }
        const svg = this as unknown as Blockly.BlockSvg;
        if (svg.rendered && typeof svg.queueRender === 'function') svg.queueRender();
      };

      self.syncFromVisibleFields_ = function (this: ModifierBlock) {
        const p = this.modifierPayload_;
        if (this.getField('TYPE'))              p.effectType      = this.getFieldValue('TYPE') || p.effectType;
        if (this.getField('MULTIPLIER'))        p.multiplier      = Number(this.getFieldValue('MULTIPLIER')) || p.multiplier;
        if (this.getField('CHARGE_TIME'))       p.chargeTime      = Number(this.getFieldValue('CHARGE_TIME')) || p.chargeTime;
        if (this.getField('COOLDOWN'))          p.cooldown        = Number(this.getFieldValue('COOLDOWN')) || p.cooldown;
        if (this.getField('BEHAVIOR'))          p.behavior        = this.getFieldValue('BEHAVIOR') === 'MAINTAIN' ? 'MAINTAIN' : 'AUTO';
        if (this.getField('HAS_MAINTAIN_COST')) p.hasMaintainCost = this.getFieldValue('HAS_MAINTAIN_COST') === 'TRUE';
        if (this.getField('MAINTAIN_COST_SEC')) p.maintainCostSec = Number(this.getFieldValue('MAINTAIN_COST_SEC')) || p.maintainCostSec;
        const rp = (n: string) => {
          const f = this.getField(n);
          if (!f) return null;
          const v = f instanceof FieldSlider ? f.getNumericValue() : Number(this.getFieldValue(n));
          return Number.isFinite(v) ? v : null;
        };
        const s = rp('MP_START_PCT');  if (s !== null) p.mpStartPct  = s;
        const e = rp('MP_END_PCT');    if (e !== null) p.mpEndPct    = e;
        const c = rp('MP_CHARGE_PCT'); if (c !== null) p.mpChargePct = c;
        if (this.getField('RANGE_ORIGIN'))    p.rangeOrigin    = this.getFieldValue('RANGE_ORIGIN')    || p.rangeOrigin;
        if (this.getField('RANGE_RADIUS'))    p.rangeRadius    = Number(this.getFieldValue('RANGE_RADIUS')) || p.rangeRadius;
        if (this.getField('RANGE_CONDITION')) p.rangeCondition = this.getFieldValue('RANGE_CONDITION') || p.rangeCondition;
        if (this.getField('SHAPE'))    p.transShape    = this.getFieldValue('SHAPE') || p.transShape;
        if (this.getField('QUANTITY')) p.transQuantity = Number(this.getFieldValue('QUANTITY')) || p.transQuantity;
        if (this.getField('HARDNESS')) { const v = Number(this.getFieldValue('HARDNESS')); if (Number.isFinite(v)) p.transHardness = v; }
        if (this.getField('WEIGHT'))   { const v = Number(this.getFieldValue('WEIGHT'));   if (Number.isFinite(v)) p.transWeight   = v; }
        if (this.getField('WIDTH'))    { const v = Number(this.getFieldValue('WIDTH'));    if (Number.isFinite(v) && v >= 0) p.transWidth  = v; }
        if (this.getField('LENGTH'))   { const v = Number(this.getFieldValue('LENGTH'));   if (Number.isFinite(v) && v >= 0) p.transLength = v; }
        if (this.getField('SUMMON_FROM'))    p.summonFrom         = this.getFieldValue('SUMMON_FROM')    || p.summonFrom;
        if (this.getField('SUMMON_METHOD'))  p.summonMethod       = this.getFieldValue('SUMMON_METHOD')  || p.summonMethod;
        if (this.getField('DISTANCE'))       { const v = Number(this.getFieldValue('DISTANCE'));  if (Number.isFinite(v) && v >= 0) p.summonDistance = v; }
        if (this.getField('DIRECTION_REF'))  p.summonDirectionRef = this.getFieldValue('DIRECTION_REF')  || p.summonDirectionRef;
        if (this.getField('ANGLE_V'))        { const v = Number(this.getFieldValue('ANGLE_V')); if (Number.isFinite(v)) p.summonAngleV = v; }
        if (this.getField('ANGLE_H'))        { const v = Number(this.getFieldValue('ANGLE_H')); if (Number.isFinite(v)) p.summonAngleH = v; }
        if (this.getField('RESUMMON_MP'))    { const v = Number(this.getFieldValue('RESUMMON_MP')); if (Number.isFinite(v) && v >= 0) p.resummonMp = v; }
      };

      self.applyPayloadToFields_ = function (this: ModifierBlock) {
        const p = this.modifierPayload_;
        if (this.getField('TYPE'))              this.setFieldValue(p.effectType,                        'TYPE');
        if (this.getField('MULTIPLIER'))        this.setFieldValue(String(p.multiplier),                'MULTIPLIER');
        if (this.getField('CHARGE_TIME'))       this.setFieldValue(String(p.chargeTime),                'CHARGE_TIME');
        if (this.getField('COOLDOWN'))          this.setFieldValue(String(p.cooldown),                  'COOLDOWN');
        if (this.getField('BEHAVIOR'))          this.setFieldValue(p.behavior,                          'BEHAVIOR');
        if (this.getField('HAS_MAINTAIN_COST')) this.setFieldValue(p.hasMaintainCost?'TRUE':'FALSE',    'HAS_MAINTAIN_COST');
        if (this.getField('MAINTAIN_COST_SEC')) this.setFieldValue(String(p.maintainCostSec),           'MAINTAIN_COST_SEC');
        if (this.getField('MP_START_PCT'))      this.setFieldValue(String(p.mpStartPct),                'MP_START_PCT');
        if (this.getField('MP_END_PCT'))        this.setFieldValue(String(p.mpEndPct),                  'MP_END_PCT');
        if (this.getField('MP_CHARGE_PCT'))     this.setFieldValue(String(p.mpChargePct),               'MP_CHARGE_PCT');
        if (this.getField('RANGE_ORIGIN'))      this.setFieldValue(p.rangeOrigin,                       'RANGE_ORIGIN');
        if (this.getField('RANGE_RADIUS'))      this.setFieldValue(String(p.rangeRadius),               'RANGE_RADIUS');
        if (this.getField('RANGE_CONDITION'))   this.setFieldValue(p.rangeCondition,                    'RANGE_CONDITION');
        if (this.getField('SHAPE'))    this.setFieldValue(p.transShape,            'SHAPE');
        if (this.getField('QUANTITY')) this.setFieldValue(String(p.transQuantity), 'QUANTITY');
        if (this.getField('HARDNESS')) this.setFieldValue(String(p.transHardness), 'HARDNESS');
        if (this.getField('WEIGHT'))   this.setFieldValue(String(p.transWeight),   'WEIGHT');
        if (this.getField('WIDTH'))    this.setFieldValue(String(p.transWidth),    'WIDTH');
        if (this.getField('LENGTH'))   this.setFieldValue(String(p.transLength),   'LENGTH');
        if (this.getField('SUMMON_FROM'))    this.setFieldValue(p.summonFrom,             'SUMMON_FROM');
        if (this.getField('SUMMON_METHOD'))  this.setFieldValue(p.summonMethod,           'SUMMON_METHOD');
        if (this.getField('DISTANCE'))       this.setFieldValue(String(p.summonDistance), 'DISTANCE');
        if (this.getField('DIRECTION_REF'))  this.setFieldValue(p.summonDirectionRef,     'DIRECTION_REF');
        if (this.getField('ANGLE_V'))        this.setFieldValue(String(p.summonAngleV),   'ANGLE_V');
        if (this.getField('ANGLE_H'))        this.setFieldValue(String(p.summonAngleH),   'ANGLE_H');
        if (this.getField('RESUMMON_MP'))    this.setFieldValue(String(p.resummonMp),     'RESUMMON_MP');
      };

      self.updateLayout_.call(self);
      // フライアウト内では init() 時点で親接続が未完のため BLOCK_MOVE が抑制される。
      // マイクロタスクで接続確立後に再評価し、開始ブロック内なら詳細レイアウトへ切り替える。
      queueMicrotask(() => { if (!self.layoutBusy_) self.updateLayout_.call(self, false); });

      this.setOnChange((e: Blockly.Events.Abstract) => {
        if (self.layoutBusy_) return;
        if (!e || e.isUiEvent) return;
        if (!this.workspace.isFlyout) {
          const prevConn = this.previousConnection;
          if (prevConn?.isConnected()) {
            const host = prevConn.targetConnection?.getSourceBlock();
            if (host && host.type !== 'magic_effect' && host.type !== 'magic_start') this.unplug(true);
          }
        }
        const id = this.id;
        if (e.type === Blockly.Events.BLOCK_CHANGE && (e as Blockly.Events.BlockChange).blockId === id) {
          const ce = e as Blockly.Events.BlockChange;
          if (ce.element === 'field') {
            if (ce.name === 'BEHAVIOR' || ce.name === 'HAS_MAINTAIN_COST') {
              if (blockChangeFieldValueChanged(ce)) self.updateLayout_.call(self, false);
            } else if (ce.name === 'TYPE') {
              if (blockChangeFieldValueChanged(ce)) {
                self.modifierPayload_.effectType = (ce.newValue as string) || self.modifierPayload_.effectType;
                self.updateLayout_.call(self, true);
              }
            } else if (ce.name === 'SUMMON_METHOD') {
              if (blockChangeFieldValueChanged(ce)) {
                self.modifierPayload_.summonMethod = (ce.newValue as string) || self.modifierPayload_.summonMethod;
                self.updateLayout_.call(self, true);
              }
            } else if (ce.name === 'MP_START_PCT' || ce.name === 'MP_END_PCT' || ce.name === 'MP_CHARGE_PCT') {
              self.updateMpPctWarning_.call(self);
            }
          }
          return;
        }
        if (e.type === Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE &&
            (e as Blockly.Events.BlockFieldIntermediateChange).blockId === id) {
          const ice = e as Blockly.Events.BlockFieldIntermediateChange;
          if (ice.name === 'MP_START_PCT' || ice.name === 'MP_END_PCT' || ice.name === 'MP_CHARGE_PCT')
            self.updateMpPctWarning_.call(self);
          return;
        }
        if (e.type === Blockly.Events.BLOCK_MOVE && (e as Blockly.Events.BlockMove).blockId === id) {
          const move = e as Blockly.Events.BlockMove;
          if (!move.isNull() && modifierHostConnectionChanged(move))
            queueMicrotask(() => { if (!self.layoutBusy_) self.updateLayout_.call(self, false); });
          return;
        }
      });
    },

    saveExtraState(this: ModifierBlock) {
      this.syncFromVisibleFields_();
      // isDetailed はツールボックス表示専用フラグのため保存しない
      const { isDetailed: _det, ...payloadToSave } = this.modifierPayload_;
      return { payload: payloadToSave };
    },
    loadExtraState(this: ModifierBlock, state: { payload?: MagicModifierPayload }) {
      if (state?.payload) this.modifierPayload_ = { ...defaultModifierPayload(), ...state.payload };
      queueMicrotask(() => this.updateLayout_(true));
    },
    updateTarget(this: Blockly.Block, type: string) {
      (this.getInputTargetBlock('TARGET') as { updateByType?:(t:string)=>void }|null)?.updateByType?.(type);
    },
  };

  // =========================
  // 🟢 対象ブロック
  // =========================
  Blockly.Blocks['magic_target'] = {
    init: function (this: Blockly.Block) {
      const self = this;
      this.setPreviousStatement(true, 'TARGET');
      this.setNextStatement(true, 'TARGET');
      this.setColour(120);
      (this as Blockly.Block & { updateShape_:(s:string)=>void }).updateShape_('TARGET');
      this.setOnChange((e: Blockly.Events.Abstract) => {
        if (!e || e.isUiEvent) return;
        if (e.type === Blockly.Events.BLOCK_MOVE) {
          const move = e as Blockly.Events.BlockMove;
          if (move.blockId !== self.id) return;
          queueMicrotask(() => {
            const slotName = getConnectedInputName(self);
            (self as Blockly.Block & { updateShape_:(s:string)=>void }).updateShape_(slotName);
          });
          return;
        }
        if (e.type === Blockly.Events.BLOCK_CHANGE) {
          const ce = e as Blockly.Events.BlockChange;
          if (ce.blockId !== self.id || ce.element !== 'field') return;
          if ((ce.name === 'SUBJECT' || ce.name === 'PLACE') && self.getInput('FILTER_ROW'))
            rebuildTargetExtras(self);
        }
      });
    },
    updateShape_: function (this: Blockly.Block, slotName: string) {
      const sO  = this.getField('OWNER')              ? this.getFieldValue('OWNER')              : 'SELF';
      const sP  = this.getField('PLACE')              ? this.getFieldValue('PLACE')              : 'SELF';
      const sSt = this.getField('STATE')              ? this.getFieldValue('STATE')              : 'EXIST';
      const sSu = this.getField('SUBJECT')            ? this.getFieldValue('SUBJECT')            : 'SELF';
      const sPN = this.getField('PLACE_NUM')          ? Number(this.getFieldValue('PLACE_NUM'))  : 5;
      const sAt = this.getField('ATTRIBUTE')          ? this.getFieldValue('ATTRIBUTE')          : 'MANA';
      const sSE = this.getField('SUMMON_ENTITY_NAME') ? this.getFieldValue('SUMMON_ENTITY_NAME') : 'SUMMON_1';
      while (this.inputList.length) this.removeInput(this.inputList[0].name);
      if (slotName === 'OUTPUT') {
        this.appendDummyInput('ATTR_ROW').appendField(new Blockly.FieldDropdown([
          ['魔力','MANA'],['光','LIGHT'],['水','WATER'],['樹木','TREE'],['石','STONE'],
          ['鉄','IRON'],['金','GOLD'],['紙','PAPER'],['布','CLOTH'],['ガラス','GLASS'],
        ]),'ATTRIBUTE');
        this.setFieldValue(sAt, 'ATTRIBUTE');
      } else if (slotName === 'ENTITY') {
        this.appendDummyInput('SUMMON_ROW').appendField(new Blockly.FieldDropdown(SUMMON_ENTITY_OPTIONS),'SUMMON_ENTITY_NAME');
        this.setFieldValue(sSE, 'SUMMON_ENTITY_NAME');
      } else {
        this.appendDummyInput('FILTER_ROW')
          .appendField(new Blockly.FieldDropdown([
            ['自分','SELF'],['敵','ENEMY'],['味方','ALLY'],['召喚物','SUMMON'],['野生','WILD'],
            ['所有者なし','NO_OWNER'],['魔術','MAGIC'],['なし','NONE'],
          ]),'OWNER')
          .appendField(new Blockly.FieldLabel('の'),'NO_LABEL')
          .appendField(new Blockly.FieldDropdown([
            ['自分','SELF'],['敵','ENEMY'],['味方','ALLY'],['床面','GROUND'],['天井','CEILING'],
            ['召喚物','SUMMON'],['空気','AIR'],['肺','LUNG'],['手','HAND'],['足','FOOT'],
            ['頭','HEAD'],['胴','BODY'],['腰','WAIST'],['腕','ARM'],['目','EYE'],['耳','EAR'],
            ['口','MOUTH'],['尾','TAIL'],['肉体','FLESH'],['植物','PLANT'],['光','LIGHT'],
            ['太陽光','SUN'],['月光','MOON'],['魔力','MANA'],['体力','HP'],
            ['範囲指定(半径○m以内)','RANGE_IN'],['範囲指定(半径○mの外)','RANGE_OUT'],
            ['時間指定(○秒以内)','TIME_IN'],['時間指定(○秒後)','TIME_AFTER'],
          ]),'PLACE')
          .appendField(new Blockly.FieldLabel('において'),'NI_LABEL')
          .appendField(new Blockly.FieldDropdown([
            ['存在する','EXIST'],['存在しない','NOT_EXIST'],['接触している','TOUCH'],['接触していない','NOT_TOUCH'],
            ['動いている','MOVE'],['止まっている','STOP'],['見えている','SEE'],['見えていない','NOT_SEE'],
            ['増えている','INC'],['減っている','DEC'],['攻撃した','ATK'],['攻撃された','ATKED'],
            ['防御した','DEF'],['防御された','DEFED'],['回復した','HEAL'],['回復された','HEALED'],
            ['消費した','USED'],['召喚した','SUMMON'],['発動した','CAST'],['停止した','STOPPED'],
            ['囲んだ','SURROUND'],['囲まれた','SURROUNDED'],['乗せた','LOAD'],['降ろした','UNLOAD'],
            ['上回った','EXCEED'],['下回った','BELOW'],
          ]),'STATE')
          .appendField(new Blockly.FieldDropdown([
            ['自分','SELF'],['敵','ENEMY'],['味方','ALLY'],['床面','GROUND'],['天井','CEILING'],
            ['召喚物','SUMMON'],['空気','AIR'],['肺','LUNG'],['手','HAND'],['足','FOOT'],
            ['頭','HEAD'],['胴','BODY'],['腰','WAIST'],['腕','ARM'],['目','EYE'],['耳','EAR'],
            ['口','MOUTH'],['尾','TAIL'],['肉体','FLESH'],['光','LIGHT'],['太陽光','SUN'],
            ['月光','MOON'],['魔力','MANA'],['体力','HP'],['詳細設定(ブロックを接続)','DETAIL'],
          ]),'SUBJECT');
        this.setFieldValue(sO,'OWNER'); this.setFieldValue(sP,'PLACE');
        this.setFieldValue(sSt,'STATE'); this.setFieldValue(sSu,'SUBJECT');
        rebuildTargetExtras(this, sPN);
      }
    },
    updateByType(_type: string): void { /* no-op */ },
    saveExtraState(this: Blockly.Block) {
      const state: { placeNum?: number; summonEntityName?: string } = {};
      if (this.getField('PLACE_NUM'))          state.placeNum        = Number(this.getFieldValue('PLACE_NUM'));
      if (this.getField('SUMMON_ENTITY_NAME')) state.summonEntityName = this.getFieldValue('SUMMON_ENTITY_NAME');
      return state;
    },
    loadExtraState(this: Blockly.Block, state: { placeNum?: number; summonEntityName?: string }) {
      const spn = typeof state.placeNum         === 'number' ? state.placeNum         : undefined;
      const sse = typeof state.summonEntityName === 'string' ? state.summonEntityName : undefined;
      queueMicrotask(() => {
        const slotName = getConnectedInputName(this);
        (this as Blockly.Block & { updateShape_:(s:string)=>void }).updateShape_(slotName);
        if (spn !== undefined && this.getField('PLACE_NUM'))          this.setFieldValue(String(spn), 'PLACE_NUM');
        if (sse !== undefined && this.getField('SUMMON_ENTITY_NAME')) this.setFieldValue(sse,          'SUMMON_ENTITY_NAME');
      });
    },
  };
};

// =========================
// ワークスペース JSON シリアライズ
// =========================
export function serializeMagicWorkspace(workspace: Blockly.Workspace): object | null {
  return Blockly.serialization.workspaces.save(workspace);
}
export function magicWorkspaceToJson(workspace: Blockly.Workspace, pretty = false): string {
  return pretty
    ? JSON.stringify(serializeMagicWorkspace(workspace), null, 2)
    : JSON.stringify(serializeMagicWorkspace(workspace));
}
export function appendDefaultMagicStartIfEmpty(workspace: Blockly.Workspace): void {
  if (workspace.getAllBlocks(false).length > 0) return;
  Blockly.serialization.blocks.append(
    { type: 'magic_start', x: 40, y: 40, inputs: { START_MODIFIER: { block: { type: 'magic_modifier' } } } },
    workspace, { recordUndo: false }
  );
}
export function getMagicModifierPayload(block: Blockly.Block): MagicModifierPayload | null {
  if (block.type !== 'magic_modifier') return null;
  const b = asModifierBlock(block);
  b.syncFromVisibleFields_();
  return { ...b.modifierPayload_ };
}

// =========================
// 🔥 MP計算
// =========================
export const calculateTotalMP = (workspace: Blockly.Workspace): number => {
  let total = 0;
  const starts = workspace.getTopBlocks(true).filter(b => b.type === 'magic_start');

  const calcTarget    = (_: Blockly.Block | null) => 100;
  const calcModChain  = (block: Blockly.Block | null): number => {
    let mul = 1, b = block;
    while (b) {
      if (b.type === 'magic_modifier' && b.getField('MULTIPLIER'))
        mul *= Number(b.getFieldValue('MULTIPLIER')) || 1;
      b = b.getNextBlock();
    }
    return mul;
  };
  const calcEffect = (block: Blockly.Block | null): number => {
    let mp = 0, b = block;
    while (b) {
      if (b.type === 'magic_effect') {
        const type = b.getFieldValue('TYPE');
        let base = (TYPE_MULTIPLIER[type] || 1) * calcTarget(b.getInputTargetBlock('TARGET'));
        base *= calcModChain(b.getInputTargetBlock('MOD'));
        mp += base;
      }
      b = b.getNextBlock();
    }
    return mp;
  };

  for (const start of starts) {
    let mp = 0, isPerSecond = false;
    let trig = start.getNextBlock();
    while (trig) {
      if (trig.type === 'magic_trigger') {
        // EXECUTE スロットの有無で NORMAL モードを判定ダンゴムシ
        const execInp = trig.getInput('EXECUTE');
        if (execInp) {
          if (trig.getFieldValue('AUTO_CAST') === 'TRUE') isPerSecond = true;
          mp += calcEffect(trig.getInputTargetBlock('EXECUTE'));
        }
      }
      trig = trig.getNextBlock();
    }
    const displayInp = start.getInput('MP_DISPLAY');
    if (displayInp) displayInp.fieldRow[0].setValue(`消費MP: ${mp}${isPerSecond ? '/s' : ''}`);
    start.setColour(mp > 9000 ? '#ff0000' : mp > 5000 ? '#ffff00' : 270);
    total += mp;
  }
  return total;
};