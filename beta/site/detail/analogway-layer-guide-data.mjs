export const modelData = [
  {slug:'pulse-4k',name:'Pulse 4K',platform:'midra',inputs4k:8,outputConnectors:2,pgmOutputs:2,pgmScreens:2,maxOutputsPerScreen:1,mixingLayers:2,splitLayers:4,mixingLayersPerScreen:2,splitLayersPerScreen:4,auxOutputs:1,order:0},
  {slug:'eikos-4k',name:'Eikos 4K',platform:'midra',inputs4k:8,outputConnectors:2,pgmOutputs:2,pgmScreens:2,maxOutputsPerScreen:2,mixingLayers:2,splitLayers:4,mixingLayersPerScreen:2,splitLayersPerScreen:4,auxOutputs:1,order:1},
  {slug:'zenith-100',name:'Zenith 100',platform:'alta',inputs4k:11,outputConnectors:4,pgmOutputs:3,pgmScreens:3,maxOutputsPerScreen:3,mixingLayers:3,splitLayers:6,mixingLayersPerScreen:3,splitLayersPerScreen:6,auxOutputs:2,order:2},
  {slug:'zenith-200',name:'Zenith 200',platform:'alta',inputs4k:14,outputConnectors:6,pgmOutputs:4,pgmScreens:4,maxOutputsPerScreen:4,mixingLayers:4,splitLayers:8,mixingLayersPerScreen:4,splitLayersPerScreen:8,auxOutputs:4,order:3},
  {slug:'aquilon-rsalpha',name:'Aquilon RS alpha',platform:'aquilon',inputs4k:8,outputConnectors:4,pgmOutputs:4,pgmScreens:4,maxOutputsPerScreen:4,mixingLayers:4,splitLayers:8,mixingLayersPerScreen:4,splitLayersPerScreen:8,processingUnits:1,order:4},
  {slug:'aquilon-rs1',name:'Aquilon RS1',platform:'aquilon',inputs4k:16,outputConnectors:8,pgmOutputs:4,pgmScreens:4,maxOutputsPerScreen:4,mixingLayers:4,splitLayers:8,mixingLayersPerScreen:4,splitLayersPerScreen:8,processingUnits:1,order:5},
  {slug:'aquilon-rs2',name:'Aquilon RS2',platform:'aquilon',inputs4k:16,outputConnectors:12,pgmOutputs:8,pgmScreens:8,maxOutputsPerScreen:4,mixingLayers:8,splitLayers:16,mixingLayersPerScreen:4,splitLayersPerScreen:8,processingUnits:2,order:6},
  {slug:'aquilon-rs3',name:'Aquilon RS3',platform:'aquilon',inputs4k:24,outputConnectors:12,pgmOutputs:8,pgmScreens:8,maxOutputsPerScreen:4,mixingLayers:8,splitLayers:16,mixingLayersPerScreen:4,splitLayersPerScreen:8,processingUnits:2,order:7},
  {slug:'aquilon-rs4',name:'Aquilon RS4',platform:'aquilon',inputs4k:24,outputConnectors:16,pgmOutputs:12,pgmScreens:12,maxOutputsPerScreen:4,mixingLayers:12,splitLayers:24,mixingLayersPerScreen:4,splitLayersPerScreen:8,processingUnits:3,order:8},
  {slug:'aquilon-rs5',name:'Aquilon RS5',platform:'aquilon',inputs4k:32,outputConnectors:16,pgmOutputs:12,pgmScreens:12,maxOutputsPerScreen:4,mixingLayers:12,splitLayers:24,mixingLayersPerScreen:4,splitLayersPerScreen:8,processingUnits:3,order:9},
  {slug:'aquilon-rs6',name:'Aquilon RS6',platform:'aquilon',inputs4k:32,outputConnectors:20,pgmOutputs:16,pgmScreens:16,maxOutputsPerScreen:4,mixingLayers:16,splitLayers:32,mixingLayersPerScreen:4,splitLayersPerScreen:8,processingUnits:4,order:10},
  {slug:'aquilon-cmini',name:'Aquilon Cmini',platform:'aquilon-c',inputs4k:8,outputConnectors:12,pgmOutputs:4,pgmScreens:4,maxOutputsPerScreen:4,mixingLayers:4,splitLayers:8,mixingLayersPerScreen:4,splitLayersPerScreen:8,processingUnits:1,connectorBasis:'BTO 최대 구성',order:11},
  {slug:'aquilon-c',name:'Aquilon C',platform:'aquilon-c',inputs4k:16,outputConnectors:16,pgmOutputs:8,pgmScreens:8,maxOutputsPerScreen:4,mixingLayers:8,splitLayers:16,mixingLayersPerScreen:4,splitLayersPerScreen:8,processingUnits:2,connectorBasis:'BTO 최대 구성',order:12},
  {slug:'aquilon-cplus',name:'Aquilon C+',platform:'aquilon-c',inputs4k:24,outputConnectors:20,pgmOutputs:12,pgmScreens:12,maxOutputsPerScreen:4,mixingLayers:12,splitLayers:24,mixingLayersPerScreen:4,splitLayersPerScreen:8,processingUnits:3,connectorBasis:'BTO 최대 구성',order:13},
  {slug:'aquilon-cmax',name:'Aquilon Cmax',platform:'aquilon-c',inputs4k:32,outputConnectors:24,pgmOutputs:16,pgmScreens:16,maxOutputsPerScreen:4,mixingLayers:16,splitLayers:32,mixingLayersPerScreen:4,splitLayersPerScreen:8,processingUnits:4,connectorBasis:'BTO 최대 구성',order:14},
];

export const exampleConfigurations = {
  '2x2-mix4': {label:'8K LED월 1면 · 2×2 · 믹싱 4',screens:[{outputs:4,layerType:'mixing',layers:4}],auxOutputs:0,inputs4k:4},
  '3-screens-mix2-aux2': {label:'4K 화면 3개 · 화면마다 믹싱 2 · 보조 출력 2',screens:[1,2,3].map(()=>({outputs:1,layerType:'mixing',layers:2})),auxOutputs:2,inputs4k:6},
  '1-screen-split4-aux1': {label:'4K 화면 1개 · 분할 4 · 보조 출력 1',screens:[{outputs:1,layerType:'split',layers:4}],auxOutputs:1,inputs4k:4},
};

export const guideEvidence = {
  aquilon: [61,66,67,68,69,79],
  alta: [25,42,43,46,50,52],
  midra: [25,41,42,44],
  datasheets: {aquilon:[1,3],midra:[5,6],alta:[6]},
  simulators:[
    {label:'AW Midra 4K Simulator',url:'https://www.analogway.com/products/midra-4k-simulator'},
    {label:'AW Alta 4K Simulator',url:'https://www.analogway.com/products/alta-4k-simulator'},
    {label:'AW Aquilon Simulator',url:'https://www.analogway.com/products/aw-livepremier-simulator'},
  ],
};
