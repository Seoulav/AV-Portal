// dagre@0.8.5에는 타입이 없다. layout.ts가 쓰는 만큼만 적는다
declare module 'dagre' {
  const dagre: import('./layout').DagreModule;
  export default dagre;
}
