export const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '開始ブロック',
      colour: '270',
      contents: [
        {
          kind: 'block',
          type: 'magic_start',
          inputs: {
            START_MODIFIER: {
              block: {
                type: 'magic_modifier',
              },
            },
          },
        },
      ],
    },
    {
      kind: 'category',
      name: 'トリガー',
      colour: '60',
      contents: [{ kind: 'block', type: 'magic_trigger' }],
    },
    {
      kind: 'category',
      name: '事象ブロック',
      colour: '0',
      contents: [{ kind: 'block', type: 'magic_effect' }],
    },
    {
      kind: 'category',
      name: '対象ブロック',
      colour: '120',
      contents: [{ kind: 'block', type: 'magic_target' }],
    },
    {
      kind: 'category',
      name: '節約ブロック',
      colour: '210',
      contents: [{ kind: 'block', type: 'magic_modifier' }],
    },
  ],
};
